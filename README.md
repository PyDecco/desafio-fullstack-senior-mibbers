# Mibbers — Validação de Cupom

API NestJS que valida um cupom de desconto contra um carrinho: responde se é aplicável e o valor final, ou o motivo da rejeição. Somente leitura — não consome o cupom e recalcula o subtotal no servidor.

## Rodar

```bash
cd backend
npm install
npm run start:dev
```

API em `http://localhost:3001` · documentação **Swagger** em `http://localhost:3001/docs`.

Teste rápido:

```bash
curl -X POST localhost:3001/coupons/validate -H 'Content-Type: application/json' \
  -d '{"couponCode":"LANC10","cart":{"items":[{"id":"p1","name":"Curso","unitPriceCents":19900,"quantity":1}]}}'
```

## Testes

```bash
cd backend
npm test          # unitários
npm run test:e2e  # end-to-end
```

## Mais

Arquitetura, decisões e requisitos em [`docs/`](docs/). Cupons de exemplo e o contrato completo da API estão no Swagger (`/docs`).
