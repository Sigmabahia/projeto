/* =================================
   CARRINHO - ROYAL SUITS
================================= */

function obterCarrinho() {
    try {
        return JSON.parse(localStorage.getItem("carrinho")) || [];
    } catch (erro) {
        return [];
    }
}

function salvarCarrinho(lista) {
    localStorage.setItem("carrinho", JSON.stringify(lista));
}

function formatarPreco(valor) {
    return "R$ " + Number(valor).toFixed(2).replace(".", ",");
}

function atualizarContador() {

    const contador = document.getElementById("contador-carrinho");

    if (!contador) return;

    const total = obterCarrinho().reduce(
        (soma, produto) => soma + (Number(produto.quantidade) || 1),
        0
    );

    contador.textContent = total;
}

function alterarQuantidade(nome, diferenca) {

    const carrinho = obterCarrinho();
    const produto = carrinho.find(item => item.nome === nome);

    if (!produto) return;

    produto.quantidade = (Number(produto.quantidade) || 1) + diferenca;

    if (produto.quantidade < 1) {
        produto.quantidade = 1;
    }

    salvarCarrinho(carrinho);

    renderizarCarrinho();
}

function removerProduto(nome) {

    const carrinho = obterCarrinho().filter(item => item.nome !== nome);

    salvarCarrinho(carrinho);

    renderizarCarrinho();
}

function renderizarCarrinho() {

    const lista = document.getElementById("lista-produtos");
    const vazio = document.getElementById("carrinho-vazio");
    const quantidade = document.getElementById("quantidade-produtos");
    const subtotal = document.getElementById("subtotal");
    const total = document.getElementById("total");
    const botaoFinalizar = document.getElementById("finalizar-btn");

    if (!lista) return;

    const carrinho = obterCarrinho();

    lista.innerHTML = "";

    if (carrinho.length === 0) {

        if (vazio) vazio.style.display = "block";
        if (quantidade) quantidade.textContent = "0 itens";
        if (subtotal) subtotal.textContent = "R$ 0,00";
        if (total) total.textContent = "R$ 0,00";
        if (botaoFinalizar) botaoFinalizar.disabled = true;

        atualizarContador();
        return;

    }

    if (vazio) vazio.style.display = "none";

    let valorTotal = 0;
    let itens = 0;

    carrinho.forEach(produto => {

        const qtd = Number(produto.quantidade) || 1;
        const preco = Number(produto.preco) || 0;

        valorTotal += preco * qtd;
        itens += qtd;

        const item = document.createElement("div");
        item.className = "item-carrinho";

        const imagem = produto.imagem || "imagens/ternos/terno-azul-01.png";

        item.innerHTML = `
            <div class="item-imagem">
                <img src="${imagem}" alt="${produto.nome}">
            </div>
            <div class="item-info">
                <h3>${produto.nome}</h3>
                <p class="item-preco">${preco > 0 ? formatarPreco(preco) : "Sob consulta"}</p>
                <div class="quantidade">
                    <button type="button" class="menos">−</button>
                    <span>${qtd}</span>
                    <button type="button" class="mais">+</button>
                </div>
            </div>
            <div class="item-acoes">
                <button type="button" class="remover">REMOVER</button>
            </div>
        `;

        item.querySelector(".menos").addEventListener("click", function () {
            alterarQuantidade(produto.nome, -1);
        });

        item.querySelector(".mais").addEventListener("click", function () {
            alterarQuantidade(produto.nome, 1);
        });

        item.querySelector(".remover").addEventListener("click", function () {
            removerProduto(produto.nome);
        });

        lista.appendChild(item);

    });

    if (quantidade) quantidade.textContent = itens + (itens === 1 ? " item" : " itens");
    if (subtotal) subtotal.textContent = formatarPreco(valorTotal);
    if (total) total.textContent = formatarPreco(valorTotal);
    if (botaoFinalizar) botaoFinalizar.disabled = false;

    atualizarContador();
}

document.addEventListener("DOMContentLoaded", function () {

    renderizarCarrinho();

    const botaoFinalizar = document.getElementById("finalizar-btn");

    if (botaoFinalizar) {

        botaoFinalizar.addEventListener("click", function () {

            alert("Pedido finalizado! Entraremos em contato para combinar os detalhes.");

            salvarCarrinho([]);

            renderizarCarrinho();

        });

    }

});
