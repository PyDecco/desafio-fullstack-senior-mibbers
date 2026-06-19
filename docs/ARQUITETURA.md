# Backend (NestJS) — Cupom de desconto no checkout (Mibbers)

> Passo 1 do desafio: **mapear o backend — tabelas, estrutura e regras** sobre **NestJS**, em **arquitetura hexagonal (Ports & Adapters)**. Frontend (tela Next.js) fica para um passo seguinte.
> Método: documento de **Arquitetura/Modelagem** (BMAD direto). O núcleo de regras de negócio já foi endurecido por revisão adversarial em 3 lentes (edge cases, corretude monetária, API/camadas/tipagem) e **independe do framework**.

---

## 1. Contexto

No checkout da Mibbers, o produtor oferece cupons em campanhas. O backend precisa, dado um **carrinho** (itens + valor total) e um **código de cupom**, dizer se o cupom é **aplicável** e qual o **valor final** com desconto — tratando os edge cases (expirado, abaixo do mínimo, limite estourado, inexistente, inativo, ainda-não-iniciado) com clareza. Critério nº 1 da avaliação: **edge cases**; nº 2: **qualidade de código** (tipagem honesta sem `any`, separação de camadas, legibilidade).

Decisão central de modelagem: **validar ≠ resgatar**. `validate` é um *preview* read-only (não consome uso); `redeem` consome 1 uso, é idempotente e atômico. Reflete "os 100 primeiros **resgates**" do enunciado.

---

## 2. Vocabulário e camadas (hexagonal — `core` / `ports` / `usecase` / `adapter`)

Usamos o vocabulário **Ports & Adapters** (em vez de "domain/application/infrastructure"), porque "adapter" nomeia o **papel** — *traduzir entre a aplicação e uma tecnologia concreta* — e evita a ambiguidade do termo "infraestrutura". As camadas, de dentro para fora:

- **`core`** — domínio puro: validação, cálculos, helpers. Determinístico, sem I/O, sem framework. Lê como linguagem de negócio.
- **`ports`** — os **contratos** (interfaces): `CouponRepository`, `Clock`. É a **fronteira** do hexágono e fica **lado a lado** (não dentro do `usecase`), porque tanto quem consome (`usecase`) quanto quem implementa (`adapter`) dependem dele. Só referencia tipos do `core`. São portas **OUT/driven** (o app chama pra fora); a porta **IN/driving** é a própria classe do use-case (YAGNI extrair interface aqui).
- **`usecase`** — orquestração *passo a passo*: lê o que vem de fora (via `ports`), chama o `core` na ordem certa, devolve `Result`.
- **`adapter`** — anel externo que fala com o mundo. Implementa as portas. **A configuração de cada recurso (ex.: connection/pool do banco) mora junto do seu adapter** (`adapter/persistence/`). Sub-divisão pelo eixo do hexágono:
  - **IN (driving):** quem chama a aplicação → `adapter/http` (controller NestJS).
  - **OUT (driven):** quem a aplicação chama → `adapter/persistence` (repositório), `adapter/clock` (relógio).

**Escopo proporcional (decisão sênior):** o template hexagonal "cheio" tem várias portas IN (HTTP/gRPC/AMQP) e OUT (DB/HTTP-sender/eventos/auditoria). Para esta feature usamos **1 porta IN (HTTP)** e **2 OUT (repositório + relógio)**. A estrutura **admite** gRPC/AMQP/eventos/auditoria como novos adapters no futuro — deixados de fora **por escopo**, não por desconhecimento.

| Decisão | Escolha | Por quê |
|---|---|---|
| Topologia | **Backend NestJS standalone + Next.js (web)** em pastas separadas | Atende o enunciado; o `core` é o mesmo |
| Framework | **NestJS 11** (adapter Express padrão) | Pedido do usuário; DI/módulos/pipes estruturam o anel `adapter` |
| Camadas | **`core` + `usecase` 100% puros** (sem decorators); NestJS só em `adapter/http` | Núcleo importável/testável fora do Nest = separação real e verificável |
| DI / ports | `ports/` é uma camada própria (lado a lado); tokens são `Symbol`; fiação por `useFactory`/`useClass` no module | `core`/`ports`/`usecase` **não importam `@nestjs/*`** |
| Validação de entrada | **`class-validator` + `ValidationPipe` global** (`whitelist`, `forbidNonWhitelisted`, `transform`, `errorHttpStatusCode: 422`) | Idiomático; DTO mapeado p/ comando de domínio (core não importa a lib) |
| Controle de fluxo | Casos de negócio são **valores** (`Result`); `HttpException` só na borda | Domínio nunca lança para fluxo; I/O real → 500 |
| Persistência | **In-memory atrás de `CouponRepository`** + seed | Não é o foco; DDL SQLite documentada como drop-in (a config do DB viveria em `adapter/persistence`) |
| Dinheiro | **Inteiros em centavos** em todo o sistema | Elimina bugs de float em moeda |
| Subtotal | **Recomputado no servidor a partir dos itens**; `totalCents` do cliente é validado, nunca confiado | Fecha o vetor de adulteração |
| Testes | **Jest** (unit do core sem Nest) + **Supertest** (e2e via `Test.createTestingModule`) | Scaffold padrão do Nest |

---

## 3. Estrutura de pastas (backend NestJS)

```
backend/
  src/
    core/                           # CORE — 100% puro (proibido importar @nestjs/*, class-validator)
      money.ts                      # tipo Cents, guards de inteiro/seguro, soma segura
      cart.ts                       # Cart, CartItem, computeSubtotal(items) -> Cents
      coupon.ts                     # Coupon, DiscountType; parseCoupon() (factory c/ invariantes)
      discount.ts                   # computeDiscount(coupon, subtotal) -> Breakdown  (PURA)
      rejection.ts                  # RejectionReason (união) + payload por motivo
      evaluate-coupon.ts            # evaluateCoupon(coupon,{now,subtotalCents}) -> ValidationResult (PURA)
    ports/                          # PORTS — contratos (fronteira do hexágono); LADO A LADO
      coupon-repository.ts          # interface + COUPON_REPOSITORY (Symbol)
      clock.ts                      # interface Clock + CLOCK (Symbol)
    usecase/                        # UseCase — orquestração passo a passo (depende de core + ports)
      validate-coupon.usecase.ts    # load -> evaluateCoupon -> computeDiscount
      redeem-coupon.usecase.ts      # evaluate -> tryRedeem (atômico) -> snapshot
    adapter/                        # ADAPTER — fala com o mundo (única camada que conhece o Nest)
      http/                         # IN (driving)
        coupons.module.ts           # fiação DI (useFactory/useClass + tokens)
        coupons.controller.ts       # POST /coupons/validate, /coupons/redeem
        dto/cart-item.dto.ts        # class-validator
        dto/validate-coupon.dto.ts
        mappers/to-command.ts       # DTO -> comando de domínio (tipos puros)
        mappers/result-to-http.ts   # Result/Outcome -> resposta | HttpException (409/422)
      persistence/                  # OUT (driven)  — config do DB moraria aqui
        in-memory-coupon.repository.ts
        seed.ts                     # cupons de exemplo cobrindo todos os edge cases
      clock/                        # OUT (driven)
        system.clock.ts
    app.module.ts                   # importa o module de coupons
    main.ts                         # bootstrap: ValidationPipe(422), CORS, PORT
  test/                             # *.e2e-spec.ts (Supertest) + *.spec.ts (unit do core)
  package.json  tsconfig.json  nest-cli.json  .eslintrc  README.md
web/                                # Next.js (passo seguinte)
```

**Direção de dependência (regra dura, garantida por lint):** `core` não importa nada do projeto; `ports` importa só tipos do `core`; `usecase` importa `core` + `ports`; `adapter` importa para dentro (`core` + `ports` + `usecase`) + frameworks. **`core`/`ports`/`usecase` nunca importam `@nestjs/*` nem `class-validator`** (tokens são `Symbol`, sem dependência de Nest). Enforcement: `eslint-plugin-import` `no-restricted-imports` (ou `dependency-cruiser`) — é o que torna a separação verificável.

---

## 4. Modelo de dados ("tabelas")

Persistência in-memory, mas o modelo mapeia 1:1 para tabelas (DDL SQLite documentada como caminho de produção).

### 4.1 `Coupon`

```ts
type DiscountType = 'PERCENTAGE' | 'FIXED';

interface Coupon {
  id: string;                 // uuid
  code: string;               // normalizado (ver §5), único
  description: string | null;
  discountType: DiscountType;
  discountValue: number;      // PERCENTAGE: 1..100 | FIXED: centavos (>0)
  maxDiscountCents: number | null;  // teto de desconto (aplicável a PERCENTAGE)
  minPurchaseCents: number | null;  // mínimo do subtotal p/ qualificar
  startsAt: string | null;    // ISO 8601 com offset (UTC 'Z')
  expiresAt: string | null;   // ISO 8601 com offset (UTC 'Z')
  maxRedemptions: number | null;    // limite total de resgates
  redemptionCount: number;    // contador denormalizado (check-and-increment atômico)
  active: boolean;            // kill switch
  createdAt: string;          // ISO
}
```

```sql
-- equivalente SQLite (drop-in de produção)
CREATE TABLE coupon (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('PERCENTAGE','FIXED')),
  discount_value INTEGER NOT NULL,
  max_discount_cents INTEGER,
  min_purchase_cents INTEGER,
  starts_at TEXT,
  expires_at TEXT,
  max_redemptions INTEGER,
  redemption_count INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
```

### 4.2 `Redemption` (cada uso consumido)

```ts
interface Redemption {
  id: string;                 // uuid
  couponId: string;           // FK -> coupon.id
  code: string;               // denormalizado p/ auditoria
  idempotencyKey: string;     // único — replay retorna o registro gravado
  requestFingerprint: string; // hash do payload canônico (detecta reuso de key c/ payload diferente)
  subtotalCents: number;
  discountCents: number;
  finalCents: number;
  redeemedAt: string;         // ISO
}
```

```sql
CREATE TABLE redemption (
  id TEXT PRIMARY KEY,
  coupon_id TEXT NOT NULL REFERENCES coupon(id),
  code TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  request_fingerprint TEXT NOT NULL,
  subtotal_cents INTEGER NOT NULL,
  discount_cents INTEGER NOT NULL,
  final_cents INTEGER NOT NULL,
  redeemed_at TEXT NOT NULL
);
```

**Invariantes de persistência:** `redemption_count` **nunca** > `max_redemptions`; e `redemption_count == COUNT(redemption WHERE coupon_id = ?)`. Garantidas pela operação atômica em §8.

---

## 5. Normalização e invariantes do cupom

**Normalização de `code`** (na escrita e na busca, dos dois lados): `trim` → remover whitespace interno (incl. NBSP e zero-width, que `String.trim()` não remove) → `normalize('NFKC')` → `toUpperCase('en-US')` (locale fixo, evita "turkish-I"). Charset `^[A-Z0-9]+$` pós-normalização + tamanho mín/máx. Código vazio/whitespace-only → **422** (request malformado), não `COUPON_NOT_FOUND`.

**Invariantes validados na construção (`parseCoupon`, *fail-fast* — protege seed/dado armazenado):** `PERCENTAGE` ⇒ `1 ≤ discountValue ≤ 100`; `FIXED` ⇒ `discountValue > 0`; `maxDiscountCents` `null`|`≥0`; `minPurchaseCents` `null`|`≥0`; `maxRedemptions` `null`|`≥1`; `startsAt ≤ expiresAt` quando ambos presentes; datas ISO com offset. Cupom malformado **falha alto** na construção/seed. (Distinto da validação de **request**, que é do `ValidationPipe`/DTO → 422.)

---

## 6. Cálculo de desconto — `computeDiscount` (função pura, em `core`)

Ordem **fixa**, não-negatividade garantida **por construção** (não por confiança no input):

```
entrada: subtotalCents (int > 0), coupon
asserts:  Number.isInteger em todos; PERCENTAGE => 1..100; FIXED => >0; cap null|>=0
1. raw   = discountType === 'PERCENTAGE'
             ? Math.trunc(subtotalCents * discountValue / 100)   // FLOOR via trunc
             : discountValue                                     // FIXED (centavos)
2. capped = maxDiscountCents == null ? raw : Math.min(raw, maxDiscountCents)
3. discountCents = Math.min(Math.max(capped, 0), subtotalCents)  // clamp [0, subtotal]
4. finalCents    = subtotalCents - discountCents                 // >= 0 por construção
retorna: { subtotalCents, discountCents, finalCents }  // invariante: discount + final === subtotal
```

**Arredondamento = FLOOR (via `Math.trunc`)**, decisão consciente: (a) desconto nunca excede o percentual nominal — favorável/defensável ao lojista; (b) determinístico e trivial de testar; (c) evita vazamento de 1 centavo por transação. Teste de trava: `199 @ 10% ⇒ 19`. Multiplicar antes de dividir minimiza erro de float. `percent = 100 ⇒ final = 0` é estado válido. **Overflow:** itens validados na borda (`unitPriceCents ≥ 0` inteiro, `quantity` 1..teto) e `Number.isSafeInteger` no acumulado e em `unitPrice*qty` → senão **422**.

---

## 7. Pipeline de validação (`evaluateCoupon` puro, orquestrado pelo usecase)

Bem-formação do carrinho é do **`ValidationPipe`/DTO (422)** — por isso `INVALID_CART` **não** é motivo de negócio. Quando o pipeline roda, `subtotalCents` já é confiável (> 0).

Ordem (fail-fast, retorna o 1º motivo):

1. existe? (busca por code normalizado) → `COUPON_NOT_FOUND`
2. `active`? → `COUPON_INACTIVE`
3. `now ≥ startsAt`? → `COUPON_NOT_STARTED`
4. `now ≤ expiresAt`? → `COUPON_EXPIRED`
5. `redemptionCount < maxRedemptions`? → `REDEMPTION_LIMIT_REACHED`
6. `subtotalCents ≥ minPurchaseCents`? → `MINIMUM_NOT_MET` (carrega `missingCents`)
7. sucesso → `computeDiscount`

**Mínimo medido sobre o SUBTOTAL (antes do desconto).** Campos `null` são *no-op* via guard explícito `if (x != null)`. **Fronteira temporal:** `startsAt`/`expiresAt` **inclusivos** (`now == expiresAt` ainda é válido); comparação por epoch ms; datas com offset/UTC; testar `±1ms` com fake clock.

### `RejectionReason` (união tipada, sem `any`)

```ts
type RejectionReason =
  | { reason: 'COUPON_NOT_FOUND' }
  | { reason: 'COUPON_INACTIVE' }
  | { reason: 'COUPON_NOT_STARTED' }
  | { reason: 'COUPON_EXPIRED' }
  | { reason: 'REDEMPTION_LIMIT_REACHED' }
  | { reason: 'MINIMUM_NOT_MET'; missingCents: number };  // payload só aqui

type ValidationResult =
  | { valid: true;  breakdown: { subtotalCents: number; discountCents: number; finalCents: number } }
  | { valid: false; rejection: RejectionReason };
```

`validate` e `redeem` usam **a mesma** `evaluateCoupon` (DRY → fronteiras idênticas).

---

## 8. Concorrência e idempotência (resgate atômico)

A atomicidade vive **dentro de um único método de porta** — o usecase não orquestra transação que o adapter não consegue honrar:

```ts
// ports/coupon-repository.ts
export const COUPON_REPOSITORY = Symbol('COUPON_REPOSITORY'); // token DI (Symbol puro)

export interface CouponRepository {
  findByCode(code: string): Promise<Coupon | null>;
  findRedemptionByKey(key: string): Promise<Redemption | null>;
  tryRedeem(cmd: {
    couponId: string; code: string; idempotencyKey: string; requestFingerprint: string;
    subtotalCents: number; discountCents: number; finalCents: number;
  }): Promise<
    | { kind: 'redeemed'; redemption: Redemption }   // novo
    | { kind: 'replayed'; redemption: Redemption }   // mesma key + mesmo fingerprint
    | { kind: 'key_reused' }                          // mesma key + fingerprint diferente
    | { kind: 'limit_reached' }
  >;
}
```

- **In-memory (`adapter/persistence`):** `tryRedeem` roda numa **seção crítica síncrona** (sem `await` liberando o event loop entre re-check do limite, increment e insert). Teste: `Promise.all` de `N+1` resgates ⇒ exatamente `N` `redeemed` + 1 `limit_reached`.
- **SQLite (prod):** uma transação — `UPDATE coupon SET redemption_count = redemption_count + 1 WHERE id = ? AND (max_redemptions IS NULL OR redemption_count < max_redemptions) RETURNING ...` + insert em `redemption` protegido por `UNIQUE(idempotency_key)`.
- **Idempotência:** chave no header `Idempotency-Key`. O `redeem` **persiste o snapshot**; replay **retorna o gravado, sem recalcular**. Mesma key com payload diferente (`requestFingerprint`) → `key_reused` → **409**.

`redeem` reavalia o cupom no momento do consumo (mesma `evaluateCoupon`): se ficou inativo/expirado/cheio **entre** o `validate` e o `redeem`, rejeita e **não** grava nada.

---

## 9. NestJS — módulos, DI e camadas

O `core`/`usecase` são puros; o NestJS apenas os **instancia e injeta** (no `adapter/http`). Use-cases são classes puras (constructor injection), construídas via `useFactory` — então **nem o usecase nem o core importam `@nestjs/*`**.

```ts
// usecase/validate-coupon.usecase.ts  (PURO, sem decorators)
export class ValidateCouponUseCase {
  constructor(private readonly repo: CouponRepository, private readonly clock: Clock) {}
  execute(cmd: ValidateCommand): Promise<ValidationResult> { /* load -> evaluate -> compute */ }
}

// adapter/http/coupons.module.ts
@Module({
  controllers: [CouponsController],
  providers: [
    { provide: COUPON_REPOSITORY, useFactory: () => new InMemoryCouponRepository(seedCoupons()) },
    { provide: CLOCK, useClass: SystemClock },
    { provide: ValidateCouponUseCase,
      useFactory: (repo: CouponRepository, clock: Clock) => new ValidateCouponUseCase(repo, clock),
      inject: [COUPON_REPOSITORY, CLOCK] },
    { provide: RedeemCouponUseCase,
      useFactory: (repo: CouponRepository, clock: Clock) => new RedeemCouponUseCase(repo, clock),
      inject: [COUPON_REPOSITORY, CLOCK] },
  ],
})
export class CouponsModule {}

// adapter/http/coupons.controller.ts  (fino: parse DTO -> use-case -> map Result -> HTTP)
@Controller('coupons')
export class CouponsController {
  constructor(
    private readonly validateCoupon: ValidateCouponUseCase,
    private readonly redeemCoupon: RedeemCouponUseCase,
  ) {}

  @Post('validate') @HttpCode(200)
  async validate(@Body() dto: ValidateCouponDto) {
    return toValidateResponse(await this.validateCoupon.execute(toCommand(dto))); // sempre 200
  }

  @Post('redeem')
  async redeem(@Body() dto: ValidateCouponDto, @Headers('idempotency-key') key?: string) {
    return toRedeemResponse(await this.redeemCoupon.execute(toRedeemCommand(dto, key)));
    // 201 novo | 200 replay | throw ConflictException(409) | UnprocessableEntityException(422)
  }
}
```

```ts
// main.ts
const app = await NestFactory.create(AppModule);
app.useGlobalPipes(new ValidationPipe({
  whitelist: true, forbidNonWhitelisted: true, transform: true, errorHttpStatusCode: 422,
}));
app.enableCors({ origin: process.env.CORS_ORIGIN });
await app.listen(process.env.PORT ?? 3001);
```

**Regra de fluxo:** `core`/`usecase` retornam `Result` (valores). Só o mapper `adapter/http/mappers/result-to-http.ts` traduz um motivo de negócio em `HttpException` (`ConflictException` → 409, `UnprocessableEntityException` → 422). Erro real de I/O propaga e o Nest responde **500**.

---

## 10. Contratos HTTP

### `POST /coupons/validate` (read-only, não consome uso)

```jsonc
// request (DTO class-validator; ValidationPipe whitelist+forbidNonWhitelisted)
{ "couponCode": "LANC10",
  "cart": { "items": [ { "id": "p1", "name": "Curso X", "unitPriceCents": 19900, "quantity": 1 } ],
            "totalCents": 19900 } }  // opcional; se presente, deve bater com o recomputado, senão 422
```
- **200 válido:** `{ "valid": true, "couponCode", "discountType", "subtotalCents", "discountCents", "finalCents" }`
- **200 inválido:** `{ "valid": false, "reason": "COUPON_EXPIRED", "message": "...", "subtotalCents", "missingCents"? }` (`missingCents` só em `MINIMUM_NOT_MET`)
- **422:** erro do `ValidationPipe` (itens malformados, `quantity<1`, cents float/negativo, lista vazia, code vazio, `totalCents` divergente)

DTO: `@IsInt() @Min(0)` em cents, `@IsInt() @Min(1)` em quantity, `@ArrayMinSize(1) @ArrayMaxSize(N)`, `@ValidateNested({each:true}) @Type(() => CartItemDto)`.

### `POST /coupons/redeem` (consome 1 uso; header `Idempotency-Key`)

Mesma request do `validate`. Reavalia → se válido, `tryRedeem` atômico → grava `Redemption` + snapshot.

| Resultado | Status | Corpo |
|---|---|---|
| Resgatado (novo) | **201** | `{ redeemed: true, redemptionId, subtotalCents, discountCents, finalCents }` |
| Replay idempotente (mesma key+payload) | **200** | snapshot gravado, verbatim |
| Cupom inválido no resgate (expirado/inativo/mínimo) | **409** | `{ redeemed: false, reason, message }` |
| Limite estourado (corrida perdida) | **409** | `{ redeemed: false, reason: 'REDEMPTION_LIMIT_REACHED' }` |
| `Idempotency-Key` reusada com payload diferente | **409** | `{ error: 'IDEMPOTENCY_KEY_REUSED' }` |
| Request malformado / sem `Idempotency-Key` | **422** | erro do `ValidationPipe` |

Convenção: **negócio negou ≠ request quebrado**. `validate` é *preview não-vinculante*; o `redeem` é a fonte da verdade.

---

## 11. Matriz de edge cases (cobertura explícita)

| Caso | Tratamento |
|---|---|
| Cupom inexistente | `COUPON_NOT_FOUND` (200, `valid:false`) |
| Cupom inativo (kill switch) | `COUPON_INACTIVE` |
| Cupom ainda não iniciado (`startsAt` futuro) | `COUPON_NOT_STARTED` |
| Cupom expirado | `COUPON_EXPIRED`; borda `now==expiresAt` = válido |
| Limite de resgates atingido | `REDEMPTION_LIMIT_REACHED` |
| Limite na corrida (#100 e #101 juntos) | `tryRedeem` atômico ⇒ exatamente N sucessos |
| Carrinho abaixo do mínimo | `MINIMUM_NOT_MET` + `missingCents` |
| Carrinho vazio / `subtotal=0` / cents negativo/float / `quantity<1` | **422** (`ValidationPipe`), antes do pipeline |
| `totalCents` do cliente ≠ itens | **422** (não confia no cliente) |
| Desconto fixo > subtotal | `final = 0` (clamp), não negativo |
| Percentual com teto (`maxDiscountCents`) | aplica `min(raw, teto)` |
| Percentual que zera (`100%`) / `10%` de `<10c` | `final=0` / `discount=0` — válidos e testados |
| Cupom sem nenhuma restrição (tudo `null`) | aplica desconto; cada `null` é no-op (testado) |
| Código com espaços/maiúsculas/NBSP/zero-width | normalizado (§5) |
| Cupom malformado (percent 120, cap negativo) | `parseCoupon` **falha na construção** |
| Resgate idempotente (retry) | replay do snapshot, sem duplicar |
| `Idempotency-Key` reusada c/ payload diferente | **409** `IDEMPOTENCY_KEY_REUSED` |
| Estado muda entre `validate` e `redeem` | `redeem` reavalia e rejeita sem escrita parcial |

### Seed (`adapter/persistence/seed.ts`) — cobre a matriz para demonstração

`LANC10` (10%, min R$50, limite 100) · `BLACK50` (fixo R$50, min R$100) · `MEGA90` (90% com teto R$30) · `FIXOVER` (fixo R$500 → final 0) · `NORESTR` (10% sem restrição) · `PCT100` (100% → final 0) · `EXPIRED` · `SOON` (`startsAt` futuro) · `FULL` (limite atingido) · `OFF` (`active:false`).

---

## 12. Plano de testes (Jest + Supertest)

- **Unit (sem Nest) — `core/discount.ts`:** percentual, fixo, teto, fixo>subtotal, `100%`, `10%`<10c, arredondamento `199@10%⇒19`, invariante `discount+final==subtotal`, asserts de entrada.
- **Unit — `core/evaluate-coupon.ts`:** cada `RejectionReason` + a **ordem**; campos `null` como no-op; bordas temporais (`±1ms`) com fake clock.
- **Unit — use-cases:** `new ValidateCouponUseCase(fakeRepo, fakeClock)` / `RedeemCouponUseCase` direto (sem subir o Nest).
- **Unit — `parseCoupon` / normalização de code:** percent fora de 1..100, fixo ≤0, cap negativo, `startsAt>expiresAt`; espaços internos, NBSP, zero-width, vazio.
- **e2e (`Test.createTestingModule` + Supertest):** `validate` (200 válido/inválido, 422); `redeem` (201, replay 200, 409 limite/estado/key-reuse, 422); concorrência `Promise.all(N+1)`; invariante `redemptionCount == COUNT(redemptions)`; estado muda entre validate→redeem. Override de providers: fake clock + in-memory repo seedado (`.overrideProvider(CLOCK)` / `COUPON_REPOSITORY`).

---

## 13. Fora de escopo (assumido — e por quê)

- **Auth / multi-tenant / dono do cupom** — enunciado pede sem auth.
- **CRUD admin de cupons** — só seed (enunciado: sem painel).
- **Empilhar cupons / limite por usuário** — 1 cupom por carrinho, limite global.
- **Pagamento / pedido real** — `redeem` é o stand-in do commit do checkout.
- **Adapters IN/OUT extras** (gRPC, AMQP, HTTP-sender, eventos, auditoria) — a estrutura admite; fora por escopo.
- **i18n / multimoeda** — BRL em centavos; formatação só na UI.
- **Concorrência distribuída** — in-memory single-process; transação SQLite é o caminho de produção (§8).
- **Rate limiting / anti-enumeração de códigos** — citado como risco, fora do escopo.

---

## 14. Próximo passo (frontend, depois)

App `web/` (Next.js App Router): tela com campo de cupom + resumo do carrinho que chama `POST /coupons/validate` e mostra **valor original / desconto / valor final** ou o **motivo** da rejeição. `Idempotency-Key` (uuid por tentativa de checkout) no `redeem`. Base URL do backend via env; CORS habilitado no `main.ts`. Formatação BRL num único helper `formatBRL(cents)` com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.

---

## 15. Verificação (como provar que funciona)

1. `cd backend && npm install && npm test` → unit do `core`/use-cases verdes; `npm run test:e2e` → controllers + concorrência + idempotência verdes.
2. `npm run start:dev` e exercitar via `curl`/REST client:
   - `validate` happy path (`LANC10`) → `valid:true` com desconto correto.
   - cada edge case da seed → motivo/status esperado.
   - `redeem` `FULL` → `409 REDEMPTION_LIMIT_REACHED`; replay com mesma `Idempotency-Key` → mesmo corpo.
3. `npm run lint` → regra de fronteira de imports passa (`core`/`ports`/`usecase` não importam `@nestjs/*`/`class-validator`).
4. (passo frontend) `web` consumindo o backend, fluxo ponta-a-ponta no navegador.
