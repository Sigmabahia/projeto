/* =================================
   LOGIN - ROYAL SUITS
================================= */

document.addEventListener("DOMContentLoaded", function () {

    const formulario = document.getElementById("form-login");

    if (!formulario) return;

    formulario.addEventListener("submit", function (event) {

        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const senha = document.getElementById("senha").value;

        if (!email || !senha) {

            alert("Preencha e-mail e senha para entrar.");
            return;

        }

        if (senha.length < 6) {

            alert("A senha precisa ter pelo menos 6 caracteres.");
            return;

        }

        localStorage.setItem("usuarioLogado", email);

        window.location.href = "paginainicial.html";

    });

});
