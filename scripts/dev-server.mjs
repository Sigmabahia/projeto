/* Servidor local que simula a Netlify: estáticos + /api (memória). */
process.env.RS_MEMORY_DB = "1";
process.env.JWT_SECRET = "dev-secret";
process.env.ADMIN_EMAIL = "admin@royalsuits.com.br";
process.env.ADMIN_PASSWORD = "admin123456";
process.env.ADMIN_BOOTSTRAP_TOKEN = "bootstrap-token";

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { default: handler } = await import("../netlify/functions/api.mjs");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (url.pathname.startsWith("/api")) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const corpo = chunks.length ? Buffer.concat(chunks) : undefined;

    const request = new Request(`http://localhost${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : corpo,
    });

    const resposta = await handler(request);
    res.statusCode = resposta.status;
    resposta.headers.forEach((v, k) => res.setHeader(k, v));
    res.end(await resposta.text());
    return;
  }

  let caminho = decodeURIComponent(url.pathname);
  if (caminho === "/") caminho = "/index.html";
  let arquivo = path.join(raiz, caminho);

  if (!arquivo.startsWith(raiz)) {
    res.statusCode = 403;
    return res.end("Proibido");
  }

  if (!fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) {
    const alternativo = path.join(raiz, caminho.replace(/\/$/, "") + ".html");
    if (fs.existsSync(alternativo)) arquivo = alternativo;
    else {
      res.statusCode = 404;
      return res.end(fs.readFileSync(path.join(raiz, "404.html")));
    }
  }

  res.setHeader("Content-Type", MIME[path.extname(arquivo)] || "application/octet-stream");
  res.end(fs.readFileSync(arquivo));
});

const porta = Number(process.env.PORT || 8888);
server.listen(porta, "0.0.0.0", () => console.log(`Royal Suits dev em http://localhost:${porta}`));
