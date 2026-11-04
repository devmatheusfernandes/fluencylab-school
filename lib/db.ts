import { neon } from "@neondatabase/serverless";

export type Sql = ReturnType<typeof neon>;

let schemaReady: Promise<void> | null = null;

/**
 * Retorna o cliente SQL ou null se não houver WAITLIST_DATABASE_URL (ex.: desenvolvimento local).
 *
 * De propósito NÃO lemos a variável genérica DATABASE_URL: ela costuma existir no computador/ambiente
 * apontando para o banco de OUTRO projeto, e este site criaria tabela e gravaria dados lá.
 * Use um banco Neon exclusivo desta lista de espera.
 */
export function getSql(): Sql | null {
  const url = process.env.WAITLIST_DATABASE_URL;
  return url ? neon(url) : null;
}

/** Cria a tabela da lista de espera na primeira chamada (idempotente). */
export function ensureSchema(sql: Sql): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS waitlist (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          whatsapp TEXT,
          language TEXT NOT NULL,
          students_range TEXT NOT NULL,
          billing JSONB NOT NULL DEFAULT '[]'::jsonb,
          price_intent TEXT NOT NULL,
          main_pain TEXT NOT NULL,
          notes TEXT,
          source TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}
