import Link from "next/link";
import clsx from "clsx";
import { Logo } from "@/components/site/Header";

export function DemoTopBar({ current }: { current: "professor" | "aluno" }) {
  const tab = (id: "professor" | "aluno", label: string) => (
    <Link
      href={`/demo/${id}`}
      aria-current={current === id ? "page" : undefined}
      className={clsx(
        "rounded-full px-4 py-2 text-sm font-bold transition",
        current === id ? "bg-ink text-cream" : "text-ink hover:bg-cream",
      )}
    >
      {label}
    </Link>
  );
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Logo />
        <div className="flex items-center gap-1 rounded-full border border-line p-1" role="navigation" aria-label="Demos">
          {tab("professor", "Visão do professor")}
          {tab("aluno", "Visão do aluno")}
        </div>
        <Link href="/#lista" className="rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-ink hover:brightness-95">
          Entrar na lista de espera
        </Link>
      </div>
    </header>
  );
}
