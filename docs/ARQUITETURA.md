# Arquitetura — Backend (NestJS) do cupom de desconto

> Escopo entregue: **endpoint de validação** (`POST /coupons/validate`). Hexagonal (Ports & Adapters), domínio puro, NestJS só na casca. Construído em TDD estrito (red→green).

## 1. Contexto

Dado um carrinho (itens) e um código de cupom, o backend diz se o cupom é **aplicável** e qual o **valor final** com desconto — tratando os edge cases (inexistente, inativo, não iniciado, expirado, limite atingido, abaixo do mínimo) com clareza. Critério nº 1 da avaliação: edge cases; nº 2: qualidade de código (tipagem honesta sem `any`, separação de camadas, legibilidade).

## 2. Camadas (`core` / `ports` / `usecase` / `adapter`)

De dentro para fora; a dependência aponta sempre para o centro:

- **`core`** — domínio puro: `money`, `discount`, `cart`, `coupon`, `normalize-code`, `evaluate-coupon`. Determinístico, sem I/O, sem framework. Os tipos/enums/interfaces ficam em `core/models/`.
- **`ports`** — contratos (interfaces) + tokens DI (`Symbol`): `CouponRepository`, `Clock`. Fronteira do hexágono; só referencia tipos do `core`.
- **`usecase`** — `ValidateCouponUseCase` (`@Injectable`): orquestra `subtotal → normalize → findByCode → evaluate` e devolve um `ValidationOutcome` (valor, não exceção).
- **`adapter`** — fala com o mundo: `http` (controller, DTOs, mappers, filtro, module), `persistence` (repo in-memory + seed), `clock` (SystemClock).

**Regra de dependência (lint `import/no-restricted-paths` + `no-restricted-imports`):** `core` não importa nada interno; `ports` só `core`; `usecase` importa `core`+`ports` (e `@nestjs/common` para DI); `adapter` importa para dentro. `core`/`ports` nunca importam `@nestjs/*` nem `class-validator`.

```
backend/src/
  core/ { money.ts discount.ts cart.ts coupon.ts normalize-code.ts evaluate-coupon.ts
          models/ { money discount cart coupon rejection evaluation validate-coupon }.model.ts }
  ports/ { coupon-repository.ts clock.ts }
  usecase/ validate-coupon.usecase.ts
  adapter/ http/ { coupons.controller.ts coupons.module.ts configure-app.ts invalid-coupon-code.filter.ts
                   dto/ { cart-item cart validate-coupon }.dto.ts  mappers/ { to-command result-to-http }.ts }
           persistence/ { in-memory-coupon.repository.ts seed.ts }  clock/ system.clock.ts
  app.module.ts  main.ts
```

## 3. Modelo de dados (`Coupon`)

In-memory, mas mapeia 1:1 para uma tabela (DDL como caminho de produção).

```ts
type DiscountType = 'PERCENTAGE' | 'FIXED'; // enum

interface Coupon {
  id: string;
  code: string;                 // normalizado (ver §5), unico
  description: string | null;
  discountType: DiscountType;
  discountValue: number;        // PERCENTAGE: 1..100 | FIXED: centavos (>0)
  maxDiscountCents: number | null;  // teto (PERCENTAGE)
  minPurchaseCents: number | null;  // minimo do subtotal
  startsAt: string | null;      // ISO 8601 com offset
  expiresAt: string | null;     // ISO 8601 com offset
  maxRedemptions: number | null;    // limite de usos
  redemptionCount: number;      // usos ja feitos (no seed)
  active: boolean;              // kill switch
  createdAt: string;
}
```

`parseCoupon` é a factory fail-fast que valida invariantes (percentual 1..100, fixo >0, caps ≥0, `maxRedemptions` ≥1, `startsAt ≤ expiresAt`, datas ISO com offset) e normaliza o `code` — protegendo o seed/dado armazenado.

## 4. Cálculo — `computeDiscount` (puro)

```
raw      = PERCENTAGE ? trunc(subtotal * percent / 100) : discountValue   // FLOOR
capped   = maxDiscountCents == null ? raw : min(raw, maxDiscountCents)     // teto
discount = min(max(capped, 0), subtotal)                                  // clamp [0, subtotal]
final    = subtotal - discount                                            // >= 0 por construcao
```

Dinheiro sempre em **centavos inteiros**; guardas de `Number.isSafeInteger` (overflow) em `money.ts`. Arredondamento FLOOR documentado (`199 @ 10% ⇒ 19`). Invariante: `discount + final === subtotal`.

## 5. Pipeline de validação (`evaluateCoupon`, puro)

Ordem fail-fast (retorna o 1º motivo). `COUPON_NOT_FOUND` é tratado no use-case (repo retorna `null`); `evaluateCoupon` cobre os demais:

1. `active` → `COUPON_INACTIVE`
2. `now ≥ startsAt` → `COUPON_NOT_STARTED`
3. `now ≤ expiresAt` → `COUPON_EXPIRED`
4. `redemptionCount < maxRedemptions` → `REDEMPTION_LIMIT_REACHED`
5. `subtotal ≥ minPurchaseCents` → `MINIMUM_NOT_MET` (carrega `missingCents`)
6. sucesso → `computeDiscount`

Fronteiras temporais **inclusivas** (`now == expiresAt` ainda vale), comparadas por epoch ms; campos `null` são no-op. Mínimo medido sobre o **subtotal**. **Normalização de `code`** (`normalize-code.ts`): NFKC + remoção de whitespace/zero-width + uppercase + charset `[A-Z0-9]`; vazio/charset inválido → `InvalidCouponCodeError` (mapeado para 422 na borda).

## 6. Contrato HTTP e fluxo

`POST /coupons/validate` — read-only. Controller fino: `dto → toValidateCommand → useCase.execute → toValidateResponse`.

- **200 válido:** `{ valid:true, couponCode, discountType, subtotalCents, discountCents, finalCents }`
- **200 inválido:** `{ valid:false, reason, message, subtotalCents, missingCents? }` (`missingCents` só em `MINIMUM_NOT_MET`)
- **422:** `ValidationPipe` (`whitelist`+`forbidNonWhitelisted`+`errorHttpStatusCode:422`) para request malformado; `InvalidCouponCodeFilter` para código inválido.

**Controle de fluxo:** domínio/use-case retornam `ValidationOutcome` (valor). Só a borda traduz para HTTP — 200 para desfecho de negócio, 422 para request quebrado.

## 7. Matriz de edge cases (coberta por testes)

| Caso | Tratamento |
|---|---|
| Inexistente / inativo / não iniciado / expirado / limite atingido | `reason` correspondente (200, `valid:false`) |
| Borda `now == expiresAt` | válido (inclusivo) |
| Limite `redemptionCount == max-1` | passa; `== max` rejeita |
| Abaixo do mínimo | `MINIMUM_NOT_MET` + `missingCents`; `subtotal == min` qualifica |
| Fixo > subtotal / 100% | `final = 0` (clamp), nunca negativo |
| Percentual com teto / `10%` de `<10c` | aplica teto / desconto 0 |
| Itens vazios / cents negativo ou float / `quantity<1` / campo extra | **422** (`ValidationPipe`) |
| `subtotal = 0` (itens preço 0 bem-formados) | válido (desconto 0) |
| `totalCents` divergente dos itens | **422** |
| Código com espaço/maiúscula/NBSP/zero-width | normalizado |
| Código vazio/whitespace-only/charset inválido | **422** |
| Cupom malformado (seed) | `parseCoupon` falha-alto |

## 8. Testes (Jest + Supertest) e TDD

144 testes (121 unit + 23 e2e). Unit do `core`/use-case rodam **sem subir o Nest** (fakes de `CouponRepository`/`Clock`; relógio falso para bordas temporais). e2e via `Test.createTestingModule` + Supertest, com `CLOCK` sobreposto por um relógio fixo. Cada unidade foi feita em **red→green visível** (um commit do teste falhando, outro da implementação).

## 9. Fora de escopo (assumido — e por quê)

- **Auth / multi-tenant / painel admin / criação de cupom** — enunciado exclui; cupons só por seed (`parseCoupon` é o portão de entrada do dado).
- **Resgate / pagamento** — o desafio pede só a validação; o limite de usos é checado na validação (`redemptionCount < maxRedemptions`), sem incremento. Um resgate real dependeria de pagamento/pedido, também fora de escopo.
- **i18n / multimoeda** — BRL em centavos; formatação só na futura UI.
- **Concorrência distribuída / durabilidade** — in-memory single-process; SQLite transacional seria o caminho de produção.
