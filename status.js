import { redis, ID } from "../lib/shared.js";
export default async function handler(req, res) {
  const id = String(req.query.id || "");
  if (!ID.test(id)) return res.status(400).end();
  const tx = await redis.get(`tx:${id}`);
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ status: tx?.status || "unknown" });
}
