# Royal Suits — Backend Netlify (deploy e operação)

Este projeto é uma loja estática (HTML/CSS/JS) + **backend serverless** rodando em
**Netlify Functions** com banco de dados em **Netlify Blobs**. Não há servidor para
administrar, nem banco externo para contratar: tudo roda na própria Netlify.

```
.
├── netlify.toml                 # build, headers, redirects /api/* → função
├── netlify/
│   ├── functions/api.mjs        # router único de toda a API REST
│   └── lib/
│       ├── db.mjs               # Netlify Blobs (+ driver de memória p/ testes)
│       ├── auth.mjs             # scrypt + JWT HS256, papéis cliente/admin
│       ├── http.mjs             # helpers de resposta/validação
│       ├── pix.mjs              # BR Code EMV + CRC16
│       ├── frete.mjs            # cotação por CEP, cupons, desconto PIX
│       ├── mail.mjs             # e-mails via Resend (opcional)
│       └── products-seed.mjs    # 20 produtos reais do site
├── js/rs-api.js                 # cliente JS usado por todas as páginas
├── admin.html                   # painel administrativo
└── scripts/                     # dev-server, testes, seed
```

---

## 1. Deploy na Netlify (5 minutos)

### 1.1 Enviar o código para o GitHub

```bash
git checkout -b feature/backend-netlify
git add .
git commit -m "feat: backend completo em Netlify Functions + Blobs"
git push origin feature/backend-netlify
```

### 1.2 Conectar o repositório

1. Acesse <https://app.netlify.com> → **Add new site → Import an existing project**.
2. Escolha o repositório `Sigmabahia/projeto` e a branch `main`.
3. Configurações de build (já vêm do `netlify.toml`, confirme):
   - **Build command:** *(vazio)*
   - **Publish directory:** `.`
   - **Functions directory:** `netlify/functions`
4. Clique em **Deploy site**.

> O `netlify.toml` já define `node_bundler = "esbuild"` e o redirect
> `/api/* → /.netlify/functions/api/:splat`, então `/api/products` funciona
> exatamente como uma API normal.

### 1.3 Variáveis de ambiente (obrigatório)

Em **Site configuration → Environment variables**, adicione:

| Variável | Exemplo | Obrigatória |
|---|---|---|
| `JWT_SECRET` | saída de `openssl rand -hex 48` | **sim** |
| `ADMIN_EMAIL` | `admin@royalsuits.com.br` | **sim** |
| `ADMIN_PASSWORD` | senha forte | **sim** |
| `ADMIN_BOOTSTRAP_TOKEN` | token aleatório | recomendada |
| `PIX_CHAVE` | `contato@royalsuits.com.br` | sim (para PIX) |
| `PIX_NOME` | `ROYAL SUITS` | sim |
| `PIX_CIDADE` | `SAO PAULO` | sim |
| `SITE_URL` | `https://royalsuits.netlify.app` | recomendada |
| `WHATSAPP` | `5511912345678` | opcional |
| `FRETE_GRATIS_ACIMA_DE` | `500` | opcional |
| `DESCONTO_PIX` | `5` | opcional |
| `RESEND_API_KEY` | `re_...` | opcional |
| `EMAIL_FROM` | `Royal Suits <contato@...>` | opcional |
| `EMAIL_NOTIFICACAO` | `contato@...` | opcional |

Depois de salvar, faça **Deploys → Trigger deploy → Clear cache and deploy site**
para que as funções recebam as variáveis.

> **Netlify Blobs** não precisa de configuração: a função usa
> `getStore({ name: "royal-suits", consistency: "strong" })` e a Netlify injeta as
> credenciais automaticamente em runtime. Em produção os dados persistem entre
> deploys e ficam isolados por site.

### 1.4 Criar o administrador real

O login de admin "virtual" (via `ADMIN_EMAIL`/`ADMIN_PASSWORD`) já funciona, mas
para ter um usuário real no banco (com histórico, sem depender das envs):

```bash
curl -X POST https://SEU-SITE.netlify.app/api/admin/bootstrap \
  -H "x-bootstrap-token: SEU_ADMIN_BOOTSTRAP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Administrador","email":"admin@royalsuits.com.br","senha":"SuaSenhaForte123"}'
```

Acesse o painel em `https://SEU-SITE.netlify.app/admin.html`.

### 1.5 Domínio próprio (opcional)

**Domain management → Add a domain** → `royalsuits.com.br`. A Netlify emite o
certificado HTTPS automaticamente. Atualize `SITE_URL` depois.

---

## 2. Rodar localmente

```bash
npm install
npm run dev          # netlify dev — sobe o site + functions em http://localhost:8888
npm test             # 50 asserções da API usando banco em memória
```

Sem a CLI da Netlify também é possível testar:

```bash
PORT=8899 node scripts/dev-server.mjs   # servidor estático + /api com banco em memória
```

Credenciais de desenvolvimento (definidas em `scripts/dev-server.mjs`):
`admin@royalsuits.com.br` / `admin123456`.

`npm run seed` popula 20 produtos e 2 cupons (`BEMVINDO10`, `ROYAL50`).

---

## 3. API REST

Base: `https://SEU-SITE.netlify.app/api`

Autenticação: `Authorization: Bearer <token>` (JWT de 7 dias).
Convidado: header `X-Session-Id: <uuid>` (o site já gera e guarda em `localStorage`).

### Autenticação
| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/register` | cria conta `{nome,email,senha,telefone,cpf}` |
| POST | `/auth/login` | retorna `{token,usuario}` |
| GET | `/auth/me` | perfil do usuário logado |
| PATCH | `/auth/me` | atualiza nome/telefone/cpf/endereço |
| POST | `/auth/forgot-password` | gera token de recuperação (e-mail se configurado) |
| POST | `/auth/reset-password` | `{token,novaSenha}` |

### Catálogo
| Método | Rota | Descrição |
|---|---|---|
| GET | `/products` | filtros `?colecao=&tipo=&publico=&q=&limit=&offset=&sort=` |
| GET | `/products/:slug` | detalhe do produto |

### Carrinho e favoritos
| Método | Rota | Descrição |
|---|---|---|
| GET | `/cart` | carrinho do dono (usuário ou convidado) |
| POST | `/cart` | `{productId,quantidade,tamanho,cor}` |
| PATCH | `/cart/:productId` | altera quantidade |
| DELETE | `/cart/:productId` | remove item |
| DELETE | `/cart` | esvazia |
| GET | `/favorites` | lista de favoritos |
| POST | `/favorites` | `{productId}` ou `{nome}` |
| DELETE | `/favorites/:productId` | remove |

### Frete, cupom e pedidos
| Método | Rota | Descrição |
|---|---|---|
| GET | `/shipping/quote?cep=01310100&subtotal=900` | PAC, SEDEX e retirada |
| POST | `/coupons/validate` | `{codigo,subtotal}` |
| POST | `/orders` | cria pedido (recalcula preços/frete no servidor) |
| GET | `/orders` | pedidos do usuário logado |
| GET | `/orders/:numero` | detalhe (dono ou admin) |
| POST | `/orders/:numero/cancel` | cancela se ainda não enviado |

O pedido PIX retorna `pagamento.pix.copiaECola` (BR Code EMV válido) e
`pagamento.pix.txid`. O total é sempre recalculado no servidor: o cliente nunca
define preço.

### Contato e newsletter
| Método | Rota | Descrição |
|---|---|---|
| POST | `/contact` | `{nome,email,telefone,assunto,mensagem}` |
| POST | `/newsletter` | `{email}` (idempotente) |

### Administração (requer `role: admin`)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/admin/stats` | receita, pedidos, ticket médio, clientes, mensagens |
| GET | `/admin/orders?status=` | todos os pedidos |
| PATCH | `/admin/orders/:numero/status` | `{status}` |
| GET | `/admin/messages` | mensagens de contato |
| PATCH | `/admin/messages/:id` | marca como lida/respondida |
| GET | `/admin/newsletter` | inscritos |
| POST | `/admin/products` | cria produto |
| PATCH | `/admin/products/:id` | atualiza produto |
| DELETE | `/admin/products/:id` | desativa produto |
| GET/POST | `/admin/coupons` | lista/cria cupom |
| DELETE | `/admin/coupons/:codigo` | remove cupom |
| POST | `/admin/bootstrap` | cria admin real (header `x-bootstrap-token`) |

---

## 4. Como o frontend usa a API

`js/rs-api.js` expõe `window.RS`:

```js
await RS.login(email, senha);        // guarda token + usuário
await RS.register({ nome, email, senha });
await RS.criarPedido(pedido);        // checkout
await RS.meusPedidos();              // meus-pedidos.html
await RS.cotarFrete(cep, subtotal);  // checkout
await RS.validarCupom(codigo, subtotal);
await RS.contato({ nome, email, mensagem });
await RS.newsletter(email);
```

Se a API estiver indisponível, cada página cai de volta para o comportamento
antigo em `localStorage` — o site nunca quebra, apenas perde a sincronização.

---

## 5. Segurança

- Senhas com **scrypt** (`scrypt$salt$hash`), nunca em texto puro.
- JWT **HS256** assinado com `JWT_SECRET`, expiração de 7 dias.
- Rotas `/admin/*` exigem `role === "admin"`; o token é verificado no servidor.
- Preços, frete e descontos são **recalculados no servidor** a cada pedido.
- Headers de segurança no `netlify.toml` (X-Frame-Options, nosniff, referrer).
- `admin.html` tem `noindex,nofollow` e está fora do `sitemap.xml`.

> Troque `JWT_SECRET` e `ADMIN_PASSWORD` antes de ir ao ar. Nunca comite o `.env`.

---

## 6. Checklist de go-live

- [ ] `JWT_SECRET` gerado e configurado
- [ ] `ADMIN_EMAIL` / `ADMIN_PASSWORD` fortes
- [ ] `PIX_CHAVE` com a chave real da loja
- [ ] Deploy com cache limpo após salvar as variáveis
- [ ] `/api/products` retorna os 20 produtos
- [ ] Cadastro → login → pedido PIX testado em produção
- [ ] `admin.html` abrindo com a conta admin
- [ ] Domínio + HTTPS ativos
