# Cupom de desconto no checkout

Uma tela de checkout onde você monta um carrinho, digita um cupom e vê na hora se ele vale — com o desconto aplicado ou o motivo de ter sido recusado.

É a minha resposta ao desafio técnico da Mibbers. O foco está nas **regras de negócio do cupom** (tipo de desconto, validade, valor mínimo, limite de usos) e na qualidade do código — não em tela bonita nem em infraestrutura.

> São duas partes que conversam entre si: uma **API** (NestJS) que decide se o cupom vale, e uma **tela** (Next.js) que mostra o resultado.

## Antes de começar

Você só precisa do **Node.js 20 ou mais novo** instalado. Pra conferir:

```bash
node --version
```

## Como rodar (dois comandos)

```bash
npm install   # instala tudo de uma vez: a raiz, a API e a tela
npm run dev   # sobe a API e a tela juntas
```

Quando aparecer que subiu, abra no navegador:

| O quê | Endereço |
|---|---|
| 🛒 A aplicação (a tela de checkout) | http://localhost:3000 |
| 📖 A API, pra explorar e testar no navegador (Swagger) | http://localhost:3001/docs |

Pronto — não precisa configurar banco, variável de ambiente nem nada. Os cupons já vêm cadastrados.

## Como usar a tela

1. Você começa com alguns itens no carrinho. Pode **adicionar, remover ou mudar a quantidade** à vontade.
2. Digite um cupom no campo e clique em **Aplicar**.
3. Se o cupom valer, aparecem o **subtotal**, o **desconto** e o **total final**. Se não, aparece o **motivo** em português claro ("esse cupom expirou", "faltam R$ X para desbloquear"…).
4. Mexeu no carrinho com um cupom aplicado? Ele **se revalida sozinho** — porque algumas regras (como o valor mínimo) dependem do total do carrinho.

Não sabe qual cupom digitar? A própria tela tem um atalho com os códigos de exemplo.

## Cupons pra experimentar

O carrinho inicial soma **R$ 64,80**, então dá pra ver vários cenários só trocando o código:

| Código | O que ele faz | Bom pra ver |
|---|---|---|
| `LANC10` | 10% de desconto (mínimo de R$ 50) | o caminho feliz — funciona no carrinho inicial |
| `BLACK50` | R$ 50 fixos (mínimo de R$ 100) | a recusa por **valor mínimo** (pede mais R$ pra liberar) |
| `MEGA90` | 90%, mas com teto de R$ 30 | o **teto** segurando um desconto grande |
| `FIXOVER` | R$ 500 fixos | desconto maior que o carrinho → o total **zera** (nunca fica negativo) |
| `PCT100` | 100% | total **zerado** |
| `NORESTR` | 10% sem nenhuma restrição | cupom solto, sem validade/mínimo/limite |
| `EXPIRED` | já passou da validade | recusa por **cupom expirado** |
| `SOON` | só começa no futuro | recusa por **ainda não começou** |
| `FULL` | já bateu o limite de usos | recusa por **limite atingido** |
| `OFF` | está desativado | recusa por **cupom inativo** |

Qualquer código que não existe cai num educado "esse código não existe".

## Explorando a API no navegador (Swagger)

A API vem com uma página interativa onde você dispara requisições de verdade e vê a resposta na hora — sem instalar nada. Com tudo rodando (`npm run dev`), abra:

**http://localhost:3001/docs**

Pra testar um cupom por ali:

1. Abra o endpoint **`POST /coupons/validate`** (clique pra expandir).
2. Clique em **Try it out** — isso libera o corpo da requisição pra edição.
3. No seletor de **Examples**, escolha um cenário pronto (cupom válido, abaixo do mínimo, `totalCents` divergente, código inválido…). O corpo já vem preenchido.
4. Clique em **Execute**. Logo abaixo aparecem o **status HTTP**, o **corpo da resposta** e até o `curl` equivalente.

A própria página lista os cupons da seed e explica as regras — o subtotal é recalculado no servidor, rejeições de negócio voltam **200** com `valid: false`, e só payload malformado ou código inválido volta **422**.

Precisa da especificação OpenAPI pra importar no Postman/Insomnia? Ela está em **http://localhost:3001/docs-json** (ou `/docs-yaml`).

> Em produção dá pra desligar o Swagger com a variável `SWAGGER_ENABLED=false`.

## Testando a API direto (opcional, pra quem curte terminal)

Se preferir a linha de comando em vez do navegador:

```bash
curl -X POST localhost:3001/coupons/validate \
  -H 'Content-Type: application/json' \
  -d '{"couponCode":"LANC10","cart":{"items":[{"id":"p1","name":"Curso","unitPriceCents":19900,"quantity":1}]}}'
```

Os valores vão sempre em **centavos** (R$ 199,00 = `19900`) — assim não existe erro de arredondamento de casa decimal, que é justo onde dinheiro costuma sangrar.

## Como funciona por dentro (em uma respirada)

O cérebro fica na API. Ela **recalcula o total a partir dos itens** (não confia no valor que vem do navegador) e passa o cupom por uma fila de checagens — *está ativo? dentro da validade? ainda tem usos? atinge o mínimo?* — parando na primeira que falhar. Se passar em tudo, calcula o desconto e devolve o total. A tela só mostra o que a API respondeu. Esse caminho inteiro — request, fila de checagens e resposta — é coberto ponta a ponta por testes de integração que batem na API de verdade (veja `test:e2e` mais abaixo).

## Como foi fazer este projeto (sendo honesto)

Dá pra dividir a experiência em dois processos bem diferentes — e acho mais útil contar isso do que fingir que foi tudo igual.

**O backend é onde está a minha experiência, e foi onde gastei a maior parte do esforço.** A arquitetura foi **discutida de verdade**, decisão por decisão: por que isolar o núcleo de regra em `core/` atrás de ports e adapters, por que tratar dinheiro sempre em centavos, por que recalcular o total no servidor em vez de confiar no navegador, por que rejeição de negócio volta `200` com `valid: false` e só payload malformado volta `422`. Cada uma dessas escolhas passou por um "por que assim e não assado?" antes de virar código — e é isso que sustenta o núcleo estar 100% coberto.

**No front eu tenho bem menos rodagem, e preferi ser honesto sobre isso a forçar uma discussão de arquitetura que eu não conseguiria sustentar no mesmo nível.** Em vez disso, montei um **prompt único no formato Framework Pacer** e parti dele direto, sem o mesmo vai-e-vem que o backend teve. O resultado funciona e segue uma estrutura razoável (hooks isolados, serviço de API separado, componentes de apresentação), mas não recebeu o mesmo escrutínio — e isso aparece sem disfarce na cobertura de testes logo abaixo e na orquestração dos hooks, que ficou sem teste unitário. É exatamente o tipo de coisa que eu reforçaria com mais tempo e mais prática nessa stack.

## Testes e cobertura

Tudo de uma vez (API + tela):

```bash
npm test
```

Ou cada lado separadamente:

```bash
npm run test -w backend   # a API, no Jest
npm run test -w web       # a tela, no Vitest
```

Em modo watch (re-roda ao salvar), troque `test` por `test:watch`. Pra ver a cobertura:

```bash
npm run test:cov -w backend   # Jest --coverage
npm run test:cov -w web       # Vitest --coverage
```

Além da unidade, o backend tem uma camada de integração HTTP que exercita o contrato ponta a ponta — request → resposta pelo pipe real do Nest, com o relógio fixado pra datas determinísticas:

```bash
npm run test:e2e -w backend   # 26 testes de integração HTTP (supertest)
```

Onde a cobertura está hoje:

| Pacote | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| **backend** (API) | 93% | 94% | 84% | 93% |
| **web** (tela) | 25% | 42% | 23% | 27% |

No backend, o **núcleo de regra de negócio (`core/`) está 100% coberto** — é onde mora o risco real; o que abaixa a média são arquivos de infraestrutura (bootstrap do Nest, configuração do Swagger), sem decisão de negócio. No front, os testes cobrem os componentes de apresentação e os utilitários puros — a orquestração dos hooks ficou de fora (veja a última seção).

## O que eu deixei de fora (de propósito)

Pra caber no escopo do desafio (2–4h) e manter o foco na regra de negócio, deixei algumas coisas conscientemente de fora:

- **Resgate e pagamento.** O desafio pede pra *validar* o cupom, então é isso que faço. Eu **checo** se ainda há usos disponíveis, mas não "gasto" um uso — isso só faria sentido junto de um pedido pago de verdade.
- **Login e painel de administração.** Fora do escopo. Os cupons vêm de uma lista pré-cadastrada no código.
- **Banco de dados.** Está tudo em memória de propósito — o enunciado diz que persistência não é o foco. Trocar por um SQLite seria direto, sem mexer na regra de negócio.
- **Multimoeda, empilhar cupons, limite por usuário.** Não foram pedidos; ficariam pra uma próxima.
- **Testes dos hooks e da integração no front.** Testei o domínio do backend a fundo (núcleo 100%) e, no front, os componentes de apresentação e os utilitários puros. A orquestração dos hooks (`useCoupon` e `useCart` — controle de resposta obsoleta com `AbortController`/`reqId` e revalidação com debounce) e os componentes de integração (`Checkout`, `CartList`, `OrderSummary`) ficaram sem teste unitário. É a primeira coisa que eu cobriria numa próxima passada.

Preferi **cobrir bem o essencial e ser honesto sobre as bordas** a tentar fazer tudo pela metade.
