# Royal Suits — Formaturas e Casamentos

Loja virtual de trajes e vestidos de gala para formaturas, casamentos e eventos especiais.

## Páginas

| Arquivo | Descrição |
| --- | --- |
| `paginainicial.html` | Página inicial com carrossel, categorias, modelos e newsletter |
| `formaturas.html` | Coleção de formaturas |
| `casamentos.html` | Coleção de casamentos |
| `carrinho.html` | Carrinho de compras com calculadora de frete |
| `checkout.html` | Checkout em 3 etapas |
| `meus-pedidos.html` | Histórico de pedidos |
| `favoritos.html` | Lista de favoritos |
| `login.html` / `criarconta.html` / `recuperar-senha.html` | Área do cliente |
| `contato.html` | Contato e dúvidas frequentes |
| `politica-de-privacidade.html` | Política de Privacidade e Cookies (LGPD) |
| `termos-de-uso.html` | Termos de Uso |
| `trocas-e-devolucoes.html` | Política de Trocas e Devoluções |
| `404.html` | Página de erro |

## Arquivos compartilhados

- `extras.css` / `extras.js` — barra de avisos, banner de cookies (LGPD), botão "voltar ao topo", selos de pagamento, links institucionais no rodapé, avisos flutuantes e nome do usuário logado.
- `legal.css` — estilos das páginas institucionais.
- `favicon.svg` — ícone do site.
- `robots.txt` / `sitemap.xml` — arquivos de indexação para buscadores.

## Como rodar localmente

```bash
python3 -m http.server 8080
```

Depois acesse `http://localhost:8080/paginainicial.html`.

## Configurações da loja

Os dados de contato (WhatsApp, e-mail, telefone, CNPJ) ficam no topo do arquivo `extras.js`,
no objeto `CONFIG`. Atualize-os com as informações reais antes de publicar.

---

## Loja completa: frete, pagamento e checkout

Esta branch (`melhorias-loja-checkout`) adiciona o fluxo de compra ponta a ponta.

### Novas páginas

| Arquivo | Descrição |
| --- | --- |
| `checkout.html` | Checkout em 3 etapas (dados → entrega → pagamento) com resumo lateral fixo |
| `meus-pedidos.html` | Histórico de pedidos salvos no navegador, com PIX, recompra e WhatsApp |

### Núcleo compartilhado — `loja.js`

Todo o comércio eletrônico vive em `window.Loja`, usado por `carrinho.js`, `checkout.js` e `meus-pedidos.js`:

- **Carrinho** — `adicionarAoCarrinho`, `alterarQuantidade`, `removerDoCarrinho`, `subtotalCarrinho` (persistido em `localStorage`).
- **Frete** — `calcularFrete(cep, subtotal)` devolve PAC, SEDEX e Retirada com preço e prazo em dias úteis.
- **Endereço** — `buscarCEP(cep)` consulta a API pública **ViaCEP** e devolve rua, bairro, cidade e UF.
- **Validações** — CPF/CNPJ (dígito verificador), cartão de crédito (Luhn), bandeira, validade, e-mail, telefone e CEP.
- **PIX** — `gerarPixCopiaECola(valor)` monta o BR Code EMV oficial (CRC16-CCITT), pronto para leitura de qualquer banco.
- **Parcelas** — `calcularParcelas(total)` aplica 3x sem juros e 2,49% a.m. nas demais.
- **Pedidos** — `salvarPedido` / `obterPedidos` (máx. 50 pedidos por navegador).

### Como o frete é calculado

A tabela fica em `Loja.CONFIG.frete.regioes`, indexada pelo **primeiro dígito do CEP** (0 a 9).
Cada região define preço e prazo de PAC e SEDEX. O prazo é somado em **dias úteis** a partir da data do pedido.
Frete grátis para compras acima de `Loja.CONFIG.frete.gratisAcimaDe` (R$ 500) e retirada na loja sempre gratuita.
Ajuste os valores conforme a sua tabela real de transportadora.

### Como configurar o pagamento de verdade

Abra `loja.js` e edite `CONFIG.pagamento`:

```js
pagamento: {
  pixChave: "sua-chave-pix@seudominio.com.br", // chave real da loja (e-mail, CNPJ, telefone ou aleatória)
  pixNome: "ROYAL SUITS",                       // nome do recebedor (máx. 25 caracteres)
  pixCidade: "SAO PAULO",                       // cidade do recebedor
  gatewayUrl: "",                               // URL do seu backend/gateway (Mercado Pago, Pagar.me, Asaas...)
  parcelasSemJuros: 3,
  jurosMes: 2.49,
  descontoPix: 5                                // % de desconto no PIX
}
```

- **PIX** — já funciona sem backend. Com a `pixChave` real, o QR Code e o "copia e cola" são pagáveis em qualquer app de banco.
- **Cartão e boleto** — o site valida os dados e monta o pedido, mas a cobrança precisa de um gateway.
  Preencha `gatewayUrl` com um endpoint que receba `POST` JSON e responda `{ "url": "https://..." }`.
  O checkout redireciona o cliente para essa URL automaticamente. Sem gateway, o pedido é registrado como "aguardando pagamento".
- **Nunca** coloque chaves secretas (`access_token`, `client_secret`) no front-end — elas devem ficar no seu servidor.

### Publicar o site

O site é 100% estático, então roda em qualquer hospedagem:

- **Netlify / Vercel / Cloudflare Pages** — arraste a pasta do projeto; use `paginainicial.html` como página inicial ou renomeie/crie um `index.html`.
- **GitHub Pages** — ative em *Settings → Pages* apontando para a branch publicada.
- **Hospedagem tradicional (cPanel)** — envie os arquivos por FTP para `public_html`.

### Recursos extras incluídos

Busca de produtos no cabeçalho (com `Ctrl + K`), botão flutuante de WhatsApp, animações de entrada,
cabeçalho fixo ao rolar, dados estruturados JSON-LD (`ClothingStore`), máscaras de formulário,
estados de carregamento, breadcrumbs, página 404, `robots.txt` e `sitemap.xml`.

---

## Performance (PageSpeed)

O site foi otimizado para carregar rápido, principalmente no celular:

- **Imagens em WebP** — todas as fotos foram convertidas. As imagens dos ternos caíram de 5,9 MB para 0,33 MB (−94%)
  e a pasta `imagens/` inteira de 6,3 MB para 1,2 MB. Nenhuma imagem depende de servidor externo (Pinterest, Bisutti etc.),
  então o visual do site não quebra se um link de fora sair do ar.
- **Lazy loading** — imagens abaixo da dobra usam `loading="lazy"`; a imagem principal usa `fetchpriority="high"` + `<link rel="preload">`.
- **`width` e `height` em todas as imagens** — evita o "pulo" de layout (CLS) enquanto carregam.
- **Fontes sem bloquear a renderização** — o CSS do Google Fonts é carregado com `preload` + `media="print"` e trocado
  para `all` quando chega, com fallback em `<noscript>`.
- **Scripts com `defer`** — nenhum JavaScript bloqueia o HTML.
- **Cache** — `_headers` (Netlify / Cloudflare Pages) e `.htaccess` (Apache / cPanel) já configurados:
  imagens com 1 ano de cache `immutable`, CSS/JS com 1 semana, HTML sempre revalidado.

Se trocar uma imagem, mantenha o mesmo nome de arquivo para aproveitar o cache — ou renomeie para forçar a atualização.
