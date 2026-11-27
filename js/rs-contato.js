/* ==========================================================
   ROYAL SUITS — FORMULÁRIO DE CONTATO (API)
   ========================================================== */

document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("form-contato");
  if (!form) return;

  var msg = document.getElementById("contato-msg");
  var botao = form.querySelector('button[type="submit"]');

  function mostrar(texto, erro) {
    if (!msg) return;
    msg.textContent = texto;
    msg.style.display = "block";
    msg.style.color = erro ? "#0b1f3b" : "#0f4c81";
  }

  form.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    var dados = {
      nome: (document.getElementById("contato-nome") || {}).value || "",
      email: (document.getElementById("contato-email") || {}).value || "",
      telefone: (document.getElementById("contato-telefone") || {}).value || "",
      assunto: (document.getElementById("contato-assunto") || {}).value || "",
      mensagem: (document.getElementById("contato-mensagem") || {}).value || "",
    };

    if (dados.nome.trim().length < 3) return mostrar("Informe seu nome.", true);
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(dados.email.trim()))
      return mostrar("Informe um e-mail válido.", true);
    if (dados.mensagem.trim().length < 10)
      return mostrar("Escreva ao menos 10 caracteres na mensagem.", true);

    var texto = botao ? botao.textContent : "";
    if (botao) {
      botao.disabled = true;
      botao.textContent = "ENVIANDO...";
    }

    try {
      var resposta = await window.RS.contato(dados);
      form.reset();
      mostrar(resposta.mensagem || "Mensagem enviada! Responderemos em breve.", false);
    } catch (erro) {
      mostrar(erro.message || "Não foi possível enviar. Tente novamente.", true);
    } finally {
      if (botao) {
        botao.disabled = false;
        botao.textContent = texto;
      }
    }
  });
});
