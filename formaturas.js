
const filtros = document.querySelectorAll(".filtro");
const produtos = document.querySelectorAll(".produto-card");

filtros.forEach(filtro => {
    filtro.addEventListener("click", function () {

        filtros.forEach(item => {
            item.classList.remove("ativo");
        });

        this.classList.add("ativo");

        const categoria = this.dataset.filtro;

        produtos.forEach(produto => {

            if (
                categoria === "todos" ||
                produto.dataset.categoria === categoria
            ) {
                produto.style.display = "";
            } else {
                produto.style.display = "none";
            }

        });
    });
});

// ADICIONAR AO CARRINHO
function adicionarCarrinho(nome, preco, imagem) {

    let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

    const produtoExistente = carrinho.find(
        produto => produto.nome === nome
    );

    if (produtoExistente) {
        produtoExistente.quantidade++;
    } else {
        carrinho.push({
            nome: nome,
            preco: preco,
            imagem: imagem,
            quantidade: 1
        });
    }

    localStorage.setItem("carrinho", JSON.stringify(carrinho));

    alert(nome + " foi adicionado ao carrinho!");
}
