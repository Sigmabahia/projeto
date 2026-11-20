# Royal Suits — Formaturas e Casamentos

Loja virtual de trajes e vestidos de gala para formaturas, casamentos e eventos especiais.

## Páginas

| Arquivo | Descrição |
| --- | --- |
| `paginainicial.html` | Página inicial com carrossel, categorias, modelos e newsletter |
| `formaturas.html` | Coleção de formaturas |
| `casamentos.html` | Coleção de casamentos |
| `carrinho.html` | Carrinho de compras |
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
