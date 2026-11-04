"use client";

import { ArrowRight } from "lucide-react";
import { WEEK_LESSONS } from "@/lib/demo-data";
import { brl } from "@/lib/format";
import { Card, Explain, SectionHead } from "@/components/demo/ui";
import type { TeacherCtx } from "@/components/demo/teacher/types";

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const compact = (value: number) => `${(value / 1000).toFixed(1).replace(".", ",")} mil`;

export function Overview({ ctx, onGo }: { ctx: TeacherCtx; onGo: (tab: "alunos" | "cobrancas" | "aulas") => void }) {
  const { students } = ctx;
  const received = sum(students.filter((s) => s.status === "em_dia").map((s) => s.price));
  const upcoming = sum(students.filter((s) => s.status === "vence_breve").map((s) => s.price));
  const late = sum(students.filter((s) => s.status === "atrasado").map((s) => s.price));
  const history = [
    { m: "Jun", v: 1480 },
    { m: "Jul", v: 1720 },
    { m: "Ago", v: 1960 },
    { m: "Set", v: 2210 },
    { m: "Out", v: 2480 },
    { m: "Nov", v: received },
  ];
  const max = Math.max(...history.map((h) => h.v), received + upcoming + late);

  const kpis = [
    { label: "Alunos ativos", value: String(students.length), tone: "text-ink" },
    { label: "Recebido no mês", value: brl(received), tone: "text-emerald-700" },
    { label: "A receber", value: brl(upcoming), tone: "text-amber-700" },
    { label: "Em atraso", value: brl(late), tone: "text-red-700" },
  ];

  return (
    <>
      <SectionHead title="Visão geral" text="O resumo da sua escola, sem planilha." />
      <Explain title="Para que serve">
        Em uma tela, você vê quanto já recebeu, quanto ainda vai receber e quem está atrasado. Os números se atualizam
        sozinhos conforme os alunos pagam. Experimente: vá em <b>Cobranças</b>, simule um pagamento e volte aqui.
      </Explain>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <p className="text-sm text-muted">{k.label}</p>
            <p className={`mt-1 font-display text-3xl font-semibold ${k.tone}`}>{k.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <h3 className="text-lg font-semibold">Recebimentos por mês</h3>
          <div className="mt-5 flex h-52 items-end gap-1.5 sm:gap-3" role="img" aria-label="Gráfico de barras de recebimentos dos últimos seis meses">
            {history.map((h, i) => (
              <div key={h.m} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <span className="whitespace-nowrap text-[11px] font-bold text-muted sm:text-xs">{compact(h.v)}</span>
                <div
                  className={i === history.length - 1 ? "w-full rounded-t-lg bg-brand" : "w-full rounded-t-lg bg-stone-300"}
                  style={{ height: `${Math.max(6, (h.v / max) * 150)}px` }}
                />
                <span className="text-xs font-bold">{h.m}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold">Aulas desta semana</h3>
          <ul className="mt-4 space-y-3">
            {WEEK_LESSONS.slice(0, 4).map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 rounded-xl bg-cream px-4 py-3 text-sm">
                <div>
                  <p className="font-bold">{l.student}</p>
                  <p className="text-muted">{l.topic}</p>
                </div>
                <span className="whitespace-nowrap font-bold">
                  {l.day.slice(0, 3)} {l.time}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold">
            <button type="button" onClick={() => onGo("aulas")} className="inline-flex items-center gap-1 underline">
              Ver agenda <ArrowRight className="size-4" aria-hidden />
            </button>
            <button type="button" onClick={() => onGo("alunos")} className="inline-flex items-center gap-1 underline">
              Ver alunos <ArrowRight className="size-4" aria-hidden />
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}
