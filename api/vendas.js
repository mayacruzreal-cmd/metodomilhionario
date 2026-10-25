import { redis } from "../lib/shared.js";
/* Lista de vendas pagas: abra /api/vendas?key=SUA_ADMIN_KEY */
export default async function handler(req, res) {
  if (!process.env.ADMIN_KEY || req.query.key !== process.env.ADMIN_KEY) return res.status(401).json({ error: "não autorizado" });
  const ids = await redis.smembers("paid");
  const rows = (await Promise.all(ids.map((i) => redis.get(`tx:${i}`)))).filter(Boolean)
    .map((t) => ({ plano: t.plan, valor: t.amount, contato: t.contact || null, pagoEm: t.paidAt }))
    .sort((a, b) => String(b.pagoEm).localeCompare(String(a.pagoEm)));
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json(rows);
}
