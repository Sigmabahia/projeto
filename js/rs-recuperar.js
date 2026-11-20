/* ==========================================================
   ROYAL SUITS — RECUPERAÇÃO / REDEFINIÇÃO DE SENHA (API)
   ========================================================== */

document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("form-recuperar");
  if (!form) return;

  var params = new URLSearchParams(window.location.search);
  var token = params.get("token");
  var msg = document.getElementById("msg-recuperar");

  function aviso(texto) {
    if (msg) {
      msg.textContent = texto;
      msg.style.display = "block";
    } else if (window.rsToast) {
      window.rsToast(texto);
    } else {
      alert(texto);
    }
  }

  /* Se veio com token, troca o formulário por "nova senha" */
  if (token) {
    form.innerHTML =
      '<input type="password" id="senha" placeholder="Nova senha" minlength="6" required autocomplete="new-password">' +
      '<input type="password" id="confirmar-senha" placeholder="Confirme a nova senha" minlength="6" required autocomplete="new-password">' +
      "<button type=\"submit\">SALVAR NOVA SENHA</button>" +
      '<p class="msg" id="msg-recuperar"></p>';
    msg = document.getElementById("msg-recuperar");
  }

  form.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    try {
      if (token) {
        var senha = (document.getElementById("senha") || {}).value || "";
        var confirmar = (document.getElementById("confirmar-senha") || {}).value || "";
        if (senha.length < 6) return aviso("A nova senha precisa ter 6 caracteres ou mais.");
        if (senha !== confirmar) return aviso("As senhas não conferem.");

        await window.RS.api("/auth/reset-password", {
          method: "POST",
          body: { token: token, senha: senha },
        });
        aviso("Senha alterada com sucesso! Redirecionando para o login...");
        setTimeout(function () {
          window.location.href = "login.html";
        }, 1400);
      } else {
        var email = (document.getElementById("email-recuperar") || {}).value || "";
        await window.RS.api("/auth/forgot-password", {
          method: "POST",
          body: { email: email.trim() },
        });
        aviso("Se este e-mail estiver cadastrado, você receberá as instruções em alguns minutos.");
      }
    } catch (erro) {
      aviso(erro.message || "Não foi possível concluir. Tente novamente.");
    }
  });
});
