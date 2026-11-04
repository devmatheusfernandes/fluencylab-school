import Link from "next/link";
import { Logo } from "@/components/site/Header";

export function Footer() {
  return (
    <footer className="bg-ink text-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-3">
          <Logo light />
          <p className="text-sm leading-relaxed text-cream/70">
            Plataforma em construção para professores de idiomas independentes. As telas das demos usam dados fictícios.
          </p>
        </div>
        <nav className="flex flex-col gap-2 text-sm font-semibold" aria-label="Rodapé">
          <Link href="/demo/professor" className="text-cream/80 hover:text-cream">
            Demo do professor
          </Link>
          <Link href="/demo/aluno" className="text-cream/80 hover:text-cream">
            Demo do aluno
          </Link>
          <Link href="/#lista" className="text-cream/80 hover:text-cream">
            Lista de espera
          </Link>
          <Link href="/privacidade" className="text-cream/80 hover:text-cream">
            Privacidade
          </Link>
        </nav>
      </div>
    </footer>
  );
}
