# Royal Suits — deploy na Netlify

Loja estática (HTML/CSS/JS) + backend serverless em **Netlify Functions** com banco em
**Netlify Blobs**. Não existe servidor para administrar nem banco externo para contratar.

```
.
├── netlify.toml                 # build, headers, redirects, bloqueio de fontes
├── netlify/
│   ├── functions/api.mjs        # router único da API (rota pública /api/*)
│   └── lib/
│       ├── db.mjs               # Netlify Blobs (+ driver de memória para testes)
│       ├── auth.mjs             # scrypt + JWT HS256, papéis cliente/admin
│       ├── http.mjs             # respostas e validação
│       ├── pix.mjs              # BR Code EMV + CRC16
│       ├── frete.mjs            # frete por CEP, cupons, desconto PIX
│       ├── mail.mjs             # e-mails via Resend (opcional)
│       └── products-seed.mjs    # catálogo inicial (18 peças)
├── js/rs-api.js                 # cliente da API usado pelas páginas
├── js/rs-chat.js                # chatbot (roda no navegador, sem backend)
├── admin.html                   # painel administrativo
└── scripts/
    ├── verificar-deploy.mjs     # confere o site publicado
    ├── dev-server.mjs           # site + API local sem Netlify CLI
    ├── seed-local.mjs           # popula catálogo e cupons
    └── test-api.mjs             # 50 asserções da API
```

---

## 1. Primeiro deploy (5 minutos)

### 1.1 Conectar o repositório

1. <https://app.netlify.com> → **Add new site → Import an existing project**.
2. Escolha `Sigmabahia/projeto` e a branch `main`.
3. Confirme o que já vem do `netlify.toml`:
   - **Build command:** vazio
   - **Publish directory:** `.`
   - **Functions directory:** `netlify/functions`
4. **Deploy site**.

O `netlify.toml` já define tudo: Node 20, bundler esbuild, cabeçalhos de segurança,
cache e o bloqueio de `/netlify/*`, `/scripts/*`, `/package.json`, `/.env*` e afins
(necessário porque o publish é a raiz do repositório).

A rota pública da API é declarada dentro da própria função:

```js
// netlify/functions/api.mjs
export const config = { path: ["/api", "/api/*"] };
```

Com isso `/api/health`, `/api/products` e todas as demais rotas chegam na função sem
depender de redirect e sem expor `/.netlify/functions/api`.

### 1.2 Variáveis de ambiente (obrigatório)

**Site configuration → Environment variables → Add a variable.**

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

Gerar os segredos de uma vez:

```bash
echo "JWT_SECRET=$(openssl rand -hex 48)"
echo "ADMIN_BOOTSTRAP_TOKEN=$(openssl rand -hex 24)"
```

Depois de salvar: **Deploys → Trigger deploy → Clear cache and deploy site**.
As variáveis só entram em vigor em um deploy novo.

> **JWT_SECRET sem configurar** faz a API usar um segredo de desenvolvimento e
> registrar um erro no log da função. O site continua navegável, mas qualquer pessoa
> poderia forjar um token de admin. Configure antes de abrir a loja ao público.

> **Netlify Blobs** não precisa de configuração: `getStore({ name, consistency: "strong" })`
> recebe as credenciais automaticamente em runtime. Os dados persistem entre deploys e
> ficam isolados por site.

### 1.3 Criar o administrador real

O login via `ADMIN_EMAIL`/`ADMIN_PASSWORD` já funciona, mas o usuário real no banco
(com histórico, sem depender das variáveis) é criado assim:

```bash
curl -X POST https://SEU-SITE.netlify.app/api/admin/bootstrap \
  -H "x-bootstrap-token: SEU_ADMIN_BOOTSTRAP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Administrador","email":"admin@royalsuits.com.br","senha":"SuaSenhaForte123"}'
```

Painel: `https://SEU-SITE.netlify.app/admin.html`.

### 1.4 Conferir se ficou tudo certo

```bash
node scripts/verificar-deploy.mjs https://SEU-SITE.netlify.app
```

O script testa páginas, `/api/health`, `/api/products`, cotação de frete, 404 da API,
bloqueio dos arquivos de código e cabeçalhos. Saída esperada: `TUDO CERTO: 16/16`.

### 1.5 Domínio próprio (opcional)

**Domain management → Add a domain** → `royalsuits.com.br`. A Netlify emite o
certificado HTTPS sozinha. Depois atualize `SITE_URL`.

---

## 2. Rodar localmente

Com a CLI da Netlify (mais fiel ao produção, inclusive Blobs e redirects):

```bash
npm install
npm run dev            # http://localhost:8888
```

Sem a CLI:

```bash
PORT=8899 node scripts/dev-server.mjs   # site + /api com banco em memória
```

Testes e dados:

```bash
npm test               # 50 asserções da API (banco em memória)
npm run seed           # popula 18 produtos e 2 cupons (BEMVINDO10, ROYAL50)
```

Credenciais de desenvolvimento: `admin@royalsuits.com.br` / `admin123456`.

---

## 3. Depois de cada alteração

1. `git push` na branch → a Netlify gera um **Deploy Preview** com URL própria.
2. Teste o preview: `node scripts/verificar-deploy.mjs https://deploy-preview-XX--seu-site.netlify.app`.
3. Merge na `main` publica em produção.
4. Se mexeu em função ou variável: **Clear cache and deploy site**.

Cache: HTML é sempre revalidado, CSS e JS ficam 1 hora, imagens ficam 1 ano
(imutáveis). Se trocar uma imagem mantendo o mesmo nome, renomeie o arquivo para
o navegador baixar a versão nova.

---

## 4. Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `/api/*` devolve 404 | função não foi detectada ou o deploy é antigo | confira **Functions** no painel; se `api` não aparece, veja o log de build; faça deploy sem cache |
| `{"errorType":"Runtime.ImportModuleError"}` | dependência faltando | `@netlify/blobs` precisa estar em `dependencies` (está) e o build precisa rodar `npm install` (padrão) |
| Login funciona e some no request seguinte | `JWT_SECRET` mudou entre deploys | fixe o valor e faça um deploy novo |
| Dados somem | store diferente ou site recriado | Blobs é por site; recriar o site começa um banco vazio |
| `Erro interno` em qualquer rota | exceção na função | **Functions → api → Logs** mostra o stack trace |
| Página antiga após deploy | cache do navegador | HTML é revalidado; force recarregar com Ctrl+Shift+R |
| Fonte do backend acessível | redirect de bloqueio removido | mantenha os `[[redirects]]` com `force = true` no `netlify.toml` |
| Produtos antigos aparecendo | banco já populado em deploy anterior | apague os itens em **admin.html → Produtos**; o seed só roda com o banco vazio |

---

## 5. Estrutura da API

Base: `https://SEU-SITE.netlify.app/api`

```
POST   /auth/register          POST /auth/login          GET  /auth/me
PATCH  /auth/profile           POST /auth/forgot-password
POST   /auth/reset-password

GET    /products               GET  /products/:slug

GET    /cart                   POST /cart/items
PATCH  /cart/items/:id         DELETE /cart/items/:id    DELETE /cart
GET    /favorites              POST /favorites           DELETE /favorites/:id

POST   /shipping/quote         POST /coupons/validate
POST   /orders                 GET  /orders              GET  /orders/:numero
POST   /orders/:numero/cancel

POST   /contact                POST /newsletter

POST   /admin/bootstrap        GET  /admin/stats         GET  /admin/orders
PATCH  /admin/orders/:numero/status
GET    /admin/messages         PATCH /admin/messages/:id
GET    /admin/newsletter
POST   /admin/products         PATCH /admin/products/:id DELETE /admin/products/:id
GET    /admin/coupons          POST /admin/coupons       DELETE /admin/coupons/:codigo

GET    /health
```

Autenticação: `Authorization: Bearer <token>`; sessão de visitante: `X-Session-Id`.
