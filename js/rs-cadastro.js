/* ==========================================================
   ROYAL SUITS — CADASTRO (integração com a API)
   ========================================================== */

document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("form-cadastro");
  if (!form) return;

  var botao = form.querySelector('button[type="submit"]');

  function aviso(mensagem) {
    if (window.rsToast) return window.rsToast(mensagem);
    alert(mensagem);
  }

  form.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    var nome = (document.getElementById("nome") || {}).value || "";
    var email = (document.getElementById("email") || {}).value || "";
    var telefone = (document.getElementById("telefone") || {}).value || "";
    var senha = (document.getElementById("senha") || {}).value || "";
    var confirmar = (document.getElementById("confirmar-senha") || {}).value || "";
    var termos = document.getElementById("termos");

    nome = nome.trim();
    email = email.trim();

    if (nome.length < 3) return aviso("Informe seu nome completo.");
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return aviso("Informe um e-mail válido.");
    if (senha.length < 6) return aviso("A senha precisa ter pelo menos 6 caracteres.");
    if (confirmar && senha !== confirmar) return aviso("As senhas não conferem.");
    if (termos && !termos.checked) return aviso("Aceite os termos para criar sua conta.");

    var textoOriginal = botao ? botao.textContent : "";
    if (botao) {
      botao.disabled = true;
      botao.textContent = "CRIANDO CONTA...";
    }

    try {
      await window.RS.register({
        nome: nome,
        email: email,
        telefone: telefone,
        senha: senha,
        confirmarSenha: confirmar,
      });
      aviso("Conta criada com sucesso! Bem-vindo(a) à Royal Suits.");
      setTimeout(function () {
        window.location.href = "paginainicial.html";
      }, 900);
    } catch (erro) {
      var detalhes = erro.detalhes || {};
      var primeira = Object.keys(detalhes)[0];
      aviso(primeira ? detalhes[primeira] : erro.message);
      if (botao) {
        botao.disabled = false;
        botao.textContent = textoOriginal;
      }
    }
  });
});
