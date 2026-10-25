import { Redis } from "@upstash/redis";
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});
/* Preços (em reais) definidos SEMPRE aqui, no servidor. Mantenha igual ao public/index.html */
export const PLANS = { "Inicial": 9.9, "Básico": 19.9, "Completo": 29.9, "VIP": 49.9, "Chamada de vídeo": 69.9 };
export const ID = /^[a-f0-9]{24}$/;
