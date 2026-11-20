/* ==========================================================
   ROYAL SUITS — PIX (BR Code EMV + CRC16)
   ========================================================== */

function crc16(payload) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

const field = (id, value) => {
  const v = String(value);
  return `${id}${String(v.length).padStart(2, "0")}${v}`;
};

const clean = (text, max) =>
  String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 .,\-]/g, "")
    .toUpperCase()
    .slice(0, max);

/**
 * Gera o "PIX Copia e Cola" (BR Code) estático.
 */
export function gerarPixCopiaECola({ chave, nome, cidade, valor, txid = "***", descricao }) {
  const chavePix = chave || process.env.PIX_CHAVE || "contato@royalsuits.com.br";
  const nomeRecebedor = clean(nome || process.env.PIX_NOME || "ROYAL SUITS", 25);
  const cidadeRecebedor = clean(cidade || process.env.PIX_CIDADE || "SAO PAULO", 15);

  const merchantAccount =
    field("00", "br.gov.bcb.pix") +
    field("01", chavePix) +
    (descricao ? field("02", clean(descricao, 40)) : "");

  let payload =
    field("00", "01") +
    field("01", "12") +
    field("26", merchantAccount) +
    field("52", "0000") +
    field("53", "986") +
    (Number(valor) > 0 ? field("54", Number(valor).toFixed(2)) : "") +
    field("58", "BR") +
    field("59", nomeRecebedor) +
    field("60", cidadeRecebedor) +
    field("62", field("05", clean(txid, 25) || "***"));

  payload += "6304";
  return payload + crc16(payload);
}
