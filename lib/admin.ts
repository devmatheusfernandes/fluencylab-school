import { timingSafeEqual } from "node:crypto";

/** Confere a chave do painel (ADMIN_KEY) sem vazar informação por tempo de resposta. */
export function isAdmin(key: string | null | undefined): boolean {
  const expected = process.env.ADMIN_KEY;
  if (!expected || !key) return false;
  const a = Buffer.from(key);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
