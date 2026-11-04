import Link from "next/link";
import { GraduationCap, Menu } from "lucide-react";
import { PRODUCT_NAME } from "@/lib/config";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={`${PRODUCT_NAME} · página inicial`}>
      <span className="grid size-9 place-items-center rounded-xl bg-amber text-ink">
        <GraduationCap className="size-5" aria-hidden />
      </span>
      <span className={`font-display text-lg font-semibold ${light ? "text-cream" : "text-ink"}`}>{PRODUCT_NAME}</span>
    </Link>
  );
}

const links = [
  { href: "/#recursos", label: "Recursos" },
  { href: "/demo/professor", label: "Demo do professor" },
  { href: "/demo/aluno", label: "Demo do aluno" },
  { href: "/#faq", label: "Dúvidas" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-semibold text-ink/80 md:flex" aria-label="Principal">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/#lista"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-cream transition hover:bg-ink-2"
          >
            Entrar na lista
          </Link>
          <details className="relative md:hidden">
            <summary
              className="grid size-10 cursor-pointer list-none place-items-center rounded-full border border-line bg-card"
              aria-label="Abrir menu"
            >
              <Menu className="size-5" aria-hidden />
            </summary>
            <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-line bg-card p-2 shadow-xl">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="block rounded-xl px-4 py-3 text-sm font-semibold hover:bg-cream">
                  {l.label}
                </Link>
              ))}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
