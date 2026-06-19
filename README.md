# Desafio Fullstack Sênior — Cupom de desconto no checkout (Mibbers)

Feature de **cupom de desconto no checkout**: um endpoint que recebe um carrinho + código de cupom e responde se o cupom é válido e qual o valor final com desconto; e uma tela em Next.js para o usuário aplicar o cupom e ver o resultado.

> Foco do desafio: **modelagem de regras de negócio, tratamento de edge cases e qualidade de código** — não em UI elaborada nem em persistência.

## Stack

- **Backend:** NestJS (Node.js + TypeScript), arquitetura hexagonal (Ports & Adapters).
- **Frontend:** Next.js + React *(próximo passo)*.
- **Persistência:** in-memory atrás de um repositório (interface) — drop-in para SQLite. A persistência não é o foco.

## Arquitetura

Hexagonal, com o domínio puro no centro e o framework só na casca. Detalhes completos (tabelas, pipeline de validação, cálculo de desconto, concorrência/idempotência, matriz de edge cases e o que ficou fora de escopo) em **[docs/ARQUITETURA.md](docs/ARQUITETURA.md)**.

```
backend/src/
  core/        # domínio puro: Coupon, computeDiscount, evaluateCoupon, money…
  ports/       # contratos (fronteira): CouponRepository, Clock  ← lado a lado
  usecase/     # ValidateCouponUseCase, RedeemCouponUseCase       (depende de core + ports)
  adapter/     # http/ (controller, dto, mappers) · persistence/ (repo + seed) · clock/ (SystemClock)
  main.ts
web/           # Next.js (próximo passo)
docs/          # documento de arquitetura
```

Regra de dependência: `core` ← `ports` ← `{ usecase, adapter }`. `core`/`ports`/`usecase` nunca importam `@nestjs/*` nem `class-validator` (garantido por lint).

## Decisões centrais

- **`validate` ≠ `redeem`**: validar é *preview* read-only (não consome uso); resgatar consome 1 uso, é idempotente (`Idempotency-Key`) e atômico.
- **Dinheiro em centavos (inteiros)** em todo o sistema; subtotal **recomputado no servidor** a partir dos itens (não confia no total do cliente).
- **Casos de negócio são valores** (`Result`/união discriminada), não exceções; `HttpException` só na borda.

## Status

🚧 **Em construção.** Estrutura de pastas (skeleton hexagonal) criada. Implementação do `core`, `usecase`, adapters e testes em andamento.

## Como rodar

> A ser preenchido quando o código estiver implementado.

```bash
cd backend
npm install
npm run start:dev    # API
npm test             # unit do core/use-cases
npm run test:e2e     # controllers + concorrência + idempotência
```
