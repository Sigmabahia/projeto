/* ==========================================================
   ROYAL SUITS - MELHORIAS GERAIS (extras.js)
   - Barra de avisos no topo
   - Banner de cookies (LGPD)
   - Botão "voltar ao topo"
   - Bloco legal + selos de pagamento no rodapé
   - Aviso flutuante (toast)
   - Imagens com carregamento preguiçoso
   - Newsletter com mensagem de confirmação
   - Nome do usuário logado no cabeçalho
========================================================== */

(function () {
    "use strict";

    /* ------------------------------------------------------
       CONFIGURAÇÕES (edite aqui os dados da loja)
    ------------------------------------------------------ */
    var CONFIG = {
        whatsapp: "5511912345678",              // somente números: 55 + DDD + número
        whatsappTexto: "Olá! Vim pelo site da Royal Suits e gostaria de atendimento.",
        email: "contato@royalsuits.com.br",
        telefone: "(11) 91234-5678",
        horario: "Seg. a sáb., das 9h às 19h",
        cnpj: "00.000.000/0001-00"
    };

    /* ------------------------------------------------------
       AVISO FLUTUANTE (TOAST)
    ------------------------------------------------------ */
    window.rsToast = function (mensagem) {
        var toast = document.querySelector(".rs-toast");

        if (!toast) {
            toast = document.createElement("div");
            toast.className = "rs-toast";
            toast.setAttribute("role", "status");
            toast.setAttribute("aria-live", "polite");
            document.body.appendChild(toast);
        }

        toast.textContent = mensagem;
        toast.classList.add("rs-visivel");

        clearTimeout(toast._timer);
        toast._timer = setTimeout(function () {
            toast.classList.remove("rs-visivel");
        }, 3200);
    };

    /* ------------------------------------------------------
       BARRA DE AVISOS NO TOPO
    ------------------------------------------------------ */
    function criarBarraTopo() {
        if (document.querySelector(".rs-topbar")) return;

        var barra = document.createElement("div");
        barra.className = "rs-topbar";
        barra.innerHTML =
            '<span>✦ <b>Frete grátis</b> acima de R$ 500</span>' +
            '<span>💳 Até <b>6x sem juros</b></span>' +
            '<span>↩ <b>Troca fácil</b> em até 7 dias</span>' +
            '<span>💬 <a href="https://wa.me/' + CONFIG.whatsapp + '?text=' +
            encodeURIComponent(CONFIG.whatsappTexto) +
            '" target="_blank" rel="noopener">Atendimento pelo WhatsApp</a></span>';

        document.body.insertBefore(barra, document.body.firstChild);
    }

    /* ------------------------------------------------------
       LINK "PULAR PARA O CONTEÚDO" (ACESSIBILIDADE)
    ------------------------------------------------------ */
    function criarSkipLink() {
        var alvo = document.querySelector("main") || document.querySelector("section");
        if (!alvo) return;

        if (!alvo.id) alvo.id = "conteudo-principal";

        var link = document.createElement("a");
        link.className = "rs-skip-link";
        link.href = "#" + alvo.id;
        link.textContent = "Pular para o conteúdo";
        document.body.insertBefore(link, document.body.firstChild);
    }

    /* ------------------------------------------------------
       BLOCO LEGAL / SELOS NO RODAPÉ
    ------------------------------------------------------ */
    function criarBlocoRodape() {
        var rodape = document.querySelector("footer");
        if (!rodape || rodape.querySelector(".rs-footer-extra")) return;

        var bloco = document.createElement("div");
        bloco.className = "rs-footer-extra";

        bloco.innerHTML =
            '<div>' +
                '<h4>Atendimento</h4>' +
                '<p>' +
                    'E-mail: <a href="mailto:' + CONFIG.email + '">' + CONFIG.email + '</a><br>' +
                    'Telefone: <a href="tel:+' + CONFIG.whatsapp + '">' + CONFIG.telefone + '</a><br>' +
                    CONFIG.horario +
                '</p>' +
            '</div>' +
            '<div>' +
                '<h4>Institucional</h4>' +
                '<ul>' +
                    '<li><a href="politica-de-privacidade.html">Política de Privacidade</a></li>' +
                    '<li><a href="termos-de-uso.html">Termos de Uso</a></li>' +
                    '<li><a href="trocas-e-devolucoes.html">Trocas e Devoluções</a></li>' +
                    '<li><a href="meus-pedidos.html">Meus pedidos</a></li>' +
                    '<li><a href="politica-de-privacidade.html#cookies">Política de Cookies</a></li>' +
                '</ul>' +
            '</div>' +
            '<div>' +
                '<h4>Formas de pagamento</h4>' +
                '<div class="rs-pagamentos">' +
                    '<span>PIX</span>' +
                    '<span>VISA</span>' +
                    '<span>MASTER</span>' +
                    '<span>ELO</span>' +
                    '<span>BOLETO</span>' +
                '</div>' +
                '<div class="rs-selo-seguro">🔒 Ambiente 100% seguro</div>' +
                '<p style="margin-top:10px;font-size:11.5px;opacity:.7">CNPJ: ' + CONFIG.cnpj + '</p>' +
            '</div>';

        var rodapeInferior = rodape.querySelector(".footer-bottom");

        if (rodapeInferior) {
            rodape.insertBefore(bloco, rodapeInferior);
        } else {
            rodape.appendChild(bloco);
        }
    }

    /* ------------------------------------------------------
       BANNER DE COOKIES (LGPD)
    ------------------------------------------------------ */
    function criarBannerCookies() {
        var CHAVE = "rs_cookies_aceitos";

        if (localStorage.getItem(CHAVE)) return;

        var banner = document.createElement("div");
        banner.className = "rs-cookies";
        banner.setAttribute("role", "dialog");
        banner.setAttribute("aria-label", "Aviso de cookies");

        banner.innerHTML =
            '<p>Utilizamos cookies para melhorar sua experiência, personalizar recomendações e ' +
            'analisar o tráfego do site. Ao continuar navegando, você concorda com a nossa ' +
            '<a href="politica-de-privacidade.html#cookies">Política de Cookies</a>.</p>' +
            '<div class="rs-cookies-acoes">' +
                '<button type="button" class="rs-recusar">Recusar</button>' +
                '<button type="button" class="rs-aceitar">Aceitar</button>' +
            '</div>';

        document.body.appendChild(banner);
        setTimeout(function () { banner.classList.add("rs-mostrar"); }, 900);

        function fechar(valor) {
            localStorage.setItem(CHAVE, valor);
            banner.classList.remove("rs-mostrar");
            setTimeout(function () { banner.remove(); }, 400);
        }

        banner.querySelector(".rs-aceitar").addEventListener("click", function () {
            fechar("aceito");
            if (window.rsToast) window.rsToast("Preferências de cookies salvas. Obrigado!");
        });

        banner.querySelector(".rs-recusar").addEventListener("click", function () {
            fechar("recusado");
        });
    }

    /* ------------------------------------------------------
       BOTÃO VOLTAR AO TOPO
    ------------------------------------------------------ */
    function criarBotaoTopo() {
        var botao = document.createElement("button");
        botao.type = "button";
        botao.className = "rs-top-btn";
        botao.setAttribute("aria-label", "Voltar ao topo");
        botao.title = "Voltar ao topo";
        botao.innerHTML = "↑";
        document.body.appendChild(botao);

        botao.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });

        function verificar() {
            if (window.scrollY > 420) {
                botao.classList.add("rs-visivel");
            } else {
                botao.classList.remove("rs-visivel");
            }
        }

        window.addEventListener("scroll", verificar, { passive: true });
        verificar();
    }

    /* ------------------------------------------------------
       IMAGENS COM CARREGAMENTO PREGUIÇOSO
    ------------------------------------------------------ */
    function ativarLazyLoad() {
        var imagens = document.querySelectorAll("img:not([loading])");
        for (var i = 0; i < imagens.length; i++) {
            imagens[i].setAttribute("loading", "lazy");
            imagens[i].setAttribute("decoding", "async");
        }
    }

    /* ------------------------------------------------------
       NEWSLETTER: MENSAGEM DE CONFIRMAÇÃO
    ------------------------------------------------------ */
    function ativarNewsletter() {
        var formularios = document.querySelectorAll(".newsletter form, form.newsletter");

        for (var i = 0; i < formularios.length; i++) {
            formularios[i].addEventListener("submit", function (evento) {
                evento.preventDefault();

                var campo = this.querySelector('input[type="email"]');
                var email = campo ? campo.value.trim() : "";

                if (!email || email.indexOf("@") === -1) {
                    if (window.rsToast) window.rsToast("Informe um e-mail válido para se inscrever.");
                    return;
                }

                if (window.rsToast) {
                    window.rsToast("Inscrição confirmada! Em breve você receberá nossas novidades.");
                }

                this.reset();
            });
        }
    }

    /* ------------------------------------------------------
       NOME DO USUÁRIO LOGADO NO CABEÇALHO
    ------------------------------------------------------ */
    function ativarUsuarioLogado() {
        var email = localStorage.getItem("usuarioLogado");
        if (!email) return;

        var botoes = document.querySelectorAll(".login-btn, a[href='login.html']");

        for (var i = 0; i < botoes.length; i++) {
            var botao = botoes[i];
            var nome = email.split("@")[0].replace(/[._-]+/g, " ");
            nome = nome.charAt(0).toUpperCase() + nome.slice(1);

            botao.textContent = "👤 " + nome;
            botao.classList.add("rs-logado");
            botao.title = "Sair da conta";
            botao.setAttribute("href", "#");
            botao.setAttribute("aria-label", "Sair da conta de " + nome);

            botao.addEventListener("click", function (evento) {
                evento.preventDefault();

                if (window.confirm("Deseja sair da sua conta?")) {
                    localStorage.removeItem("usuarioLogado");
                    window.location.href = "paginainicial.html";
                }
            });
        }
    }

    /* ------------------------------------------------------
       ANO ATUAL NO RODAPÉ
    ------------------------------------------------------ */
    function atualizarAno() {
        var ano = new Date().getFullYear();
        var textos = document.querySelectorAll(".footer-bottom p, footer small");

        for (var i = 0; i < textos.length; i++) {
            textos[i].textContent = textos[i].textContent.replace(/©\s*\d{4}/, "© " + ano);
        }
    }

    /* ------------------------------------------------------
       BUSCA DE PRODUTOS NO CABEÇALHO
    ------------------------------------------------------ */
    function criarBusca() {
        var acoes = document.querySelector(".header-actions");
        if (!acoes || document.querySelector(".rs-busca-btn")) return;

        var botao = document.createElement("button");
        botao.type = "button";
        botao.className = "rs-busca-btn icon-btn";
        botao.setAttribute("aria-label", "Buscar produtos");
        botao.title = "Buscar produtos";
        botao.innerHTML = "&#128269;";
        acoes.insertBefore(botao, acoes.firstChild);

        var overlay = document.createElement("div");
        overlay.className = "rs-busca-overlay";
        overlay.id = "rs-busca";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-label", "Buscar produtos");
        overlay.innerHTML =
            '<div class="rs-busca-box">' +
                '<div class="rs-busca-topo">' +
                    '<span class="rs-busca-icone">&#128269;</span>' +
                    '<input type="search" id="rs-busca-input" placeholder="Buscar vestidos, ternos, modelos..." autocomplete="off" aria-label="Termo de busca">' +
                    '<button type="button" class="rs-busca-fechar" aria-label="Fechar busca">&times;</button>' +
                '</div>' +
                '<div class="rs-busca-resultados" id="rs-busca-resultados">' +
                    '<p class="rs-busca-dica">Digite o nome de um modelo, cor ou categoria.</p>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        var input = overlay.querySelector("#rs-busca-input");
        var resultados = overlay.querySelector("#rs-busca-resultados");
        var indice = null;

        function abrir() {
            overlay.classList.add("rs-aberto");
            document.body.style.overflow = "hidden";
            setTimeout(function () { input.focus(); }, 60);
            carregarIndice();
        }

        function fechar() {
            overlay.classList.remove("rs-aberto");
            document.body.style.overflow = "";
        }

        function carregarIndice() {
            if (indice) return Promise.resolve(indice);

            var cache = null;
            try {
                cache = JSON.parse(sessionStorage.getItem("rsIndiceProdutos"));
            } catch (e) {}

            if (cache && cache.length) {
                indice = cache;
                return Promise.resolve(indice);
            }

            var paginas = [
                { url: "formaturas.html", nome: "Formaturas" },
                { url: "casamentos.html", nome: "Casamentos" }
            ];

            return Promise.all(paginas.map(function (pagina) {
                return fetch(pagina.url)
                    .then(function (r) { return r.text(); })
                    .then(function (html) {
                        var doc = new DOMParser().parseFromString(html, "text/html");
                        return Array.prototype.map.call(doc.querySelectorAll(".produto-card"), function (card) {
                            var nome = card.querySelector(".produto-info h3");
                            var preco = card.querySelector(".preco");
                            var img = card.querySelector(".produto-imagem img");
                            var cat = card.querySelector(".categoria-produto");

                            return {
                                nome: nome ? nome.textContent.trim() : "",
                                preco: preco ? preco.textContent.trim() : "",
                                imagem: img ? img.getAttribute("src") : "",
                                categoria: cat ? cat.textContent.trim() : pagina.nome,
                                pagina: pagina.url
                            };
                        });
                    })
                    .catch(function () { return []; });
            })).then(function (listas) {
                indice = listas.reduce(function (todos, lista) { return todos.concat(lista); }, [])
                    .filter(function (item) { return item.nome; });

                try {
                    sessionStorage.setItem("rsIndiceProdutos", JSON.stringify(indice));
                } catch (e) {}

                return indice;
            });
        }

        function normalizar(texto) {
            return String(texto || "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase();
        }

        function buscar(termo) {
            var t = normalizar(termo).trim();

            if (!t) {
                resultados.innerHTML = '<p class="rs-busca-dica">Digite o nome de um modelo, cor ou categoria.</p>';
                return;
            }

            if (!indice) {
                resultados.innerHTML = '<p class="rs-busca-dica">Carregando catálogo...</p>';
                return;
            }

            var encontrados = indice.filter(function (item) {
                return normalizar(item.nome + " " + item.categoria + " " + item.preco).indexOf(t) !== -1;
            }).slice(0, 8);

            if (!encontrados.length) {
                resultados.innerHTML =
                    '<p class="rs-busca-dica">Nenhum modelo encontrado para "<b>' +
                    termo.replace(/[<>&]/g, "") + '</b>".<br>' +
                    'Fale com a gente no <a href="https://wa.me/' + CONFIG.whatsapp + '" target="_blank" rel="noopener">WhatsApp</a> que buscamos para você.</p>';
                return;
            }

            resultados.innerHTML = encontrados.map(function (item) {
                return '' +
                    '<a class="rs-busca-item" href="' + item.pagina + '">' +
                        '<img src="' + item.imagem + '" alt="' + item.nome.replace(/"/g, "") + '" loading="lazy">' +
                        '<span class="rs-busca-item-info">' +
                            '<strong>' + item.nome + '</strong>' +
                            '<small>' + item.categoria + '</small>' +
                        '</span>' +
                        '<span class="rs-busca-item-preco">' + item.preco + '</span>' +
                    '</a>';
            }).join("") +
            '<a class="rs-busca-todos" href="formaturas.html">Ver todos os modelos &rarr;</a>';
        }

        botao.addEventListener("click", abrir);
        overlay.querySelector(".rs-busca-fechar").addEventListener("click", fechar);

        overlay.addEventListener("click", function (evento) {
            if (evento.target === overlay) fechar();
        });

        document.addEventListener("keydown", function (evento) {
            if (evento.key === "Escape" && overlay.classList.contains("rs-aberto")) fechar();
            if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === "k") {
                evento.preventDefault();
                abrir();
            }
        });

        input.addEventListener("input", function () {
            buscar(this.value);
            carregarIndice().then(function () { buscar(input.value); });
        });
    }

    /* ------------------------------------------------------
       BOTÃO FLUTUANTE DE WHATSAPP
    ------------------------------------------------------ */
    function criarWhatsappFlutuante() {
        if (document.querySelector(".rs-whatsapp")) return;

        var link = document.createElement("a");
        link.className = "rs-whatsapp";
        link.href = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(CONFIG.whatsappTexto);
        link.target = "_blank";
        link.rel = "noopener";
        link.setAttribute("aria-label", "Falar no WhatsApp");
        link.innerHTML = '<span class="rs-whatsapp-icone">&#9990;</span><span class="rs-whatsapp-texto">Fale conosco</span>';

        document.body.appendChild(link);
    }

    /* ------------------------------------------------------
       ANIMAÇÃO DE ENTRADA DOS BLOCOS
    ------------------------------------------------------ */
    function ativarRevelacao() {
        var alvos = document.querySelectorAll(
            ".produto-card, .categoria-card, .beneficio, .depoimento, .secao-titulo, .card-beneficio"
        );

        if (!alvos.length) return;

        if (!("IntersectionObserver" in window)) {
            Array.prototype.forEach.call(alvos, function (alvo) { alvo.classList.add("rs-revelado"); });
            return;
        }

        var observador = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (entrada) {
                if (entrada.isIntersecting) {
                    entrada.target.classList.add("rs-revelado");
                    observador.unobserve(entrada.target);
                }
            });
        }, { threshold: 0.12 });

        Array.prototype.forEach.call(alvos, function (alvo, i) {
            alvo.classList.add("rs-revelar");
            alvo.style.transitionDelay = (i % 4) * 60 + "ms";
            observador.observe(alvo);
        });
    }

    /* ------------------------------------------------------
       CABEÇALHO COM SOMBRA AO ROLAR
    ------------------------------------------------------ */
    function ativarHeaderScroll() {
        var header = document.querySelector(".header");
        if (!header) return;

        function atualizar() {
            header.classList.toggle("rs-header-rolado", window.scrollY > 30);
        }

        window.addEventListener("scroll", atualizar, { passive: true });
        atualizar();
    }

    /* ------------------------------------------------------
       INICIALIZAÇÃO
    ------------------------------------------------------ */
    document.addEventListener("DOMContentLoaded", function () {
        criarBarraTopo();
        criarSkipLink();
        criarBlocoRodape();
        criarBotaoTopo();
        criarBannerCookies();
        ativarLazyLoad();
        ativarNewsletter();
        ativarUsuarioLogado();
        atualizarAno();
        criarBusca();
        criarWhatsappFlutuante();
        ativarRevelacao();
        ativarHeaderScroll();
    });
})();
