/* ==========================================================
   ROYAL SUITS — FRETE E CUPONS
   ========================================================== */

export const FRETE_GRATIS_ACIMA_DE = Number(process.env.FRETE_GRATIS_ACIMA_DE || 500);
export const DESCONTO_PIX = Number(process.env.DESCONTO_PIX || 5);

export const REGIOES = {
  "0": { nome: "São Paulo (capital e região)", pac: 19.9, pacPrazo: [2, 4], sedex: 32.9, sedexPrazo: [1, 2] },
  "1": { nome: "Interior de São Paulo", pac: 24.9, pacPrazo: [3, 5], sedex: 39.9, sedexPrazo: [2, 3] },
  "2": { nome: "Rio de Janeiro / Espírito Santo", pac: 27.9, pacPrazo: [4, 6], sedex: 44.9, sedexPrazo: [2, 3] },
  "3": { nome: "Minas Gerais", pac: 29.9, pacPrazo: [4, 6], sedex: 46.9, sedexPrazo: [2, 3] },
  "4": { nome: "Bahia / Sergipe", pac: 34.9, pacPrazo: [5, 8], sedex: 56.9, sedexPrazo: [3, 5] },
  "5": { nome: "Pernambuco / Alagoas / Paraíba / RN", pac: 37.9, pacPrazo: [6, 9], sedex: 61.9, sedexPrazo: [4, 5] },
  "6": { nome: "Ceará / Piauí / Maranhão / Norte", pac: 44.9, pacPrazo: [8, 12], sedex: 74.9, sedexPrazo: [5, 7] },
  "7": { nome: "Distrito Federal / Centro-Oeste", pac: 34.9, pacPrazo: [5, 8], sedex: 56.9, sedexPrazo: [3, 5] },
  "8": { nome: "Paraná / Santa Catarina", pac: 27.9, pacPrazo: [3, 6], sedex: 44.9, sedexPrazo: [2, 3] },
  "9": { nome: "Rio Grande do Sul", pac: 29.9, pacPrazo: [4, 7], sedex: 49.9, sedexPrazo: [2, 4] },
};

export function cotarFrete(cep, subtotal = 0) {
  const numeros = String(cep || "").replace(/\D/g, "");
  if (numeros.length !== 8) return { erro: "CEP inválido." };

  const regiao = REGIOES[numeros[0]] || REGIOES["0"];
  const gratis = Number(subtotal) >= FRETE_GRATIS_ACIMA_DE;

  const opcoes = [
    {
      id: "pac",
      nome: gratis ? "PAC — Frete grátis" : "PAC (econômico)",
      preco: gratis ? 0 : regiao.pac,
      prazo: regiao.pacPrazo,
      transportadora: "Correios",
      regiao: regiao.nome,
    },
    {
      id: "sedex",
      nome: "SEDEX (expresso)",
      preco: regiao.sedex,
      prazo: regiao.sedexPrazo,
      transportadora: "Correios",
      regiao: regiao.nome,
    },
    {
      id: "retirada",
      nome: "Retirar na loja — Av. Paulista, 1000",
      preco: 0,
      prazo: [0, 1],
      transportadora: "Retirada",
      regiao: "São Paulo",
    },
  ];

  return { cep: numeros, regiao: regiao.nome, subtotal: Number(subtotal) || 0, opcoes };
}

export function calcularDescontos({ subtotal, tipoPagamento, cupom }) {
  const subtotalNum = Number(subtotal) || 0;
  let descontoPix = 0;
  let descontoCupom = 0;
  let cupomAplicado = null;

  if (tipoPagamento === "pix") {
    descontoPix = Math.round(subtotalNum * (DESCONTO_PIX / 100) * 100) / 100;
  }

  if (cupom && cupom.ativo !== false) {
    if (!cupom.validade || new Date(cupom.validade) >= new Date()) {
      if (!cupom.minimo || subtotalNum >= Number(cupom.minimo)) {
        descontoCupom =
          cupom.tipo === "fixo"
            ? Math.min(Number(cupom.valor) || 0, subtotalNum)
            : Math.round(subtotalNum * (Number(cupom.valor) / 100) * 100) / 100;
        cupomAplicado = { codigo: cupom.codigo, tipo: cupom.tipo, valor: cupom.valor };
      }
    }
  }

  const desconto = Math.round((descontoPix + descontoCupom) * 100) / 100;
  return { descontoPix, descontoCupom, desconto, cupom: cupomAplicado };
}
