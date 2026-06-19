# Desafio Fullstack Sênior — Cupom de desconto no checkout (Mibbers)

Feature de **validação de cupom de desconto no checkout**: um endpoint recebe um carrinho (itens) e um código de cupom e responde se o cupom é aplicável e qual o valor final com desconto — ou o motivo da rejeição.

> Foco: **regras de negócio, edge cases e qualidade de código**. Escopo deliberadamente enxuto ao que o desafio pede (ver [Fora de escopo](#fora-de-escopo)).

## Stack

- **Backend:** NestJS 11 (Node.js + TypeScript), arquitetura **hexagonal** (Ports & Adapters).
- **Persistência:** in-memory atrás de uma interface (`CouponRepository`), com seed — drop-in para SQLite. Persistência não é o foco.
- **Testes:** Jest (unit do core/use-case sem subir o Nest) + Supertest (e2e). **144 testes** (121 unit + 23 e2e).
- **Frontend:** Next.js *(próximo passo, ainda não implementado)*.

## Como rodar

```bash
cd backend
npm install

npm run start:dev      # API em http://localhost:3001 (PORT configuravel)
npm test               # testes unitarios (core + use-case)
npm run test:e2e       # testes e2e (controller, via Supertest)
npm run lint           # ESLint: sem `any` + regra de fronteira entre camadas
npm run build          # compila para dist/
```

## API

### `POST /coupons/validate`

Read-only (não consome uso). O subtotal é **recomputado no servidor** a partir dos itens; `cart.totalCents` é opcional e, se enviado, deve bater com o recomputado (senão `422`).

```jsonc
// request
{
  "couponCode": "LANC10",
  "cart": {
    "items": [{ "id": "p1", "name": "Curso", "unitPriceCents": 19900, "quantity": 1 }],
    "totalCents": 19900            // opcional
  }
}
```

| Resultado | Status | Corpo |
|---|---|---|
| Válido | `200` | `{ "valid": true, "couponCode", "discountType", "subtotalCents", "discountCents", "finalCents" }` |
| Rejeitado (negócio) | `200` | `{ "valid": false, "reason", "message", "subtotalCents", "missingCents"? }` |
| Request malformado | `422` | erro do `ValidationPipe` (itens inválidos, `quantity<1`, cents negativo/fracionado, `couponCode` vazio/charset, `totalCents` divergente, campo extra) |

`missingCents` aparece **apenas** em `MINIMUM_NOT_MET`. `reason` ∈ `COUPON_NOT_FOUND | COUPON_INACTIVE | COUPON_NOT_STARTED | COUPON_EXPIRED | REDEMPTION_LIMIT_REACHED | MINIMUM_NOT_MET`.

```bash
# exemplo
curl -X POST localhost:3001/coupons/validate -H 'Content-Type: application/json' \
  -d '{"couponCode":"lanc10","cart":{"items":[{"id":"p1","name":"Curso","unitPriceCents":19900,"quantity":1}]}}'
# => {"valid":true,"couponCode":"LANC10","discountType":"PERCENTAGE","subtotalCents":19900,"discountCents":1990,"finalCents":17910}
```

### Cupons de seed (para testar cada caso)

| Code | Regra | Demonstra |
|---|---|---|
| `LANC10` | 10%, mín. R$50, limite 100 | happy path / mínimo |
| `BLACK50` | fixo R$50, mín. R$100 | desconto fixo |
| `MEGA90` | 90% com teto R$30 | teto de percentual |
| `FIXOVER` | fixo R$500 | fixo > subtotal → final R$0 |
| `NORESTR` | 10% sem restrição | todos os opcionais nulos |
| `PCT100` | 100% | final R$0 |
| `EXPIRED` | expirado | `COUPON_EXPIRED` |
| `SOON` | inicia no futuro | `COUPON_NOT_STARTED` |
| `FULL` | limite atingido | `REDEMPTION_LIMIT_REACHED` |
| `OFF` | inativo | `COUPON_INACTIVE` |

## Arquitetura

Hexagonal: domínio puro no centro, NestJS só na casca. Detalhes em [docs/ARQUITETURA.md](docs/ARQUITETURA.md); requisitos e critérios de aceite em [docs/REQUISITOS.md](docs/REQUISITOS.md).

```
backend/src/
  core/         # dominio puro (sem framework): money, discount, cart, coupon, normalize-code, evaluate-coupon
    models/     # tipos/enums/interfaces do dominio (Cents, DiscountType, Coupon, RejectionCode, ...)
  ports/        # contratos: CouponRepository, Clock (+ tokens DI)
  usecase/      # ValidateCouponUseCase (@Injectable)
  adapter/      # http (controller, DTOs, mappers, filtro, module) · persistence (repo + seed) · clock
  main.ts
```

**Regra de dependência (garantida por lint):** `core` ← `ports` ← `usecase`/`adapter`. `core` e `ports` não importam `@nestjs/*` nem `class-validator`; o use-case é Nest-native (`@Injectable`) mas não conhece HTTP.

### Decisões-chave

- **Dinheiro em centavos (inteiros)** em todo o sistema — sem float.
- **Subtotal recomputado no servidor** a partir dos itens (não confia no cliente).
- **Cálculo puro e blindado** (`computeDiscount`): arredondamento FLOOR, teto e clamp `[0, subtotal]` garantindo `final ≥ 0` por construção.
- **Resultados de negócio são valores** (`ValidationOutcome`), não exceções; `HttpException` só na borda (422 para malformado / código inválido).
- **Relógio injetável** (`Clock`) → bordas temporais (expiração) testáveis de forma determinística.
- **Enums no lugar de strings mágicas**; sem comentários no código.

## Desenvolvido em TDD estrito

Cada unidade foi construída com o ciclo **Red → Green visível**: primeiro um commit `test(...) (red)` com o teste falhando, depois um commit `feat(...) (green)` com a implementação mínima. O histórico do git documenta o processo.

## Fora de escopo

Conforme o enunciado e decisões registradas: sem autenticação, sem **painel administrativo / criação de cupom** (cupons só por seed), sem gateway de pagamento e **sem endpoint de resgate** (o desafio pede só a validação; o limite de usos é checado na validação via `redemptionCount`), sem i18n/multimoeda, sem concorrência distribuída (in-memory single-process; transação SQLite seria o caminho de produção).
