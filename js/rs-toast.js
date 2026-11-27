/* ==========================================================
   ROYAL SUITS — NOTIFICAÇÕES (rs-toast.js)
   Substitui os alert() por uma notificação simples no topo.
========================================================== */

(function (window, document) {
    "use strict";

    var ESTILO_ID = "rs-toast-estilo";

    function injetarEstilo() {
        if (document.getElementById(ESTILO_ID)) return;

        var css = ''
            + '#rs-toast-container{position:fixed;top:18px;left:50%;transform:translateX(-50%);'
            + 'z-index:99999;display:flex;flex-direction:column;align-items:center;gap:10px;'
            + 'pointer-events:none;width:calc(100% - 32px);max-width:520px;}'
            + '.rs-toast{pointer-events:auto;display:flex;align-items:center;gap:12px;'
            + 'background:#0b1f3b;color:#fff;border:1px solid rgba(212,175,55,.55);'
            + 'border-left:4px solid #d4af37;border-radius:10px;padding:14px 20px;'
            + 'font-family:"Montserrat",Arial,sans-serif;font-size:13.5px;line-height:1.45;'
            + 'letter-spacing:.3px;box-shadow:0 12px 32px rgba(11,31,59,.28);'
            + 'opacity:0;transform:translateY(-16px);transition:opacity .28s ease,transform .28s ease;'
            + 'max-width:100%;}'
            + '.rs-toast.rs-toast-visivel{opacity:1;transform:translateY(0);}'
            + '.rs-toast .rs-toast-icone{flex:0 0 auto;color:#d4af37;font-size:16px;line-height:1;}'
            + '.rs-toast.rs-toast-erro{background:#0f4c81;border-left-color:#d4af37;}'
            + '.rs-toast.rs-toast-erro .rs-toast-icone{color:#d4af37;}'
            + '@media(max-width:600px){#rs-toast-container{top:10px;}'
            + '.rs-toast{font-size:12.5px;padding:12px 16px;}}';

        var style = document.createElement("style");
        style.id = ESTILO_ID;
        style.appendChild(document.createTextNode(css));
        (document.head || document.documentElement).appendChild(style);
    }

    function container() {
        var el = document.getElementById("rs-toast-container");
        if (!el) {
            el = document.createElement("div");
            el.id = "rs-toast-container";
            el.setAttribute("role", "status");
            el.setAttribute("aria-live", "polite");
            (document.body || document.documentElement).appendChild(el);
        }
        return el;
    }

    function rsToast(mensagem, tipo) {
        if (typeof mensagem !== "string") mensagem = String(mensagem);
        injetarEstilo();

        var toast = document.createElement("div");
        toast.className = "rs-toast" + (tipo === "erro" ? " rs-toast-erro" : "");

        var icone = document.createElement("span");
        icone.className = "rs-toast-icone";
        icone.textContent = tipo === "erro" ? "!" : "✓";

        var texto = document.createElement("span");
        texto.textContent = mensagem;

        toast.appendChild(icone);
        toast.appendChild(texto);
        container().appendChild(toast);

        requestAnimationFrame(function () {
            toast.classList.add("rs-toast-visivel");
        });

        setTimeout(function () {
            toast.classList.remove("rs-toast-visivel");
            setTimeout(function () {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 320);
        }, 3200);

        return toast;
    }

    window.rsToast = rsToast;

    /* Substitui o alert() nativo por notificação no topo */
    window.alert = function (mensagem) {
        rsToast(mensagem);
    };

})(window, document);
