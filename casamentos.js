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

function consultarProduto(nome) {

    alert(
        "Você selecionou: " + nome +
        "\n\nEntre em contato com a ROYAL SUITS para consultar disponibilidade e valores."
    );

}


/* =================================
   FAVORITOS (coração dos cards)
================================= */

function obterFavoritos() {
    try {
        return JSON.parse(localStorage.getItem("favoritos")) || [];
    } catch (erro) {
        return [];
    }
}

function alternarFavorito(botao) {

    const nome = botao.dataset.nome;
    const imagem = botao.dataset.imagem;
    const preco = Number(botao.dataset.preco) || 0;

    let favoritos = obterFavoritos();

    const existe = favoritos.some(produto => produto.nome === nome);

    if (existe) {
        favoritos = favoritos.filter(produto => produto.nome !== nome);
        botao.classList.remove("ativo");
    } else {
        favoritos.push({ nome: nome, imagem: imagem, preco: preco });
        botao.classList.add("ativo");
    }

    localStorage.setItem("favoritos", JSON.stringify(favoritos));

    if (window.rsSyncFavorito) {
        window.rsSyncFavorito(nome, !existe);
    }
}

document.addEventListener("DOMContentLoaded", function () {

    const favoritos = obterFavoritos();

    document.querySelectorAll(".favorito").forEach(botao => {

        if (favoritos.some(produto => produto.nome === botao.dataset.nome)) {
            botao.classList.add("ativo");
        }

        botao.addEventListener("click", function () {
            alternarFavorito(botao);
        });

    });

});
