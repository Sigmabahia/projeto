/* ==========================================================
   ROYAL SUITS — NÚCLEO DA LOJA (loja.js)
   ----------------------------------------------------------
   Módulo compartilhado por carrinho, checkout e meus pedidos.
   Contém:
   - Configurações da loja (contato, frete, pagamento)
   - Carrinho (localStorage)
   - Cálculo de frete por CEP (regiões + prazos + frete grátis)
   - Consulta de endereço via ViaCEP
   - Validações (CPF/CNPJ, cartão de crédito, e-mail, CEP)
   - Geração de PIX Copia e Cola (BR Code EMV + CRC16)
   - Registro de pedidos
   - Máscaras de formulário
========================================================== */

(function (window, document) {
    "use strict";

    /* ======================================================
       1. CONFIGURAÇÕES DA LOJA
       ------------------------------------------------------
       >>> EDITE AQUI OS DADOS REAIS DA SUA LOJA <<<
    ====================================================== */

    var CONFIG = {
        nome: "Royal Suits",
        cnpj: "00.000.000/0001-00",
        email: "contato@royalsuits.com.br",
        telefone: "11912345678",          // só números (DDD + número)
        whatsapp: "5511912345678",        // 55 + DDD + número
        horario: "Seg. a sáb., das 9h às 19h",
        endereco: {
            rua: "Av. Paulista, 1000",
            bairro: "Bela Vista",
            cidade: "São Paulo",
            uf: "SP",
            cep: "01310-100"
        },

        /* ---------------- FRETE ----------------
           Valores em reais. Prazo em dias úteis.
           A tabela usa o primeiro dígito do CEP (região postal).
        ---------------------------------------- */
        frete: {
            gratisAcimaDe: 500,          // PAC grátis a partir deste subtotal
            retirada: true,              // permite retirar na loja
            cepOrigem: "01310-100",
            regioes: {
                "0": { nome: "São Paulo (capital e região)", pac: 19.9, pacPrazo: [2, 4], sedex: 32.9, sedexPrazo: [1, 2] },
                "1": { nome: "Interior de São Paulo", pac: 24.9, pacPrazo: [3, 5], sedex: 39.9, sedexPrazo: [2, 3] },
                "2": { nome: "Rio de Janeiro / Espírito Santo", pac: 27.9, pacPrazo: [4, 6], sedex: 44.9, sedexPrazo: [2, 3] },
                "3": { nome: "Minas Gerais", pac: 29.9, pacPrazo: [4, 6], sedex: 46.9, sedexPrazo: [2, 3] },
                "4": { nome: "Bahia / Sergipe", pac: 34.9, pacPrazo: [5, 8], sedex: 56.9, sedexPrazo: [3, 5] },
                "5": { nome: "Pernambuco / Alagoas / Paraíba / RN", pac: 37.9, pacPrazo: [6, 9], sedex: 61.9, sedexPrazo: [4, 5] },
                "6": { nome: "Ceará / Piauí / Maranhão / Norte", pac: 44.9, pacPrazo: [8, 12], sedex: 74.9, sedexPrazo: [5, 7] },
                "7": { nome: "Distrito Federal / Centro-Oeste", pac: 34.9, pacPrazo: [5, 8], sedex: 56.9, sedexPrazo: [3, 5] },
                "8": { nome: "Paraná / Santa Catarina", pac: 27.9, pacPrazo: [3, 6], sedex: 44.9, sedexPrazo: [2, 3] },
                "9": { nome: "Rio Grande do Sul", pac: 29.9, pacPrazo: [4, 7], sedex: 49.9, sedexPrazo: [2, 4] }
            }
        },

        /* ---------------- PAGAMENTO ----------------
           pixChave: chave PIX real da loja (CPF/CNPJ, e-mail,
           telefone ou chave aleatória). Sem ela o PIX não recebe.
           gatewayUrl: endpoint opcional que cria a cobrança no
           Mercado Pago / Stripe / PagSeguro e devolve { url }.
           linkCartao / linkBoleto: links de pagamento prontos.
        -------------------------------------------- */
        pagamento: {
            pixChave: "contato@royalsuits.com.br",
            pixNome: "ROYAL SUITS",
            pixCidade: "SAO PAULO",
            gatewayUrl: "",              // ex.: "https://sua-api.com/api/pagamento"
            linkCartao: "",              // ex.: link do Mercado Pago
            linkBoleto: "",
            parcelasSemJuros: 3,
            jurosMes: 2.49,
            descontoPix: 5               // % de desconto no PIX
        }
    };

    /* ======================================================
       2. UTILITÁRIOS
    ====================================================== */

    function formatarPreco(valor) {
        return "R$ " + Number(valor || 0).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    function apenasNumeros(texto) {
        return String(texto || "").replace(/\D/g, "");
    }

    function escaparHtml(texto) {
        return String(texto == null ? "" : texto)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function $(seletor, raiz) {
        return (raiz || document).querySelector(seletor);
    }

    function $$(seletor, raiz) {
        return Array.prototype.slice.call((raiz || document).querySelectorAll(seletor));
    }

    /* ======================================================
       3. CARRINHO
    ====================================================== */

    function obterCarrinho() {
        try {
            var lista = JSON.parse(localStorage.getItem("carrinho"));
            return Array.isArray(lista) ? lista : [];
        } catch (erro) {
            return [];
        }
    }

    function salvarCarrinho(lista) {
        localStorage.setItem("carrinho", JSON.stringify(lista || []));
        document.dispatchEvent(new CustomEvent("carrinhoAtualizado"));
    }

    function adicionarAoCarrinho(nome, preco, imagem, quantidade) {
        var carrinho = obterCarrinho();
        var qtd = Math.max(1, Number(quantidade) || 1);
        var existente = carrinho.filter(function (item) { return item.nome === nome; })[0];

        if (existente) {
            existente.quantidade = (Number(existente.quantidade) || 1) + qtd;
        } else {
            carrinho.push({
                nome: nome,
                preco: Number(preco) || 0,
                imagem: imagem || "imagens/ternos/terno-azul-01.png",
                quantidade: qtd
            });
        }

        salvarCarrinho(carrinho);
        return carrinho;
    }

    function removerDoCarrinho(nome) {
        salvarCarrinho(obterCarrinho().filter(function (item) { return item.nome !== nome; }));
    }

    function alterarQuantidade(nome, diferenca) {
        var carrinho = obterCarrinho();
        carrinho.forEach(function (item) {
            if (item.nome === nome) {
                item.quantidade = Math.max(1, (Number(item.quantidade) || 1) + diferenca);
            }
        });
        salvarCarrinho(carrinho);
    }

    function totalItens() {
        return obterCarrinho().reduce(function (soma, item) {
            return soma + (Number(item.quantidade) || 1);
        }, 0);
    }

    function subtotalCarrinho() {
        return obterCarrinho().reduce(function (soma, item) {
            return soma + (Number(item.preco) || 0) * (Number(item.quantidade) || 1);
        }, 0);
    }

    function temItemSobConsulta() {
        return obterCarrinho().some(function (item) { return !(Number(item.preco) > 0); });
    }

    function atualizarContador() {
        var contador = document.getElementById("contador-carrinho");
        if (contador) contador.textContent = totalItens();
    }

    /* ======================================================
       4. CEP E FRETE
    ====================================================== */

    function validarCEP(cep) {
        return /^\d{8}$/.test(apenasNumeros(cep));
    }

    function formatarCEP(cep) {
        var n = apenasNumeros(cep).slice(0, 8);
        return n.length > 5 ? n.slice(0, 5) + "-" + n.slice(5) : n;
    }

    /* Consulta o endereço no ViaCEP. Retorna Promise<endereco|null> */
    function buscarCEP(cep) {
        var numeros = apenasNumeros(cep);

        if (!validarCEP(numeros)) {
            return Promise.reject(new Error("CEP inválido. Informe os 8 números."));
        }

        return fetch("https://viacep.com.br/ws/" + numeros + "/json/", { cache: "no-store" })
            .then(function (resposta) {
                if (!resposta.ok) throw new Error("Não foi possível consultar o CEP agora.");
                return resposta.json();
            })
            .then(function (dados) {
                if (dados.erro) throw new Error("CEP não encontrado. Confira o número digitado.");
                return {
                    cep: formatarCEP(numeros),
                    rua: dados.logradouro || "",
                    bairro: dados.bairro || "",
                    cidade: dados.localidade || "",
                    uf: dados.uf || "",
                    regiao: regiaoDoCEP(numeros)
                };
            });
    }

    function regiaoDoCEP(cep) {
        var numeros = apenasNumeros(cep);
        var regioes = CONFIG.frete.regioes;
        return regioes[numeros.charAt(0)] || regioes["0"];
    }

    /* Soma dias úteis a partir de hoje (ignora sábados e domingos) */
    function somarDiasUteis(dias) {
        var data = new Date();
        var adicionados = 0;

        while (adicionados < dias) {
            data.setDate(data.getDate() + 1);
            var dia = data.getDay();
            if (dia !== 0 && dia !== 6) adicionados++;
        }
        return data;
    }

    function formatarData(data) {
        return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    }

    /**
     * Calcula as opções de frete para um CEP.
     * @returns {Array} [{ id, nome, descricao, preco, gratis, prazoMin, prazoMax, previsao }]
     */
    function calcularFrete(cep, subtotal) {
        if (!validarCEP(cep)) return [];

        var regiao = regiaoDoCEP(cep);
        var valor = Number(subtotal) || 0;
        var gratis = valor >= CONFIG.frete.gratisAcimaDe;
        var opcoes = [];

        opcoes.push({
            id: "pac",
            nome: "PAC (econômico)",
            descricao: regiao.nome,
            preco: gratis ? 0 : regiao.pac,
            gratis: gratis,
            prazoMin: regiao.pacPrazo[0],
            prazoMax: regiao.pacPrazo[1],
            previsao: formatarData(somarDiasUteis(regiao.pacPrazo[1]))
        });

        opcoes.push({
            id: "sedex",
            nome: "SEDEX (expresso)",
            descricao: regiao.nome,
            preco: regiao.sedex,
            gratis: false,
            prazoMin: regiao.sedexPrazo[0],
            prazoMax: regiao.sedexPrazo[1],
            previsao: formatarData(somarDiasUteis(regiao.sedexPrazo[1]))
        });

        if (CONFIG.frete.retirada) {
            opcoes.push({
                id: "retirada",
                nome: "Retirar na loja",
                descricao: CONFIG.endereco.bairro + ", " + CONFIG.endereco.cidade + " — " + CONFIG.endereco.uf,
                preco: 0,
                gratis: true,
                prazoMin: 1,
                prazoMax: 2,
                previsao: "a combinar"
            });
        }

        return opcoes;
    }

    /* ======================================================
       5. VALIDAÇÕES
    ====================================================== */

    function validarEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(email || "").trim());
    }

    function validarCPF(cpf) {
        var n = apenasNumeros(cpf);
        if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;

        var soma = 0;
        var i;
        for (i = 0; i < 9; i++) soma += Number(n.charAt(i)) * (10 - i);
        var dig1 = (soma * 10) % 11 % 10;
        if (dig1 !== Number(n.charAt(9))) return false;

        soma = 0;
        for (i = 0; i < 10; i++) soma += Number(n.charAt(i)) * (11 - i);
        var dig2 = (soma * 10) % 11 % 10;
        return dig2 === Number(n.charAt(10));
    }

    function validarCNPJ(cnpj) {
        var n = apenasNumeros(cnpj);
        if (n.length !== 14 || /^(\d)\1{13}$/.test(n)) return false;

        function digito(base, pesos) {
            var soma = 0;
            for (var i = 0; i < base.length; i++) soma += Number(base.charAt(i)) * pesos[i];
            var resto = soma % 11;
            return resto < 2 ? 0 : 11 - resto;
        }

        var d1 = digito(n.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
        var d2 = digito(n.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
        return d1 === Number(n.charAt(12)) && d2 === Number(n.charAt(13));
    }

    function validarCPFOuCNPJ(doc) {
        var n = apenasNumeros(doc);
        return n.length === 14 ? validarCNPJ(n) : validarCPF(n);
    }

    function validarCartao(numero) {
        var n = apenasNumeros(numero);
        if (n.length < 13 || n.length > 19) return false;

        var soma = 0;
        var alternar = false;
        for (var i = n.length - 1; i >= 0; i--) {
            var digito = Number(n.charAt(i));
            if (alternar) {
                digito *= 2;
                if (digito > 9) digito -= 9;
            }
            soma += digito;
            alternar = !alternar;
        }
        return soma % 10 === 0;
    }

    function bandeiraCartao(numero) {
        var n = apenasNumeros(numero);
        if (/^4/.test(n)) return "Visa";
        if (/^(5[1-5]|2[2-7])/.test(n)) return "Mastercard";
        if (/^3[47]/.test(n)) return "American Express";
        if (/^(606282|3841)/.test(n)) return "Hipercard";
        if (/^(4011|4312|4389|50[679])/.test(n)) return "Elo";
        return "";
    }

    function validarValidade(validade) {
        var m = /^(\d{2})\/?(\d{2})$/.exec(String(validade || "").trim());
        if (!m) return false;

        var mes = Number(m[1]);
        var ano = 2000 + Number(m[2]);
        if (mes < 1 || mes > 12) return false;

        var hoje = new Date();
        var limite = new Date(ano, mes, 1);
        return limite > hoje;
    }

    function validarTelefone(tel) {
        var n = apenasNumeros(tel);
        return n.length === 10 || n.length === 11;
    }

    /* ======================================================
       6. PIX — BR CODE (EMV)
    ====================================================== */

    function crc16(payload) {
        var polinomio = 0x1021;
        var resultado = 0xFFFF;

        for (var i = 0; i < payload.length; i++) {
            resultado ^= payload.charCodeAt(i) << 8;
            for (var j = 0; j < 8; j++) {
                resultado = (resultado & 0x8000) ? ((resultado << 1) ^ polinomio) : (resultado << 1);
                resultado &= 0xFFFF;
            }
        }
        return ("0000" + resultado.toString(16).toUpperCase()).slice(-4);
    }

    function campo(id, valor) {
        var tamanho = ("00" + String(valor).length).slice(-2);
        return id + tamanho + valor;
    }

    function normalizarTexto(texto, maximo) {
        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^A-Za-z0-9 ]/g, "")
            .toUpperCase()
            .slice(0, maximo)
            .trim();
    }

    function chavePixFormatada(chave) {
        var texto = String(chave || "").trim();

        // Telefone: +5511999999999
        if (/^\+?\d{10,13}$/.test(texto.replace(/\D/g, "")) && texto.replace(/\D/g, "").length >= 10) {
            var n = texto.replace(/\D/g, "");
            if (n.length <= 11) n = "55" + n;
            return "+" + n;
        }
        // CPF/CNPJ: somente números
        if (/^\d{11}$/.test(texto) || /^\d{14}$/.test(texto)) return texto;
        return texto;
    }

    /**
     * Gera o PIX Copia e Cola (BR Code) com valor e identificador.
     */
    function gerarPixCopiaECola(valor, descricao) {
        var chave = chavePixFormatada(CONFIG.pagamento.pixChave);
        var nome = normalizarTexto(CONFIG.pagamento.pixNome, 25) || "ROYAL SUITS";
        var cidade = normalizarTexto(CONFIG.pagamento.pixCidade, 15) || "SAO PAULO";
        var txid = normalizarTexto(descricao || "PEDIDO", 25).replace(/ /g, "") || "PEDIDO";

        var conta =
            campo("00", "br.gov.bcb.pix") +
            campo("01", chave);

        var payload =
            campo("00", "01") +
            campo("26", conta) +
            campo("52", "0000") +
            campo("53", "986") +
            campo("54", Number(valor || 0).toFixed(2)) +
            campo("58", "BR") +
            campo("59", nome) +
            campo("60", cidade) +
            campo("62", campo("05", txid)) +
            "6304";

        return payload + crc16(payload);
    }

    /* ======================================================
       7. PEDIDOS
    ====================================================== */

    function gerarNumeroPedido() {
        var agora = new Date();
        var base = agora.getFullYear() +
            ("0" + (agora.getMonth() + 1)).slice(-2) +
            ("0" + agora.getDate()).slice(-2);
        var aleatorio = Math.floor(Math.random() * 9000) + 1000;
        return "RS-" + base + "-" + aleatorio;
    }

    function obterPedidos() {
        try {
            var lista = JSON.parse(localStorage.getItem("pedidos"));
            return Array.isArray(lista) ? lista : [];
        } catch (erro) {
            return [];
        }
    }

    function salvarPedido(pedido) {
        var pedidos = obterPedidos();
        pedidos.unshift(pedido);
        localStorage.setItem("pedidos", JSON.stringify(pedidos.slice(0, 50)));
        return pedido;
    }

    /* ======================================================
       8. MÁSCARAS
    ====================================================== */

    var mascaras = {
        cep: function (v) { return formatarCEP(v); },
        cpf: function (v) {
            var n = apenasNumeros(v).slice(0, 11);
            return n
                .replace(/^(\d{3})(\d)/, "$1.$2")
                .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
                .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
        },
        cnpj: function (v) {
            var n = apenasNumeros(v).slice(0, 14);
            return n
                .replace(/^(\d{2})(\d)/, "$1.$2")
                .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
                .replace(/\.(\d{3})(\d)/, ".$1/$2")
                .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
        },
        telefone: function (v) {
            var n = apenasNumeros(v).slice(0, 11);
            if (n.length <= 10) {
                return n.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2");
            }
            return n.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
        },
        cartao: function (v) {
            return apenasNumeros(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
        },
        numeros: function (v) { return apenasNumeros(v).slice(0, 4); },
        validade: function (v) {
            var n = apenasNumeros(v).slice(0, 4);
            return n.length > 2 ? n.slice(0, 2) + "/" + n.slice(2) : n;
        }
    };

    function aplicarMascara(input, tipo) {
        if (!input || !mascaras[tipo]) return;
        input.addEventListener("input", function () {
            var posicaoFinal = this.selectionStart === this.value.length;
            this.value = mascaras[tipo](this.value);
            if (posicaoFinal) this.setSelectionRange(this.value.length, this.value.length);
        });
    }

    /* ======================================================
       9. PARCELAMENTO
    ====================================================== */

    function calcularParcelas(total) {
        var config = CONFIG.pagamento;
        var parcelas = [];

        for (var i = 1; i <= 12; i++) {
            var valorParcela;
            if (i <= config.parcelasSemJuros) {
                valorParcela = total / i;
            } else {
                var taxa = config.jurosMes / 100;
                var fator = taxa / (1 - Math.pow(1 + taxa, -i));
                valorParcela = total * fator;
            }
            parcelas.push({
                numero: i,
                valor: valorParcela,
                total: valorParcela * i,
                semJuros: i <= config.parcelasSemJuros
            });
        }
        return parcelas;
    }

    /* ======================================================
       10. EXPORTAÇÃO
    ====================================================== */

    var Loja = {
        CONFIG: CONFIG,
        formatarPreco: formatarPreco,
        apenasNumeros: apenasNumeros,
        escaparHtml: escaparHtml,
        $: $,
        $$: $$,

        // carrinho
        obterCarrinho: obterCarrinho,
        salvarCarrinho: salvarCarrinho,
        adicionarAoCarrinho: adicionarAoCarrinho,
        removerDoCarrinho: removerDoCarrinho,
        alterarQuantidade: alterarQuantidade,
        totalItens: totalItens,
        subtotalCarrinho: subtotalCarrinho,
        temItemSobConsulta: temItemSobConsulta,
        atualizarContador: atualizarContador,

        // frete
        validarCEP: validarCEP,
        formatarCEP: formatarCEP,
        buscarCEP: buscarCEP,
        calcularFrete: calcularFrete,
        regiaoDoCEP: regiaoDoCEP,

        // validações
        validarEmail: validarEmail,
        validarCPF: validarCPF,
        validarCNPJ: validarCNPJ,
        validarCPFOuCNPJ: validarCPFOuCNPJ,
        validarCartao: validarCartao,
        validarValidade: validarValidade,
        validarTelefone: validarTelefone,
        bandeiraCartao: bandeiraCartao,

        // pix
        gerarPixCopiaECola: gerarPixCopiaECola,
        crc16: crc16,

        // pedidos
        gerarNumeroPedido: gerarNumeroPedido,
        obterPedidos: obterPedidos,
        salvarPedido: salvarPedido,

        // utilidades
        aplicarMascara: aplicarMascara,
        mascaras: mascaras,
        calcularParcelas: calcularParcelas
    };

    window.Loja = Loja;

    document.addEventListener("DOMContentLoaded", function () {
        atualizarContador();
    });

})(window, document);
