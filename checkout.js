/* ==========================================================
   ROYAL SUITS — CHECKOUT (checkout.js)
========================================================== */

(function () {
    "use strict";

    var L = window.Loja;

    if (!L) {
        console.error("loja.js não carregado.");
        return;
    }

    /* ======================================================
       ESTADO
    ====================================================== */

    var estado = {
        etapa: 1,
        dados: {},
        endereco: {},
        freteOpcoes: [],
        frete: null,
        pagamento: "pix",
        desconto: 0,
        pixCodigo: "",
        finalizando: false
    };

    var TOTAL = 0;

    /* ======================================================
       ATALHOS
    ====================================================== */

    function el(id) { return document.getElementById(id); }

    function mostrarToast(msg) {
        if (window.rsToast) window.rsToast(msg);
        else console.log(msg);
    }

    function marcarErro(input, temErro) {
        var campo = input.closest(".ck-campo");
        if (campo) campo.classList.toggle("erro", !!temErro);
    }

    function limparErro(input) {
        marcarErro(input, false);
    }

    /* ======================================================
       RESUMO DO PEDIDO
    ====================================================== */

    function calcularTotais() {
        var subtotal = L.subtotalCarrinho();
        var frete = estado.frete ? Number(estado.frete.preco) : 0;

        estado.desconto = estado.pagamento === "pix"
            ? subtotal * (L.CONFIG.pagamento.descontoPix / 100)
            : 0;

        TOTAL = Math.max(0, subtotal + frete - estado.desconto);

        return { subtotal: subtotal, frete: frete, desconto: estado.desconto, total: TOTAL };
    }

    function renderizarResumo() {
        var carrinho = L.obterCarrinho();
        var lista = el("resumo-itens");
        var totais = calcularTotais();

        if (!lista) return;

        if (!carrinho.length) {
            lista.innerHTML = '<p class="ck-dica">Seu carrinho está vazio. <a href="paginainicial.html" style="color:#0f4c81;">Ver modelos</a>.</p>';
        } else {
            lista.innerHTML = carrinho.map(function (item) {
                var qtd = Number(item.quantidade) || 1;
                var preco = Number(item.preco) || 0;
                return '' +
                    '<div class="ck-item">' +
                        '<div class="ck-item-img"><img src="' + L.escaparHtml(item.imagem || "imagens/ternos/terno-azul-01.webp") + '" alt="' + L.escaparHtml(item.nome) + '"></div>' +
                        '<div class="ck-item-info">' +
                            '<strong>' + L.escaparHtml(item.nome) + '</strong>' +
                            '<small>Qtd. ' + qtd + '</small>' +
                        '</div>' +
                        '<div class="ck-item-preco">' + (preco > 0 ? L.formatarPreco(preco * qtd) : "Sob consulta") + '</div>' +
                    '</div>';
            }).join("");
        }

        el("resumo-qtd").textContent = L.totalItens() + (L.totalItens() === 1 ? " item" : " itens");
        el("resumo-subtotal").textContent = L.formatarPreco(totais.subtotal);

        if (estado.frete) {
            el("resumo-frete").textContent = totais.frete > 0 ? L.formatarPreco(totais.frete) : "Grátis";
        } else {
            el("resumo-frete").textContent = "A calcular";
        }

        var linhaDesconto = el("linha-desconto");
        if (estado.desconto > 0) {
            linhaDesconto.style.display = "flex";
            el("resumo-desconto").textContent = "− " + L.formatarPreco(estado.desconto);
        } else {
            linhaDesconto.style.display = "none";
        }

        el("resumo-total").textContent = L.formatarPreco(totais.total);

        var parcelas = L.calcularParcelas(totais.total);
        var parcela3 = parcelas[2];
        el("resumo-parcelas").textContent = totais.total > 0
            ? "ou 3x de " + L.formatarPreco(parcela3.valor) + " sem juros"
            : "";

        atualizarParcelasSelect(totais.total);

        if (L.temItemSobConsulta()) {
            el("ck-aviso-pagamento").innerHTML =
                '<div class="ck-aviso">Um ou mais itens estão <b>sob consulta</b>. ' +
                'Nossa equipe confirmará o valor antes de processar o pagamento.</div>';
        }
    }

    function atualizarParcelasSelect(total) {
        var select = el("cartao-parcelas");
        if (!select) return;

        var parcelas = L.calcularParcelas(total);
        select.innerHTML = parcelas.map(function (p) {
            return '<option value="' + p.numero + '">' +
                p.numero + "x de " + L.formatarPreco(p.valor) +
                (p.semJuros ? " sem juros" : " (total " + L.formatarPreco(p.total) + ")") +
                "</option>";
        }).join("");
    }

    /* ======================================================
       NAVEGAÇÃO ENTRE ETAPAS
    ====================================================== */

    function irParaEtapa(numero) {
        estado.etapa = numero;

        L.$$(".ck-painel").forEach(function (painel) {
            painel.classList.toggle("ativo", painel.id === "painel-" + numero);
        });

        L.$$(".ck-etapa").forEach(function (etapa) {
            var n = Number(etapa.dataset.etapa);
            etapa.classList.toggle("ativa", n === numero);
            etapa.classList.toggle("concluida", n < numero);
        });

        if (numero === 3) {
            renderizarResumo();
            gerarPix();
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    /* ======================================================
       ETAPA 1 — DADOS
    ====================================================== */

    function validarDados() {
        var nome = el("nome");
        var email = el("email");
        var telefone = el("telefone");
        var documento = el("documento");
        var ok = true;

        if (nome.value.trim().split(" ").filter(Boolean).length < 2) {
            marcarErro(nome, true); ok = false;
        } else marcarErro(nome, false);

        if (!L.validarEmail(email.value)) {
            marcarErro(email, true); ok = false;
        } else marcarErro(email, false);

        if (!L.validarTelefone(telefone.value)) {
            marcarErro(telefone, true); ok = false;
        } else marcarErro(telefone, false);

        if (!L.validarCPFOuCNPJ(documento.value)) {
            marcarErro(documento, true); ok = false;
        } else marcarErro(documento, false);

        return ok;
    }

    function salvarDados() {
        estado.dados = {
            nome: el("nome").value.trim(),
            email: el("email").value.trim(),
            telefone: el("telefone").value.trim(),
            documento: el("documento").value.trim(),
            nascimento: el("nascimento").value
        };

        try {
            localStorage.setItem("dadosCliente", JSON.stringify(estado.dados));
        } catch (e) {}
    }

    function restaurarDados() {
        var salvo = null;
        try {
            salvo = JSON.parse(localStorage.getItem("dadosCliente"));
        } catch (e) {}

        if (salvo) {
            el("nome").value = salvo.nome || "";
            el("email").value = salvo.email || "";
            el("telefone").value = salvo.telefone || "";
            el("documento").value = salvo.documento || "";
            el("nascimento").value = salvo.nascimento || "";
            return;
        }

        var emailLogado = localStorage.getItem("usuarioLogado");
        if (emailLogado) el("email").value = emailLogado;
    }

    /* ======================================================
       ETAPA 2 — ENDEREÇO E FRETE
    ====================================================== */

    function buscarEndereco() {
        var cepInput = el("cep");
        var botao = el("btn-buscar-cep");
        var cep = cepInput.value;

        if (!L.validarCEP(cep)) {
            marcarErro(cepInput, true);
            return;
        }

        marcarErro(cepInput, false);
        botao.disabled = true;
        botao.textContent = "…";

        L.buscarCEP(cep)
            .then(function (endereco) {
                el("rua").value = endereco.rua;
                el("bairro").value = endereco.bairro;
                el("cidade").value = endereco.cidade;
                el("uf").value = endereco.uf;

                estado.endereco = endereco;
                atualizarOpcoesFrete(endereco.cep);

                if (endereco.rua) el("numero").focus();
                mostrarToast("Endereço encontrado: " + endereco.cidade + "/" + endereco.uf);
            })
            .catch(function (erro) {
                marcarErro(cepInput, true);
                mostrarToast(erro.message || "Não foi possível consultar o CEP.");
                // ainda calcula o frete pela região do CEP
                atualizarOpcoesFrete(L.formatarCEP(cep));
            })
            .then(function () {
                botao.disabled = false;
                botao.textContent = "BUSCAR";
            });
    }

    function atualizarOpcoesFrete(cep) {
        var opcoes = L.calcularFrete(cep, L.subtotalCarrinho());
        var container = el("ck-fretes");

        estado.freteOpcoes = opcoes;

        if (!opcoes.length) {
            container.innerHTML = '<div class="ck-dica">Digite o CEP para ver as opções de frete e prazo.</div>';
            return;
        }

        container.innerHTML = opcoes.map(function (opcao, indice) {
            var precoTexto = opcao.preco > 0 ? L.formatarPreco(opcao.preco) : "Grátis";
            var prazo = opcao.id === "retirada"
                ? "Disponível em 1 a 2 dias úteis — " + opcao.descricao
                : opcao.prazoMin + " a " + opcao.prazoMax + " dias úteis • previsão " + opcao.previsao;

            return '' +
                '<label class="ck-frete' + (indice === 0 ? " selecionado" : "") + '" data-id="' + opcao.id + '">' +
                    '<input type="radio" name="frete" value="' + opcao.id + '"' + (indice === 0 ? " checked" : "") + '>' +
                    '<div class="ck-frete-info">' +
                        '<strong>' + opcao.nome + '</strong>' +
                        '<small>' + prazo + '</small>' +
                    '</div>' +
                    '<div class="ck-frete-preco' + (opcao.preco === 0 ? " gratis" : "") + '">' + precoTexto + '</div>' +
                '</label>';
        }).join("");

        selecionarFrete(opcoes[0]);

        L.$$(".ck-frete", container).forEach(function (rotulo) {
            rotulo.addEventListener("click", function () {
                var id = rotulo.dataset.id;
                var opcao = opcoes.filter(function (o) { return o.id === id; })[0];
                if (!opcao) return;

                L.$$(".ck-frete", container).forEach(function (r) { r.classList.remove("selecionado"); });
                rotulo.classList.add("selecionado");
                rotulo.querySelector("input").checked = true;
                selecionarFrete(opcao);
            });
        });

        var aviso = el("ck-aviso-frete");
        var gratis = L.subtotalCarrinho() >= L.CONFIG.frete.gratisAcimaDe;

        if (gratis) {
            aviso.innerHTML = '<div class="ck-aviso">🎉 Você ganhou <b>frete grátis</b> no PAC! ' +
                'Seu pedido passou de ' + L.formatarPreco(L.CONFIG.frete.gratisAcimaDe) + '.</div>';
        } else {
            var falta = L.CONFIG.frete.gratisAcimaDe - L.subtotalCarrinho();
            aviso.innerHTML = '<div class="ck-aviso">Faltam <b>' + L.formatarPreco(falta) + '</b> para você ganhar frete grátis no PAC.</div>';
        }
    }

    function selecionarFrete(opcao) {
        estado.frete = opcao;
        renderizarResumo();
    }

    function validarEntrega() {
        var obrigatorios = ["cep", "rua", "numero", "bairro", "cidade", "uf"];
        var ok = true;

        obrigatorios.forEach(function (id) {
            var input = el(id);
            var valor = input.value.trim();

            if (!valor) {
                marcarErro(input, true); ok = false;
            } else if (id === "cep" && !L.validarCEP(valor)) {
                marcarErro(input, true); ok = false;
            } else {
                marcarErro(input, false);
            }
        });

        if (!estado.frete) {
            mostrarToast("Calcule o frete informando o CEP.");
            ok = false;
        }

        return ok;
    }

    function salvarEndereco() {
        estado.endereco = {
            cep: el("cep").value,
            rua: el("rua").value.trim(),
            numero: el("numero").value.trim(),
            complemento: el("complemento").value.trim(),
            bairro: el("bairro").value.trim(),
            cidade: el("cidade").value.trim(),
            uf: el("uf").value
        };
    }

    /* ======================================================
       PAGAMENTO
    ====================================================== */

    function selecionarPagamento(tipo) {
        estado.pagamento = tipo;

        L.$$(".ck-pag-tab").forEach(function (tab) {
            var ativo = tab.dataset.pag === tipo;
            tab.classList.toggle("ativo", ativo);
            tab.setAttribute("aria-selected", ativo ? "true" : "false");
        });

        L.$$(".ck-pag-conteudo").forEach(function (conteudo) {
            conteudo.classList.toggle("ativo", conteudo.id === "pag-" + tipo);
        });

        renderizarResumo();

        if (tipo === "pix") gerarPix();
    }

    function gerarPix() {
        var totais = calcularTotais();
        var valor = totais.total;

        if (!(valor > 0)) {
            el("pix-codigo").value = "";
            el("pix-qr").innerHTML = '<span class="ck-dica" style="text-align:center;">O valor do pedido será confirmado pela nossa equipe.</span>';
            return;
        }

        var numero = estado.numeroPedido || L.gerarNumeroPedido();
        estado.numeroPedido = numero;

        var codigo = L.gerarPixCopiaECola(valor, numero);
        estado.pixCodigo = codigo;

        el("pix-codigo").value = codigo;

        renderizarQRCode(codigo, 0);
    }

    function renderizarQRCode(texto, tentativa) {
        var container = el("pix-qr");

        if (window.QRCode) {
            container.innerHTML = "";
            try {
                new window.QRCode(container, {
                    text: texto,
                    width: 174,
                    height: 174,
                    colorDark: "#0b1f3b",
                    colorLight: "#ffffff",
                    correctLevel: window.QRCode.CorrectLevel.M
                });
                return;
            } catch (erro) {
                console.warn("Falha ao gerar QR Code:", erro);
            }
        }

        if (tentativa < 12) {
            setTimeout(function () { renderizarQRCode(texto, tentativa + 1); }, 250);
            return;
        }

        container.innerHTML = '<span class="ck-dica" style="text-align:center;">Use o código PIX ao lado para pagar.</span>';
    }

    function copiarPix() {
        var input = el("pix-codigo");
        if (!input.value) return;

        function feedback() {
            var botao = el("btn-copiar-pix");
            botao.textContent = "COPIADO ✓";
            mostrarToast("Código PIX copiado!");
            setTimeout(function () { botao.textContent = "COPIAR"; }, 2500);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(input.value).then(feedback).catch(function () {
                input.select();
                document.execCommand("copy");
                feedback();
            });
        } else {
            input.select();
            document.execCommand("copy");
            feedback();
        }
    }

    /* ======================================================
       CARTÃO — PREVIEW E VALIDAÇÃO
    ====================================================== */

    function atualizarPreviewCartao() {
        var numero = el("cartao-numero").value;
        var nome = el("cartao-nome").value;
        var validade = el("cartao-validade").value;

        var limpo = L.apenasNumeros(numero);
        var mascarado = limpo.padEnd(16, "•").replace(/(.{4})/g, "$1 ").trim();

        el("cartao-preview").textContent = mascarado;
        el("cartao-nome-preview").textContent = nome ? nome.toUpperCase() : "NOME NO CARTÃO";
        el("cartao-validade-preview").textContent = validade || "MM/AA";
        el("cartao-bandeira").textContent = L.bandeiraCartao(limpo) || "••••";
    }

    function validarCartao() {
        var numero = el("cartao-numero");
        var nome = el("cartao-nome");
        var validade = el("cartao-validade");
        var cvv = el("cartao-cvv");
        var ok = true;

        if (!L.validarCartao(numero.value)) { marcarErro(numero, true); ok = false; }
        else marcarErro(numero, false);

        if (nome.value.trim().length < 3) { marcarErro(nome, true); ok = false; }
        else marcarErro(nome, false);

        if (!L.validarValidade(validade.value)) { marcarErro(validade, true); ok = false; }
        else marcarErro(validade, false);

        if (!/^\d{3,4}$/.test(cvv.value.trim())) { marcarErro(cvv, true); ok = false; }
        else marcarErro(cvv, false);

        return ok;
    }

    /* ======================================================
       FINALIZAÇÃO
    ====================================================== */

    function montarPedido() {
        var totais = calcularTotais();
        var carrinho = L.obterCarrinho();

        return {
            numero: estado.numeroPedido || L.gerarNumeroPedido(),
            data: new Date().toISOString(),
            status: estado.pagamento === "pix" ? "Aguardando pagamento PIX" :
                    estado.pagamento === "cartao" ? "Pagamento em análise" : "Aguardando pagamento do boleto",
            cliente: estado.dados,
            endereco: estado.endereco,
            frete: estado.frete,
            pagamento: {
                tipo: estado.pagamento,
                parcelas: estado.pagamento === "cartao" ? Number(el("cartao-parcelas").value) : 1,
                bandeira: estado.pagamento === "cartao" ? L.bandeiraCartao(el("cartao-numero").value) : "",
                finalCartao: estado.pagamento === "cartao" ? L.apenasNumeros(el("cartao-numero").value).slice(-4) : "",
                pixCopiaECola: estado.pagamento === "pix" ? estado.pixCodigo : ""
            },
            itens: carrinho,
            totais: {
                subtotal: totais.subtotal,
                frete: totais.frete,
                desconto: totais.desconto,
                total: totais.total
            }
        };
    }

    function finalizarPedido() {
        if (estado.finalizando) return;

        if (!L.obterCarrinho().length) {
            mostrarToast("Seu carrinho está vazio.");
            return;
        }

        if (!validarDados()) { irParaEtapa(1); return; }
        if (!validarEntrega()) { irParaEtapa(2); return; }

        if (estado.pagamento === "cartao" && !validarCartao()) return;

        salvarDados();
        salvarEndereco();

        var botao = el("btn-finalizar");
        estado.finalizando = true;
        botao.classList.add("loading");
        botao.disabled = true;

        var pedido = montarPedido();

        /* Se um gateway estiver configurado, cria a cobrança real. */
        var gateway = L.CONFIG.pagamento.gatewayUrl;

        function concluirLocal() {
            L.salvarPedido(pedido);
            L.salvarCarrinho([]);
            mostrarConfirmacao(pedido);
        }

        if (gateway) {
            fetch(gateway, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pedido)
            })
                .then(function (r) { return r.json(); })
                .then(function (dados) {
                    if (dados && dados.url) {
                        L.salvarPedido(pedido);
                        L.salvarCarrinho([]);
                        window.location.href = dados.url;
                        return;
                    }
                    concluirLocal();
                })
                .catch(function (erro) {
                    console.warn("Gateway indisponível:", erro);
                    concluirLocal();
                })
                .then(function () {
                    estado.finalizando = false;
                    botao.classList.remove("loading");
                    botao.disabled = false;
                });
        } else {
            setTimeout(function () {
                concluirLocal();
                estado.finalizando = false;
                botao.classList.remove("loading");
                botao.disabled = false;
            }, 700);
        }
    }

    /* ======================================================
       CONFIRMAÇÃO
    ====================================================== */

    function mostrarConfirmacao(pedido) {
        el("ck-main").style.display = "none";
        el("ck-stepper").style.display = "none";

        var secao = el("ck-confirmacao");
        secao.style.display = "block";

        el("conf-numero").textContent = pedido.numero;

        var mensagem = "Enviamos os detalhes para <b>" + L.escaparHtml(pedido.cliente.email) + "</b>.";
        el("conf-mensagem").innerHTML = mensagem;

        var box = el("conf-pagamento");
        var total = L.formatarPreco(pedido.totais.total);

        if (pedido.pagamento.tipo === "pix") {
            box.innerHTML = '' +
                '<h2 style="font-size:22px;">Pague com PIX</h2>' +
                '<p class="ck-sub">Escaneie o QR Code ou copie o código abaixo. O valor já inclui o desconto de ' +
                    L.CONFIG.pagamento.descontoPix + '%.</p>' +
                '<div class="ck-pix-box">' +
                    '<div class="ck-pix-qr" id="conf-pix-qr"></div>' +
                    '<div class="ck-total-final" style="justify-content:center;gap:14px;border:0;">' +
                        '<span>Total</span><strong>' + total + '</strong>' +
                    '</div>' +
                    '<div class="ck-pix-codigo" style="margin-top:16px;">' +
                        '<input type="text" id="conf-pix-codigo" readonly value="' + L.escaparHtml(pedido.pagamento.pixCopiaECola) + '">' +
                        '<button type="button" class="ck-btn-copiar" id="conf-btn-copiar">COPIAR</button>' +
                    '</div>' +
                '</div>';

            renderizarQRCodeEm("conf-pix-qr", pedido.pagamento.pixCopiaECola);

            el("conf-btn-copiar").addEventListener("click", function () {
                var input = el("conf-pix-codigo");
                input.select();
                if (navigator.clipboard) navigator.clipboard.writeText(input.value);
                else document.execCommand("copy");
                this.textContent = "COPIADO ✓";
                mostrarToast("Código PIX copiado!");
            });

        } else if (pedido.pagamento.tipo === "cartao") {
            box.innerHTML = '' +
                '<h2 style="font-size:22px;">Pagamento em análise</h2>' +
                '<p class="ck-sub">Recebemos os dados do cartão <b>' + L.escaparHtml(pedido.pagamento.bandeira || "") +
                ' final ' + L.escaparHtml(pedido.pagamento.finalCartao || "") + '</b> em ' +
                pedido.pagamento.parcelas + 'x.</p>' +
                '<div class="ck-total-final"><span>Total</span><strong>' + total + '</strong></div>' +
                '<div class="ck-aviso" style="margin-top:16px;">A confirmação chega por e-mail em até 1 dia útil. ' +
                'Se preferir, finalize pelo WhatsApp com nossa equipe.</div>';

        } else {
            box.innerHTML = '' +
                '<h2 style="font-size:22px;">Boleto gerado</h2>' +
                '<p class="ck-sub">O boleto de <b>' + total + '</b> foi enviado para o seu e-mail e vence em 3 dias úteis.</p>' +
                '<div class="ck-aviso">Após o pagamento, a compensação leva até 2 dias úteis.</div>';
        }

        /* Resumo final */
        el("conf-resumo").innerHTML = '' +
            '<div class="ck-total-linha"><span>Subtotal</span><strong>' + L.formatarPreco(pedido.totais.subtotal) + '</strong></div>' +
            '<div class="ck-total-linha"><span>Frete (' + L.escaparHtml(pedido.frete ? pedido.frete.nome : "—") + ')</span><strong>' +
                (pedido.totais.frete > 0 ? L.formatarPreco(pedido.totais.frete) : "Grátis") + '</strong></div>' +
            (pedido.totais.desconto > 0 ? '<div class="ck-total-linha desconto"><span>Desconto PIX</span><strong>− ' + L.formatarPreco(pedido.totais.desconto) + '</strong></div>' : '') +
            '<div class="ck-total-final"><span>Total</span><strong>' + total + '</strong></div>' +
            '<p class="ck-dica" style="margin-top:14px;">Entrega em <b>' + L.escaparHtml(pedido.endereco.rua) + ', ' +
                L.escaparHtml(pedido.endereco.numero) + ' — ' + L.escaparHtml(pedido.endereco.bairro) + ', ' +
                L.escaparHtml(pedido.endereco.cidade) + '/' + L.escaparHtml(pedido.endereco.uf) + '</b></p>';

        /* WhatsApp com resumo do pedido */
        var texto = "Olá! Acabei de fazer o pedido " + pedido.numero + " no site.\n" +
            "Total: " + total + "\nPagamento: " + pedido.pagamento.tipo.toUpperCase();

        el("conf-whatsapp").href = "https://wa.me/" + L.CONFIG.whatsapp + "?text=" + encodeURIComponent(texto);

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function renderizarQRCodeEm(idContainer, texto) {
        var container = el(idContainer);
        if (!container) return;

        if (window.QRCode) {
            container.innerHTML = "";
            try {
                new window.QRCode(container, {
                    text: texto,
                    width: 174,
                    height: 174,
                    colorDark: "#0b1f3b",
                    colorLight: "#ffffff",
                    correctLevel: window.QRCode.CorrectLevel.M
                });
                return;
            } catch (e) {}
        }
        container.innerHTML = '<span class="ck-dica" style="text-align:center;">Use o código PIX abaixo.</span>';
    }

    /* ======================================================
       EVENTOS
    ====================================================== */

    function iniciar() {
        if (!L.obterCarrinho().length) {
            window.location.href = "carrinho.html";
            return;
        }

        /* máscaras */
        L.aplicarMascara(el("telefone"), "telefone");
        L.aplicarMascara(el("cep"), "cep");
        L.aplicarMascara(el("cartao-numero"), "cartao");
        L.aplicarMascara(el("cartao-validade"), "validade");
        L.aplicarMascara(el("cartao-cvv"), "numeros");

        /* documento: CPF ou CNPJ conforme tamanho */
        el("documento").addEventListener("input", function () {
            var n = L.apenasNumeros(this.value);
            this.value = n.length > 11 ? L.mascaras.cnpj(this.value) : L.mascaras.cpf(this.value);
        });

        restaurarDados();
        renderizarResumo();

        /* etapa 1 */
        el("form-dados").addEventListener("submit", function (evento) {
            evento.preventDefault();
            if (!validarDados()) {
                mostrarToast("Confira os campos destacados.");
                return;
            }
            salvarDados();
            irParaEtapa(2);
        });

        /* etapa 2 */
        el("btn-buscar-cep").addEventListener("click", buscarEndereco);

        el("cep").addEventListener("blur", function () {
            if (L.validarCEP(this.value)) buscarEndereco();
        });

        el("cep").addEventListener("input", function () {
            if (L.validarCEP(this.value)) buscarEndereco();
        });

        el("form-entrega").addEventListener("submit", function (evento) {
            evento.preventDefault();
            if (!validarEntrega()) {
                mostrarToast("Confira o endereço e escolha o frete.");
                return;
            }
            salvarEndereco();
            irParaEtapa(3);
        });

        /* voltar */
        L.$$("[data-voltar]").forEach(function (botao) {
            botao.addEventListener("click", function () {
                irParaEtapa(Number(botao.dataset.voltar));
            });
        });

        /* pagamento */
        L.$$(".ck-pag-tab").forEach(function (tab) {
            tab.addEventListener("click", function () {
                selecionarPagamento(tab.dataset.pag);
            });
        });

        el("btn-copiar-pix").addEventListener("click", copiarPix);

        /* cartão */
        ["cartao-numero", "cartao-nome", "cartao-validade"].forEach(function (id) {
            el(id).addEventListener("input", atualizarPreviewCartao);
        });

        el("cartao-numero").addEventListener("blur", function () {
            if (this.value && !L.validarCartao(this.value)) marcarErro(this, true);
        });

        /* finalizar */
        el("btn-finalizar").addEventListener("click", finalizarPedido);

        /* rótulo do desconto */
        el("pix-desconto-label").textContent = L.CONFIG.pagamento.descontoPix + "% OFF";

        /* se o carrinho mudar em outra aba */
        window.addEventListener("storage", function (evento) {
            if (evento.key === "carrinho") renderizarResumo();
        });
    }

    document.addEventListener("DOMContentLoaded", iniciar);

})();
