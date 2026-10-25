import { randomBytes } from "node:crypto";
import { redis, PLANS } from "../lib/shared.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const plan = req.body?.plan;
  const amount = PLANS[plan];
  if (!amount) return res.status(400).json({ error: "plano inválido" });
  const id = randomBytes(12).toString("hex");
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  try {
    const r = await fetch("https://app.omegapayments.com.br/api/v1/gateway/pix/receive", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-public-key": process.env.OMEGA_PUBLIC_KEY,
        "x-secret-key": process.env.OMEGA_SECRET_KEY,
      },
      body: JSON.stringify({
        identifier: id,
        amount,
        client: { name: "Cliente WhatsApp", email: `cliente.${id}@example.com`, phone: "(11) 99999-9999" },
        products: [{ id: plan, name: plan, quantity: 1, price: amount }],
        callbackUrl: `https://${host}/api/webhook`,
      }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.pix?.code) {
      console.error("OmegaPay recusou a cobrança", r.status, d.errorCode, d.message);
      return res.status(502).json({ error: "falha ao gerar o Pix" });
    }
    await redis.set(`tx:${id}`, { plan, amount, status: "pending", webhookToken: d.webhookToken || null, transactionId: d.transactionId }, { ex: 60 * 60 * 24 * 7 });
    res.status(200).json({ id, code: d.pix.code, expiresAt: d.pix.expiresAt });
  } catch (e) {
    console.error("erro ao criar Pix", e.message);
    res.status(502).json({ error: "falha ao gerar o Pix" });
  }
}
