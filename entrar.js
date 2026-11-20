/* =================================
   LOGIN - ROYAL SUITS (API)
================================= */

document.addEventListener("DOMContentLoaded", function () {

    const formulario = document.getElementById("form-login");

    if (!formulario) return;

    const botao = formulario.querySelector('button[type="submit"]');

    function aviso(mensagem) {
        if (window.rsToast) return window.rsToast(mensagem);
        alert(mensagem);
    }

    formulario.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const senha = document.getElementById("senha").value;

        if (!email || !senha) {
            aviso("Preencha e-mail e senha para entrar.");
            return;
        }

        if (senha.length < 6) {
            aviso("A senha precisa ter pelo menos 6 caracteres.");
            return;
        }

        const textoOriginal = botao ? botao.textContent : "";
        if (botao) {
            botao.disabled = true;
            botao.textContent = "ENTRANDO...";
        }

        try {
            await window.RS.login(email, senha);
            window.location.href = "paginainicial.html";
        } catch (erro) {
            aviso(erro.message || "Não foi possível entrar. Tente novamente.");
            if (botao) {
                botao.disabled = false;
                botao.textContent = textoOriginal;
            }
        }

    });

});
