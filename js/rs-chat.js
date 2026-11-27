/* ==========================================================
   ROYAL SUITS — ATENDIMENTO NO SITE
   Assistente de navegação: catálogo, tamanhos, prazos,
   pagamento, trocas e contato. Funciona sem servidor.
========================================================== */

(function () {
    "use strict";

    if (window.__rsChatAtivo) return;
    window.__rsChatAtivo = true;

    /* ------------------------------------------------------
       DADOS DA LOJA
    ------------------------------------------------------ */
    var LOJA = {
        whatsapp: "5511912345678",
        whatsappTexto: "Olá! Vim pelo site da Royal Suits e gostaria de atendimento.",
        telefone: "(11) 91234-5678",
        email: "contato@royalsuits.com.br",
        horario: "de segunda a sábado, das 9h às 19h",
        freteGratis: "R$ 500"
    };

    var LINK_WHATS = "https://wa.me/" + LOJA.whatsapp + "?text=" + encodeURIComponent(LOJA.whatsappTexto);

    /* ------------------------------------------------------
       ESTILO (paleta da loja)
    ------------------------------------------------------ */
    var CSS = [
        "#rs-chat-button{position:fixed;right:25px;bottom:25px;z-index:9998;width:62px;height:62px;border:0;border-radius:50%;background:#0b1f3b;color:#d4af37;font-size:25px;cursor:pointer;box-shadow:0 6px 22px rgba(11,31,59,.28);transition:transform .2s,background .2s;display:flex;align-items:center;justify-content:center}",
        "#rs-chat-button:hover{transform:scale(1.06);background:#0f4c81}",
        "#rs-chat-button:focus-visible{outline:3px solid #2f86c7;outline-offset:3px}",
        "#rs-chat-window{position:fixed;right:25px;bottom:100px;z-index:9999;width:min(372px,calc(100vw - 30px));height:520px;max-height:calc(100vh - 130px);background:#fff;border:1px solid #d4af37;border-radius:16px;box-shadow:0 16px 44px rgba(11,31,59,.22);display:none;overflow:hidden;font-family:Montserrat,Arial,sans-serif}",
        "#rs-chat-window.rs-open{display:flex;flex-direction:column}",
        ".rs-chat-head{background:#0b1f3b;color:#fff;padding:15px 18px;display:flex;align-items:center;justify-content:space-between;gap:10px}",
        ".rs-chat-brand{font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;letter-spacing:1px;line-height:1.1}",
        ".rs-chat-brand span{color:#d4af37}",
        ".rs-chat-status{font-size:11px;color:#d4af37;margin-top:4px;display:flex;align-items:center;gap:6px}",
        ".rs-chat-status i{width:7px;height:7px;border-radius:50%;background:#d4af37;display:inline-block}",
        "#rs-chat-close{background:none;border:0;color:#fff;font-size:24px;line-height:1;cursor:pointer;padding:2px 4px}",
        "#rs-chat-close:hover{color:#d4af37}",
        "#rs-chat-messages{padding:16px;flex:1;overflow-y:auto;background:#f3efe6;display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth}",
        ".rs-chat-msg{max-width:86%;padding:11px 13px;border-radius:13px;font-size:13px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere}",
        ".rs-chat-msg.bot{align-self:flex-start;background:#fff;color:#0b1f3b;border:1px solid #f3efe6;border-bottom-left-radius:3px}",
        ".rs-chat-msg.user{align-self:flex-end;background:#0b1f3b;color:#fff;border-bottom-right-radius:3px}",
        ".rs-chat-msg a{color:#0f4c81;text-decoration:underline;font-weight:600}",
        ".rs-chat-msg strong{color:#0b1f3b}",
        ".rs-chat-msg .rs-chat-links{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}",
        ".rs-chat-msg .rs-chat-links a{display:inline-block;background:#0b1f3b;color:#fff;text-decoration:none;font-size:12px;font-weight:600;padding:7px 12px;border-radius:20px}",
        ".rs-chat-msg .rs-chat-links a:hover{background:#0f4c81}",
        ".rs-chat-msg .rs-chat-links a.rs-chat-wa{background:#d4af37;color:#0b1f3b}",
        ".rs-chat-typing{display:flex;gap:4px;align-items:center;padding:13px}",
        ".rs-chat-typing span{width:6px;height:6px;border-radius:50%;background:#0f4c81;opacity:.5;animation:rsChatPulse 1.1s infinite}",
        ".rs-chat-typing span:nth-child(2){animation-delay:.18s}",
        ".rs-chat-typing span:nth-child(3){animation-delay:.36s}",
        "@keyframes rsChatPulse{0%,60%,100%{opacity:.35;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}",
        "#rs-chat-chips{display:flex;gap:6px;padding:0 12px 10px;background:#f3efe6;flex-wrap:wrap}",
        "#rs-chat-chips button{border:1px solid #0f4c81;background:#fff;color:#0f4c81;font:600 11.5px Montserrat,Arial,sans-serif;padding:7px 11px;border-radius:16px;cursor:pointer;transition:.15s}",
        "#rs-chat-chips button:hover{background:#0f4c81;color:#fff}",
        ".rs-chat-form{display:flex;gap:8px;padding:11px 12px;border-top:1px solid #f3efe6;background:#fff}",
        "#rs-chat-input{min-width:0;flex:1;border:1px solid #f3efe6;border-radius:22px;padding:11px 14px;font:13px Montserrat,Arial,sans-serif;outline:none;color:#0b1f3b}",
        "#rs-chat-input:focus{border-color:#d4af37}",
        "#rs-chat-send{border:0;border-radius:22px;background:#0b1f3b;color:#d4af37;padding:0 16px;font-weight:600;font-size:13px;cursor:pointer}",
        "#rs-chat-send:hover{background:#0f4c81}",
        "#rs-chat-send:disabled{opacity:.5;cursor:wait}",
        "@media(max-width:480px){#rs-chat-button{right:16px;bottom:16px;width:56px;height:56px}#rs-chat-window{right:10px;bottom:84px;width:calc(100vw - 20px);height:min(520px,calc(100vh - 108px))}}",
        "@media(prefers-reduced-motion:reduce){#rs-chat-messages{scroll-behavior:auto}.rs-chat-typing span{animation:none}}"
    ].join("\n");

    var estilo = document.createElement("style");
    estilo.id = "rs-chat-estilo";
    estilo.textContent = CSS;
    document.head.appendChild(estilo);

    /* ------------------------------------------------------
       ESTRUTURA
    ------------------------------------------------------ */
    var botao = document.createElement("button");
    botao.id = "rs-chat-button";
    botao.type = "button";
    botao.setAttribute("aria-label", "Abrir atendimento Royal Suits");
    botao.title = "Atendimento Royal Suits";
    botao.innerHTML = "&#10022;";

    var janela = document.createElement("section");
    janela.id = "rs-chat-window";
    janela.setAttribute("aria-label", "Atendimento Royal Suits");
    janela.innerHTML =
        '<header class="rs-chat-head">' +
            '<div>' +
                '<div class="rs-chat-brand">ROYAL <span>SUITS</span></div>' +
                '<div class="rs-chat-status"><i></i> Atendimento online</div>' +
            '</div>' +
            '<button id="rs-chat-close" type="button" aria-label="Fechar atendimento">&times;</button>' +
        '</header>' +
        '<div id="rs-chat-messages" aria-live="polite"></div>' +
        '<div id="rs-chat-chips"></div>' +
        '<form class="rs-chat-form" id="rs-chat-form">' +
            '<input id="rs-chat-input" type="text" placeholder="Escreva sua mensagem..." autocomplete="off" aria-label="Sua mensagem" maxlength="240" required>' +
            '<button id="rs-chat-send" type="submit">Enviar</button>' +
        '</form>';

    document.body.appendChild(botao);
    document.body.appendChild(janela);

    var mensagens = janela.querySelector("#rs-chat-messages");
    var chips = janela.querySelector("#rs-chat-chips");
    var form = janela.querySelector("#rs-chat-form");
    var input = janela.querySelector("#rs-chat-input");
    var enviar = janela.querySelector("#rs-chat-send");
    var fechar = janela.querySelector("#rs-chat-close");

    /* ------------------------------------------------------
       MENSAGENS
    ------------------------------------------------------ */
    function rolar() {
        mensagens.scrollTop = mensagens.scrollHeight;
    }

    function addMensagem(html, tipo) {
        var item = document.createElement("div");
        item.className = "rs-chat-msg " + (tipo || "bot");
        item.innerHTML = html;
        mensagens.appendChild(item);
        rolar();
        return item;
    }

    function addDigitando() {
        var item = document.createElement("div");
        item.className = "rs-chat-msg bot rs-chat-typing";
        item.innerHTML = "<span></span><span></span><span></span>";
        mensagens.appendChild(item);
        rolar();
        return item;
    }

    function botoes(lista) {
        return '<div class="rs-chat-links">' + lista.map(function (b) {
            var classe = b.whats ? ' class="rs-chat-wa"' : "";
            var extra = b.whats ? ' target="_blank" rel="noopener"' : "";
            return '<a href="' + b.href + '"' + classe + extra + ">" + b.texto + "</a>";
        }).join("") + "</div>";
    }

    function linkWhats(texto) {
        return '<a href="' + LINK_WHATS + '" target="_blank" rel="noopener">' + (texto || "WhatsApp") + "</a>";
    }

    /* ------------------------------------------------------
       CATÁLOGO (lido das páginas do próprio site)
    ------------------------------------------------------ */
    var indice = null;
    var carregando = null;

    function normalizar(texto) {
        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function carregarCatalogo() {
        if (indice) return Promise.resolve(indice);
        if (carregando) return carregando;

        var cache = null;
        try {
            cache = JSON.parse(sessionStorage.getItem("rsChatCatalogo"));
        } catch (e) {}

        if (cache && cache.length) {
            indice = cache;
            return Promise.resolve(indice);
        }

        var paginas = [
            { url: "ternos.html", nome: "Ternos" },
            { url: "vestidos.html", nome: "Vestidos" }
        ];

        carregando = Promise.all(paginas.map(function (pagina) {
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
                            preco: preco ? preco.textContent.trim() : "Sob consulta",
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
                sessionStorage.setItem("rsChatCatalogo", JSON.stringify(indice));
            } catch (e) {}
            carregando = null;
            return indice;
        });

        return carregando;
    }

    var PALAVRAS_GENERICAS = [
        "vestido", "vestidos", "terno", "ternos", "modelo", "modelos", "peca", "pecas",
        "quanto", "custa", "custo", "preco", "valor", "tem", "ter", "quero", "ver",
        "gostaria", "saber", "sobre", "para", "qual", "que", "uma", "dos", "das", "por"
    ];

    function buscarProdutos(termo) {
        var t = normalizar(termo);
        if (!t || !indice) return [];

        var palavras = t.split(" ").filter(function (p) {
            return p.length > 2 && PALAVRAS_GENERICAS.indexOf(p) === -1;
        });
        if (!palavras.length) return [];

        // Se a pessoa citou o tipo de peça, restringe a busca a essa categoria.
        var tipo = null;
        if (/\bvestidos?\b/.test(t)) tipo = "vestido";
        else if (/\bternos?\b/.test(t)) tipo = "terno";

        var base = tipo ? indice.filter(function (item) {
            return normalizar(item.categoria).indexOf(tipo) !== -1;
        }) : indice;
        if (!base.length) base = indice;

        var pontuados = base.map(function (item) {
            var nome = normalizar(item.nome);
            var alvo = nome + " " + normalizar(item.categoria);
            var pontos = 0;

            if (t && nome.indexOf(t) !== -1) pontos += 6;

            palavras.forEach(function (p) {
                if (nome.indexOf(p) !== -1) pontos += 3;
                else if (alvo.indexOf(p) !== -1) pontos += 1;
            });

            return { item: item, pontos: pontos };
        }).filter(function (r) { return r.pontos > 0; });

        if (!pontuados.length) return [];

        var maior = Math.max.apply(null, pontuados.map(function (r) { return r.pontos; }));

        return pontuados
            .filter(function (r) { return r.pontos === maior; })
            .map(function (r) { return r.item; })
            .slice(0, 4);
    }

    function formatarProdutos(lista) {
        return lista.map(function (p) {
            return "• <strong>" + p.nome + "</strong> — " + p.preco;
        }).join("\n") + botoes(lista.map(function (p) {
            return { href: p.pagina, texto: p.nome };
        }));
    }

    /* ------------------------------------------------------
       RESPOSTAS
    ------------------------------------------------------ */
    var RESPOSTAS = [
        {
            teste: /^(oi|ola|opa|eai|e ai|bom dia|boa tarde|boa noite|alo|hey|tudo bem|tudo bom)\b/,
            resposta: function () {
                return "Olá! Seja bem-vindo(a) à Royal Suits.\n" +
                    "Posso mostrar a coleção de ternos e vestidos, falar sobre tamanhos, prazos, pagamento e trocas. " +
                    "O que você procura hoje?";
            }
        },
        {
            teste: /(aluguel|alugar|locacao|locar)/,
            resposta: function () {
                return "Trabalhamos com venda de trajes e também atendemos pedidos de locação para formaturas e casamentos. " +
                    "Como cada evento tem uma necessidade, o ideal é conversar com a equipe pelo " + linkWhats() +
                    " para confirmar disponibilidade de modelo, data e valor.";
            }
        },
        {
            teste: /(terno|ternos|smoking|traje|paleto|blazer|masculin)/,
            resposta: function () {
                return "A coleção de ternos reúne 15 modelos em azul, marinho e preto, com cortes slim, clássico e premium. " +
                    "Cada peça tem página com fotos, tamanhos e cores disponíveis.\n" +
                    "Os valores são sob consulta porque variam conforme tecido e ajustes." +
                    botoes([
                        { href: "ternos.html", texto: "Ver todos os ternos" },
                        { href: LINK_WHATS, texto: "Consultar um modelo", whats: true }
                    ]);
            }
        },
        {
            teste: /(vestido|vestidos|feminin|dama|madrinha|debutante|noiva)/,
            resposta: function () {
                return "A coleção de vestidos tem três modelos:\n" +
                    "• <strong>Vestido Carmélia</strong> — R$ 899,00\n" +
                    "• <strong>Vestido Elegance</strong> — R$ 750,00\n" +
                    "• <strong>Vestido Clássico</strong> — sob consulta\n" +
                    "Todos com caimento ajustado, tecidos nobres e acabamento de ateliê." +
                    botoes([
                        { href: "vestidos.html", texto: "Ver todos os vestidos" },
                        { href: LINK_WHATS, texto: "Tirar dúvidas", whats: true }
                    ]);
            }
        },
        {
            teste: /(formatura|colacao|colação|baile|formando|debut)/,
            resposta: function () {
                return "Para formaturas temos ternos e vestidos pensados para o baile e para a colação de grau. " +
                    "Você pode filtrar a coleção por <strong>Formatura</strong> e escolher o modelo que combina com a sua turma." +
                    botoes([
                        { href: "ternos.html", texto: "Ternos de formatura" },
                        { href: "vestidos.html", texto: "Vestidos de formatura" }
                    ]);
            }
        },
        {
            teste: /(casamento|noivo|padrinho|madrinha|bodas|cerimonia|cerimônia)/,
            resposta: function () {
                return "Para casamentos separamos peças em tons sóbrios e cortes elegantes, tanto para noivos quanto para padrinhos e madrinhas. " +
                    "Na coleção você encontra a aba <strong>Casamento</strong> em cada categoria." +
                    botoes([
                        { href: "ternos.html", texto: "Ternos para casamento" },
                        { href: "vestidos.html", texto: "Vestidos para casamento" }
                    ]);
            }
        },
        {
            teste: /(preco|preço|valor|quanto custa|quanto sai|quanto e|quanto é|barato|caro)/,
            resposta: function () {
                return "Os vestidos da coleção estão entre <strong>R$ 750,00</strong> e <strong>R$ 899,00</strong>. " +
                    "Os ternos são sob consulta, porque o valor muda conforme tecido, corte e ajustes.\n" +
                    "Se você me disser o nome do modelo, eu localizo a peça e o valor.";
            }
        },
        {
            teste: /(tamanho|tamanhos|medida|medidas|numeracao|numeração|veste|caimento|slim|regular|pp|gg|xg)/,
            resposta: function () {
                return "Os tamanhos disponíveis vão de <strong>PP a XGG</strong> (PP, P, M, G, GG, XG e XGG), conforme o modelo. " +
                    "O caimento pode ser slim ou regular.\n" +
                    "Se estiver entre dois tamanhos, recomendamos o maior para permitir ajuste. " +
                    "A equipe também orienta as medidas pelo " + linkWhats() + ".";
            }
        },
        {
            teste: /(ajuste|ajustes|prova|experimentar|sob medida|alfaiat|barra|manga)/,
            resposta: function () {
                return "Fazemos ajustes de barra, manga e cintura para o caimento ficar sob medida. " +
                    "O valor e o prazo do ajuste dependem da peça — a equipe confirma tudo antes de iniciar. " +
                    "Fale com a gente pelo " + linkWhats() + " e envie suas medidas.";
            }
        },
        {
            teste: /(frete|entrega|prazo|correio|sedex|chega|envio|enviar|rastreio)/,
            resposta: function () {
                return "O frete é <strong>grátis</strong> em compras acima de " + LOJA.freteGratis + ". " +
                    "O prazo é calculado no carrinho de acordo com o seu CEP. " +
                    "Depois da confirmação do pagamento, o pedido é separado em até 2 dias úteis e enviado com código de rastreio." +
                    botoes([{ href: "carrinho.html", texto: "Calcular frete" }]);
            }
        },
        {
            teste: /(pagamento|pagar|parcela|parcelamento|cartao|cartão|pix|boleto|desconto)/,
            resposta: function () {
                return "Aceitamos <strong>Pix</strong>, cartão de crédito em até <strong>6x sem juros</strong> e boleto. " +
                    "O pagamento é confirmado na hora no Pix e no cartão. " +
                    "Quer finalizar uma compra?" +
                    botoes([{ href: "carrinho.html", texto: "Ir para o carrinho" }]);
            }
        },
        {
            teste: /(troca|trocar|devolucao|devolução|devolver|estorno|defeito)/,
            resposta: function () {
                return "Você pode solicitar troca ou devolução em até <strong>7 dias</strong> após o recebimento, " +
                    "desde que a peça esteja sem uso e com a etiqueta. " +
                    "Basta enviar o número do pedido para a equipe pelo " + linkWhats() + " que cuidamos do processo." +
                    botoes([{ href: "trocas-e-devolucoes.html", texto: "Política de trocas" }]);
            }
        },
        {
            teste: /(onde|endereco|endereço|loja fisica|loja física|horario|horário|funciona|abre|fecha|atendimento)/,
            resposta: function () {
                return "O atendimento da Royal Suits funciona " + LOJA.horario + ".\n" +
                    "WhatsApp: <strong>" + LOJA.telefone + "</strong>\n" +
                    "E-mail: <strong>" + LOJA.email + "</strong>" +
                    botoes([
                        { href: LINK_WHATS, texto: "Chamar no WhatsApp", whats: true },
                        { href: "contato.html", texto: "Página de contato" }
                    ]);
            }
        },
        {
            teste: /(whatsapp|atendente|humano|vendedor|falar com|telefone|contato|suporte|pessoa)/,
            resposta: function () {
                return "Claro! A equipe atende " + LOJA.horario + " e responde em poucos minutos." +
                    botoes([
                        { href: LINK_WHATS, texto: "Falar no WhatsApp", whats: true },
                        { href: "contato.html", texto: "Outros canais" }
                    ]);
            }
        },
        {
            teste: /(carrinho|comprar|compra|pedido|finalizar|checkout|pagar agora)/,
            resposta: function () {
                return "Para comprar, escolha o modelo na coleção, selecione tamanho e cor e clique em adicionar ao carrinho. " +
                    "Depois é só conferir o pedido e finalizar o pagamento." +
                    botoes([
                        { href: "carrinho.html", texto: "Meu carrinho" },
                        { href: "ternos.html", texto: "Ver coleção" }
                    ]);
            }
        },
        {
            teste: /(login|entrar|minha conta|conta|cadastro|cadastrar|senha|pedidos)/,
            resposta: function () {
                return "Você pode entrar na sua conta para acompanhar pedidos e salvar favoritos. " +
                    "Se esqueceu a senha, a recuperação é feita pelo e-mail cadastrado." +
                    botoes([
                        { href: "login.html", texto: "Entrar" },
                        { href: "criarconta.html", texto: "Criar conta" }
                    ]);
            }
        },
        {
            teste: /(favorito|favoritos|salvar|lista de desejos|wishlist)/,
            resposta: function () {
                return "Toque no coração do produto para salvar na sua lista de favoritos. " +
                    "Ela fica guardada no navegador e você pode consultar quando quiser." +
                    botoes([{ href: "favoritos.html", texto: "Ver favoritos" }]);
            }
        },
        {
            teste: /(cor|cores|azul|marinho|preto|branco|marsala|vinho|dourado|bege)/,
            resposta: function () {
                return "Os ternos estão disponíveis em <strong>azul, marinho e preto</strong>. " +
                    "Os vestidos aparecem em <strong>marsala, preto e vinho</strong>. " +
                    "Cada modelo mostra as cores na própria página, com amostra de tom.";
            }
        },
        {
            teste: /(tecido|lavar|cuidado|cuidados|passar|conserva|limpeza|composicao|composição)/,
            resposta: function () {
                return "As peças são feitas em tecidos nobres, como lã fria nos ternos e cetim com pedrarias nos vestidos. " +
                    "A recomendação é lavagem a seco e passar em temperatura baixa. " +
                    "A composição exata de cada modelo está na página do produto.";
            }
        },
        {
            teste: /(obrigad|valeu|brigad|agradec)/,
            resposta: function () {
                return "Foi um prazer ajudar! Se precisar de mais alguma coisa, estou por aqui. " +
                    "Boa escolha e até logo.";
            }
        },
        {
            teste: /(tchau|ate mais|até mais|adeus|falou|ate logo|até logo)/,
            resposta: function () {
                return "Até logo! Obrigado por visitar a Royal Suits. " +
                    "Quando quiser, é só abrir o chat novamente.";
            }
        }
    ];

    var SUGESTOES = [
        "Ver ternos",
        "Ver vestidos",
        "Tamanhos",
        "Frete e prazos",
        "Falar no WhatsApp"
    ];

    function mostrarSugestoes() {
        chips.innerHTML = "";
        SUGESTOES.forEach(function (texto) {
            var b = document.createElement("button");
            b.type = "button";
            b.textContent = texto;
            b.addEventListener("click", function () {
                enviarTexto(texto);
            });
            chips.appendChild(b);
        });
    }

    /* ------------------------------------------------------
       MOTOR DE RESPOSTA
    ------------------------------------------------------ */
    function responder(texto) {
        var t = normalizar(texto);

        // Busca por modelo específico
        var encontrados = buscarProdutos(texto);
        if (encontrados.length) {
            var perguntaPreco = /(preco|preço|valor|quanto)/.test(t);
            if (perguntaPreco && encontrados.length === 1) {
                return "O <strong>" + encontrados[0].nome + "</strong> está por <strong>" + encontrados[0].preco + "</strong>." +
                    botoes([{ href: encontrados[0].pagina, texto: "Ver o modelo" }]);
            }
            return "Encontrei " + (encontrados.length === 1 ? "este modelo" : "estes modelos") + " na coleção:\n" +
                formatarProdutos(encontrados);
        }

        for (var i = 0; i < RESPOSTAS.length; i++) {
            if (RESPOSTAS[i].teste.test(t)) {
                return RESPOSTAS[i].resposta();
            }
        }

        return "Não localizei essa informação por aqui. Posso ajudar com:\n" +
            "• coleção de ternos e vestidos\n" +
            "• tamanhos e ajustes\n" +
            "• frete, prazos e pagamento\n" +
            "• trocas e devoluções\n\n" +
            "Se preferir, fale direto com a equipe pelo " + linkWhats() + ".";
    }

    /* ------------------------------------------------------
       ENVIO
    ------------------------------------------------------ */
    var ocupado = false;

    function enviarTexto(texto) {
        var mensagem = String(texto || "").trim();
        if (!mensagem || ocupado) return;

        ocupado = true;
        addMensagem(mensagem.replace(/[<>&]/g, function (c) {
            return { "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c];
        }), "user");
        input.value = "";
        input.disabled = true;
        enviar.disabled = true;

        var digitando = addDigitando();
        var espera = 480 + Math.min(mensagem.length * 12, 620);

        carregarCatalogo().then(function () {
            setTimeout(function () {
                var html = responder(mensagem);
                digitando.remove();
                addMensagem(html, "bot");
                input.disabled = false;
                enviar.disabled = false;
                input.focus();
                ocupado = false;
            }, espera);
        });
    }

    form.addEventListener("submit", function (evento) {
        evento.preventDefault();
        enviarTexto(input.value);
    });

    botao.addEventListener("click", function () {
        var aberto = janela.classList.toggle("rs-open");
        botao.setAttribute("aria-expanded", aberto ? "true" : "false");
        if (aberto) {
            if (!mensagens.children.length) {
                addMensagem(
                    "Olá! Seja bem-vindo(a) à Royal Suits.\n" +
                    "Sou o atendimento do site e posso mostrar a coleção, informar tamanhos, prazos, pagamento e trocas. " +
                    "O que você procura?", "bot"
                );
            }
            mostrarSugestoes();
            setTimeout(function () { input.focus(); }, 120);
        }
    });

    fechar.addEventListener("click", function () {
        janela.classList.remove("rs-open");
        botao.setAttribute("aria-expanded", "false");
        botao.focus();
    });

    document.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape" && janela.classList.contains("rs-open")) {
            janela.classList.remove("rs-open");
            botao.setAttribute("aria-expanded", "false");
            botao.focus();
        }
    });

    // Pré-carrega o catálogo para responder mais rápido
    if ("requestIdleCallback" in window) {
        requestIdleCallback(function () { carregarCatalogo(); });
    } else {
        setTimeout(carregarCatalogo, 1500);
    }
})();
