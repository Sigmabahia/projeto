/* ==========================================================
   ROYAL SUITS — NEWSLETTER (API)
   ========================================================== */

document.addEventListener("DOMContentLoaded", function () {
  var forms = document.querySelectorAll(".newsletter form, form#form-newsletter");

  Array.prototype.forEach.call(forms, function (form) {
    var input = form.querySelector('input[type="email"]');
    var botao = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", async function (evento) {
      evento.preventDefault();
      if (!input) return;

      var email = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
        if (window.rsToast) window.rsToast("Informe um e-mail válido.");
        else alert("Informe um e-mail válido.");
        return;
      }

      var texto = botao ? botao.textContent : "";
      if (botao) {
        botao.disabled = true;
        botao.textContent = "ENVIANDO...";
      }

      try {
        await window.RS.newsletter(email);
        input.value = "";
        if (window.rsToast) window.rsToast("Inscrição confirmada! Obrigado.");
        else alert("Inscrição confirmada!");
      } catch (erro) {
        if (window.rsToast) window.rsToast(erro.message);
        else alert(erro.message);
      } finally {
        if (botao) {
          botao.disabled = false;
          botao.textContent = texto;
        }
      }
    });
  });
});
