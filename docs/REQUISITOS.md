# Requisitos Funcionais e Critérios de Aceite — Cupom de desconto

> Base para o desenvolvimento em **TDD**. Cada critério de aceite (AC) abaixo vira ao menos um teste (unit ou e2e) — ver mapeamento em [ARQUITETURA.md §8](ARQUITETURA.md). Notação dos AC: **Dado / Quando / Então**.

## Convenções

- **Dinheiro**: sempre inteiro em **centavos** (`Cents`). Nunca float.
- **`validate` é read-only**: preview que não consome uso. O limite de usos é checado na própria validação (`redemptionCount < maxRedemptions`); não há endpoint de resgate (fora de escopo).
- **Negócio negou ≠ request quebrado**: rejeição de negócio em `validate` → **200** `{valid:false}`; request malformado → **422** (`ValidationPipe`).
- **`RejectionReason`** (conjunto fechado): `COUPON_NOT_FOUND | COUPON_INACTIVE | COUPON_NOT_STARTED | COUPON_EXPIRED | REDEMPTION_LIMIT_REACHED | MINIMUM_NOT_MET`.

---

## 1. Requisitos Funcionais (RF)

### Validação (`POST /coupons/validate`, read-only)
- **RF-V1** `evaluateCoupon(coupon, { now, subtotalCents })` é função pura; aplica as verificações em ordem **fail-fast** e retorna o **1º** motivo.
- **RF-V2** Read-only: nunca incrementa `redemptionCount` (é só preview).
- **RF-V3** Subtotal **recomputado no servidor** a partir de `items`; `totalCents` do cliente, se enviado, deve bater (senão 422) e nunca é confiado.
- **RF-V4** Qualquer desfecho de negócio (válido/inválido) responde **200**; 422 é exclusivo de falha do `ValidationPipe`.
- **RF-V5** Shape 200-válido: `{ valid:true, couponCode, discountType, subtotalCents, discountCents, finalCents }` (sem `reason`/`message`/`missingCents`).
- **RF-V6** Shape 200-inválido: `{ valid:false, reason, message, subtotalCents }` + `missingCents` **só** em `MINIMUM_NOT_MET`; **não** inclui `couponCode`.
- **RF-V7** `subtotalCents` é ecoado em todo desfecho que o computa (inclusive `COUPON_NOT_FOUND`).
- **RF-V8** Fronteiras temporais **inclusivas** (`now==startsAt` inicia; `now==expiresAt` ainda vale); comparação por epoch ms; campos `null` = no-op.
- **RF-V9** `couponCode` ecoado é a forma **normalizada** do cupom encontrado.

### Cálculo de desconto (`computeDiscount`, puro)
- **RF-C1** `PERCENTAGE`: `raw = Math.trunc(subtotal*percent/100)` (FLOOR; multiplica antes de dividir). `FIXED`: `raw = discountValue`.
- **RF-C2** Teto: `capped = cap==null ? raw : min(raw, cap)`. Clamp: `discount = min(max(capped,0), subtotal)`; `final = subtotal - discount`.
- **RF-C3** Invariante `discount + final === subtotal`; `0 <= discount <= subtotal`; resultados inteiros.
- **RF-C4** Asserts de entrada (falha alto): `subtotal` int `>=0`; `PERCENTAGE` 1..100; `FIXED` `>0`; `cap` null|`>=0`; overflow via `Number.isSafeInteger` (inclui produto intermediário).

### Entrada, normalização e invariantes
- **RF-I1** DTO `class-validator` **strict**: `unitPriceCents` int `>=0`; `quantity` int `>=1`; `items` `>=1` e `<=200`; rejeita chaves desconhecidas; `couponCode` não-vazio.
- **RF-I2** `normalizeCode`: trim + remove whitespace interno (NBSP, zero-width) + NFKC + `toUpperCase('en-US')` + charset `^[A-Z0-9]+$` + min/max; vazio/whitespace-only → 422.
- **RF-I3** `parseCoupon` fail-fast: `PERCENTAGE` 1..100; `FIXED` `>0`; caps null|`>=0`; `maxRedemptions` null|`>=1`; `startsAt <= expiresAt`; datas ISO com offset.
- **RF-I4** `message` é string não-vazia, determinística por `reason` (tabela `reason→message`), human-readable; **não** faz parte do contrato de máquina (clientes usam `reason`).

---

## 2. Critérios de Aceite (Gherkin)

### 2.1 Pipeline de validação — motivos e ordem

- **AC-01** Cupom inexistente → `COUPON_NOT_FOUND`
  - *Dado* um `couponCode` que não existe e um carrinho válido (subtotal 19900)
  - *Quando* `POST /coupons/validate`
  - *Então* 200 `{ valid:false, reason:'COUPON_NOT_FOUND', subtotalCents:19900 }` sem `missingCents`/`couponCode`
- **AC-02** Cupom inativo → `COUPON_INACTIVE` (cupom `active:false`).
- **AC-03** `startsAt` futuro → `COUPON_NOT_STARTED`.
- **AC-04** `expiresAt` passado → `COUPON_EXPIRED`.
- **AC-05** `redemptionCount == maxRedemptions` → `REDEMPTION_LIMIT_REACHED`.
- **AC-06** subtotal `< minPurchaseCents` → `MINIMUM_NOT_MET` com `missingCents = min - subtotal`.
- **AC-07** Cupom 100% válido → `{ valid:true, breakdown }`.
- **AC-08..12** Ordem fail-fast (pares adjacentes **alcançáveis**): `INACTIVE` > `NOT_STARTED`; `EXPIRED` > `LIMIT`; `LIMIT` > `MINIMUM`; `MINIMUM` > sucesso.
  - *Nota (D2)*: o par `NOT_STARTED` vs `EXPIRED` é inconstruível sob `parseCoupon` (`startsAt<=expiresAt`); a robustez da ordem do switch é coberta por um **fixture cru** anotado "estado impossível em produção".

### 2.2 Fronteiras temporais (fake clock)
- **AC-13** `now == startsAt - 1ms` → `COUPON_NOT_STARTED`.
- **AC-14** `now == startsAt` → **não** `COUPON_NOT_STARTED` (inclusivo).
- **AC-15** `now == startsAt + 1ms` → **não** `COUPON_NOT_STARTED`.
- **AC-16** `now == expiresAt - 1ms` → **não** `COUPON_EXPIRED`.
- **AC-17** `now == expiresAt` → **não** `COUPON_EXPIRED` (inclusivo, ainda vale).
- **AC-18** `now == expiresAt + 1ms` → `COUPON_EXPIRED`.
- **AC-19** `expiresAt` com offset `-03:00` e `now` em UTC do **mesmo instante** → tratado como `now == expiresAt` (prova comparação por epoch).

### 2.3 Campos opcionais nulos (no-op)
- **AC-20..23** `startsAt`/`expiresAt`/`maxRedemptions`/`minPurchaseCents` `null` → a etapa correspondente é pulada.
- **AC-24** Cupom sem nenhuma restrição (todos os opcionais `null`) → válido.

### 2.4 Mínimo e limite — fronteiras
- **AC-25** Mínimo medido sobre **subtotal** (nunca sobre `final`).
- **AC-26** `subtotal == minPurchaseCents` → qualifica.
- **AC-27** `subtotal == minPurchaseCents - 1` → `MINIMUM_NOT_MET` com `missingCents=1`.
- **AC-LIM** `redemptionCount == maxRedemptions - 1` → **passa** a etapa 5 (regra é `<`).

### 2.5 Cálculo de desconto
- **AC-C1** 10% de 1000 → discount 100, final 900.
- **AC-C2** Fixo 50 de 1000 → discount 50, final 950.
- **AC-C3** 90% com teto 30 (de 1000) → discount 30, final 970.
- **AC-C4** FLOOR: 199 @ 10% → discount **19** (não 20), final 180.
- **AC-C5** FLOOR: 195 @ 10% → discount **19**, final 176.
- **AC-C6** Fixo 500 com subtotal 300 → discount 300 (clamp), final **0**.
- **AC-C7** 100% de 1000 → discount 1000, final **0**.
- **AC-C8** 10% de 9 → discount **0** (`trunc(0.9)`), final 9.
- **AC-C9** Teto 0 → discount 0, final = subtotal.
- **AC-C10** `subtotal=0` → discount 0, final 0 (válido).
- **AC-C11** Invariante (propriedade): `discount + final === subtotal` para qualquer entrada válida.
- **AC-C12..16** Asserts (falha alto): subtotal float/negativo; `PERCENTAGE` `>100` ou `<1`; `FIXED` `<=0`; `discountValue` não-inteiro; `cap` negativo; produto intermediário fora de `isSafeInteger`.

### 2.6 Validação de entrada (`ValidationPipe` → 422)
- **AC-D1** `items=[]` → 422.
- **AC-D2** `unitPriceCents` negativo → 422.
- **AC-D3** `unitPriceCents` float → 422.
- **AC-D4** `quantity < 1` → 422.
- **AC-D5** `couponCode` vazio/whitespace-only → 422 (não `COUPON_NOT_FOUND`).
- **AC-D6** Campos extras não permitidos → 422 (`forbidNonWhitelisted`).
- **AC-D7** `totalCents` divergente do subtotal recomputado → 422.
- **AC-D8** `totalCents` coincidente → 200.
- **AC-D9** `subtotal=0` com itens bem-formados (preço 0) → **não** é 422; segue para o pipeline de negócio.

### 2.7 Normalização de código
- **AC-N1** `' lanc 10 '` (espaço, NBSP, minúsculas) encontra `LANC10`; resposta ecoa `LANC10`.
- **AC-N2** Zero-width / NBSP internos são removidos.
- **AC-N3** Locale fixo `en-US` (sem surpresa do "turkish-I").
- **AC-N4** Vazio/whitespace-only → 422.

### 2.8 `parseCoupon` (fail-fast)
- **AC-P1..6** Aceita bordas inclusivas (`PERCENTAGE` 1 e 100; `FIXED` 1; `maxRedemptions` null e 1; `startsAt==expiresAt`); rejeita `PERCENTAGE` fora 1..100, `FIXED<=0`, `cap<0`, `startsAt>expiresAt`.
- **AC-P7** Seed falha-alto se algum cupom semeado for malformado.

---

## 3. Cupons de seed (cobrem a matriz)

| Code | Tipo | Regras | Edge case demonstrado |
|---|---|---|---|
| `LANC10` | 10% | min R$50, limite 100 | happy path / mínimo |
| `BLACK50` | fixo R$50 | min R$100 | desconto fixo |
| `MEGA90` | 90% | teto R$30 | teto de percentual |
| `FIXOVER` | fixo R$500 | — | fixo > subtotal → final 0 |
| `NORESTR` | 10% | sem restrição | todos opcionais null |
| `PCT100` | 100% | — | final 0 |
| `EXPIRED` | 10% | `expiresAt` passado | expirado |
| `SOON` | 10% | `startsAt` futuro | não iniciado |
| `FULL` | 10% | `redemptionCount==max` | limite atingido |
| `OFF` | 10% | `active:false` | inativo |

---

## 4. Fora de escopo (assumido)

Auth/multi-tenant, painel admin / criação de cupom, resgate (consumo de uso) e pagamento, empilhar cupons, limite por usuário, i18n/multimoeda, concorrência distribuída (in-memory single-process; transação SQLite é o caminho de produção), rate limiting/anti-enumeração. Ver [ARQUITETURA.md §9](ARQUITETURA.md).
