/* Extrai os produtos reais dos HTMLs e gera o seed do backend. */
import fs from "node:fs";

const arquivos = [
  { file: "formaturas.html", colecao: "formaturas" },
  { file: "casamentos.html", colecao: "casamentos" },
  { file: "index.html", colecao: "destaque" },
];

const produtos = [];
const vistos = new Set();

for (const { file, colecao } of arquivos) {
  const html = fs.readFileSync(file, "utf8");
  const cards = html.split('class="produto-card"').slice(1);

  for (const card of cards) {
    const nome = (card.match(/<h3>([^<]+)<\/h3>/) || [])[1];
    if (!nome) continue;

    const img =
      (card.match(/data-imagem="([^"]+)"/) || [])[1] ||
      (card.match(/<img src="([^"]+)"/) || [])[1] ||
      "";
    const precoTxt = (card.match(/data-preco="([^"]*)"/) || [])[1] || "";
    const precoCard = (card.match(/class="preco">R\$\s*([\d.,]+)/) || [])[1] || "";
    const descricao = ((card.match(/class="descricao">([\s\S]*?)<\/p>/) || [])[1] || "")
      .replace(/\s+/g, " ")
      .trim();
    const categoriaTexto = ((card.match(/class="categoria-produto">([^<]+)</) || [])[1] || "").trim();
    const categoriaCss = (card.match(/data-categoria="([^"]+)"/) || [])[1] || "";

    const parsePreco = (v) =>
      Number(String(v).replace(/\./g, "").replace(",", ".")) || 0;

    const preco = parsePreco(precoTxt) || parsePreco(precoCard);
    const chave = nome.trim().toLowerCase();
    if (vistos.has(chave)) continue;
    vistos.add(chave);

    const tipo = /vestido/i.test(nome + categoriaTexto) ? "vestido" : "terno";
    const publico = tipo === "vestido" ? "feminino" : "masculino";

    produtos.push({
      nome: nome.trim(),
      slug: chave
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
      descricao,
      preco,
      precoSobConsulta: preco === 0,
      imagem: img,
      colecao: colecao === "destaque" ? "formaturas" : colecao,
      tipo,
      publico,
      categoria: categoriaCss || tipo,
      destaque: /DESTAQUE/i.test(card),
      novidade: /NOVO/i.test(card),
      ativo: true,
      estoque: 10,
      tamanhos: tipo === "vestido" ? ["P", "M", "G", "GG"] : ["46", "48", "50", "52", "54"],
    });
  }
}

fs.writeFileSync("scripts/produtos-extraidos.json", JSON.stringify(produtos, null, 2));
console.log(`Produtos extraídos: ${produtos.length}`);
console.log(produtos.map((p) => `- ${p.nome} | R$ ${p.preco} | ${p.colecao}/${p.tipo}`).join("\n"));
