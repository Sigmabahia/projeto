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
