import { redis, ID } from "../lib/shared.js";
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { id, contact } = req.body || {};
  if (!ID.test(String(id)) || typeof contact !== "string" || !contact.trim()) return res.status(400).end();
  const tx = await redis.get(`tx:${id}`);
  if (!tx || tx.status !== "paid" || tx.contact) return res.status(403).end();
  await redis.set(`tx:${id}`, { ...tx, contact: contact.trim().slice(0, 120) });
  res.status(200).json({ ok: true });
}
