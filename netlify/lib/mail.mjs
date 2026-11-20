/* ==========================================================
   ROYAL SUITS — E-MAIL (opcional, via Resend)
   Se RESEND_API_KEY não estiver configurada, apenas registra
   no log e a operação segue normalmente.
   ========================================================== */

export async function enviarEmail({ para, assunto, html, texto }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Royal Suits <onboarding@resend.dev>";

  if (!key) {
    console.log(`[email:simulado] para=${para} assunto=${assunto}`);
    return { enviado: false, motivo: "RESEND_API_KEY não configurada" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [para],
        subject: assunto,
        html: html || `<p>${texto || ""}</p>`,
      }),
    });

    if (!res.ok) {
      const detalhe = await res.text();
      console.error("[email] falha:", res.status, detalhe);
      return { enviado: false, motivo: `HTTP ${res.status}` };
    }
    return { enviado: true };
  } catch (erro) {
    console.error("[email] erro:", erro.message);
    return { enviado: false, motivo: erro.message };
  }
}

export function templatePedido(pedido) {
  const itens = (pedido.itens || [])
    .map(
      (i) =>
        `<tr><td>${i.nome}</td><td>${i.quantidade}x</td><td>R$ ${Number(i.preco)
          .toFixed(2)
          .replace(".", ",")}</td></tr>`
    )
    .join("");

  return `
  <div style="font-family:Georgia,serif;color:#0b1f3b;max-width:600px">
    <h1 style="font-size:22px">Royal Suits</h1>
    <p>Recebemos seu pedido <strong>${pedido.numero}</strong>.</p>
    <table style="width:100%;border-collapse:collapse">${itens}</table>
    <p style="margin-top:16px">Total: <strong>R$ ${Number(pedido.totais.total)
      .toFixed(2)
      .replace(".", ",")}</strong></p>
    <p>Status: ${pedido.status}</p>
    <p style="font-size:12px;color:#666">Elegância para os momentos que merecem ser lembrados.</p>
  </div>`;
}
