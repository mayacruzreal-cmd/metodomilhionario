import { timingSafeEqual } from "node:crypto";
import { redis } from "../lib/shared.js";

const eq = (a, b) => {
  a = Buffer.from(String(a || "")); b = Buffer.from(String(b || ""));
  return a.length === b.length && timingSafeEqual(a, b);
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const b = req.body || {};
  const id = b?.transaction?.identifier;
  if (typeof id !== "string" || typeof b.event !== "string") return res.status(400).end();
  if (!["TRANSACTION_PAID", "TRANSACTION_CANCELED"].includes(b.event)) return res.status(200).json({ ignored: true });

  const key = `tx:${id}`;
  const tx = await redis.get(key);
  if (!tx) return res.status(404).end();
  /* valida o token ANTES de qualquer efeito: o da transação (webhookToken) ou o fixo do painel */
  const ok = eq(b.token, tx.webhookToken) || (process.env.GATEWAY_WEBHOOK_TOKEN && eq(b.token, process.env.GATEWAY_WEBHOOK_TOKEN));
  if (!ok) return res.status(401).end();

  if (b.event === "TRANSACTION_PAID" && tx.status !== "paid") {
    await redis.set(key, { ...tx, status: "paid", paidAt: b.transaction.payedAt || new Date().toISOString() });
    await redis.sadd("paid", id);
  } else if (b.event === "TRANSACTION_CANCELED" && tx.status === "pending") {
    await redis.set(key, { ...tx, status: "canceled" }, { ex: 60 * 60 * 24 });
  }
  res.status(200).json({ ok: true });
}
