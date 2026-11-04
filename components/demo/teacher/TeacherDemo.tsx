"use client";

import { useState, type CSSProperties } from "react";
import clsx from "clsx";
import { CreditCard, FileText, Gauge, LayoutDashboard, Library, Palette, Users, Video, type LucideIcon } from "lucide-react";
import { STUDENTS, type Student } from "@/lib/demo-data";
import { inkFor } from "@/lib/format";
import { ExplainProvider, Switch, useToast } from "@/components/demo/ui";
import { Billing } from "@/components/demo/teacher/Billing";
import { BrandStudio } from "@/components/demo/teacher/BrandStudio";
import { Classes } from "@/components/demo/teacher/Classes";
import { Contracts } from "@/components/demo/teacher/Contracts";
import { LibrarySection } from "@/components/demo/teacher/LibrarySection";
import { Overview } from "@/components/demo/teacher/Overview";
import { Students } from "@/components/demo/teacher/Students";
import { Usage } from "@/components/demo/teacher/Usage";
import type { Brand, TeacherCtx } from "@/components/demo/teacher/types";

const TABS = [
  { id: "visao", label: "Visão geral", icon: LayoutDashboard },
  { id: "alunos", label: "Alunos", icon: Users },
  { id: "cobrancas", label: "Cobranças", icon: CreditCard },
  { id: "contratos", label: "Contratos", icon: FileText },
  { id: "aulas", label: "Aulas e agenda", icon: Video },
  { id: "biblioteca", label: "Cursos e biblioteca", icon: Library },
  { id: "marca", label: "Minha marca", icon: Palette },
  { id: "plano", label: "Plano e uso", icon: Gauge },
] as const satisfies readonly { id: string; label: string; icon: LucideIcon }[];

type TabId = (typeof TABS)[number]["id"];

function isTab(value: string | undefined): value is TabId {
  return TABS.some((t) => t.id === value);
}

export function TeacherDemo({ initialTab }: { initialTab?: string }) {
  const [tab, setTab] = useState<TabId>(isTab(initialTab) ? initialTab : "visao");
  const [students, setStudents] = useState<Student[]>(STUDENTS);
  const [autoBlock, setAutoBlock] = useState(true);
  const [brand, setBrand] = useState<Brand>({ name: "Inglês com a Ana", color: "#187066", slug: "ana" });
  const [explain, setExplain] = useState(true);
  const { notify, toast } = useToast();

  const ctx: TeacherCtx = {
    students,
    markPaid: (id) => setStudents((list) => list.map((s) => (s.id === id ? { ...s, status: "em_dia" } : s))),
    autoBlock,
    setAutoBlock,
    brand,
    setBrand,
    notify,
  };

  const style = { "--brand": brand.color, "--brand-ink": inkFor(brand.color) } as CSSProperties;

  return (
    <ExplainProvider value={explain}>
      <div style={style} className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink px-5 py-3 text-sm text-cream">
          <p>
            <strong>Demonstração navegável.</strong> Todos os nomes e valores são fictícios. Clique, teste e explore.
          </p>
          <label className="flex items-center gap-3 font-bold">
            Mostrar explicações
            <Switch checked={explain} onChange={setExplain} label="Mostrar explicações" />
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-5 lg:flex-row">
          <nav aria-label="Seções do painel" className="lg:w-64 lg:shrink-0">
            <div className="mb-3 hidden items-center gap-3 rounded-2xl border border-line bg-card p-4 lg:flex">
              <span className="grid size-11 place-items-center rounded-xl bg-brand font-display text-lg font-semibold text-brand-ink">
                {brand.name.trim().charAt(0).toUpperCase() || "?"}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display font-semibold leading-tight">{brand.name || "Sua escola"}</p>
                <p className="text-xs text-muted">Painel do professor</p>
              </div>
            </div>
            <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {TABS.map(({ id, label, icon: Icon }) => (
                <li key={id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setTab(id)}
                    aria-current={tab === id ? "page" : undefined}
                    className={clsx(
                      "flex w-full items-center gap-3 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-bold transition",
                      tab === id ? "bg-brand text-brand-ink" : "bg-card text-ink hover:bg-brand-soft lg:bg-transparent",
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <main className="min-w-0 flex-1 space-y-5">
            {tab === "visao" && <Overview ctx={ctx} onGo={(id) => setTab(id)} />}
            {tab === "alunos" && <Students ctx={ctx} />}
            {tab === "cobrancas" && <Billing ctx={ctx} />}
            {tab === "contratos" && <Contracts ctx={ctx} />}
            {tab === "aulas" && <Classes ctx={ctx} />}
            {tab === "biblioteca" && <LibrarySection ctx={ctx} />}
            {tab === "marca" && <BrandStudio ctx={ctx} />}
            {tab === "plano" && <Usage ctx={ctx} />}
          </main>
        </div>
      </div>
      {toast}
    </ExplainProvider>
  );
}
