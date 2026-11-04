"use client";

import { PRICING, SHOW_PRICING } from "@/lib/config";
import { brl } from "@/lib/format";
import { Button, Card, Explain, Meter, SectionHead } from "@/components/demo/ui";
import type { TeacherCtx } from "@/components/demo/teacher/types";

export function Usage({ ctx }: { ctx: TeacherCtx }) {
  const count = ctx.students.length;

  return (
    <>
      <SectionHead title="Plano e uso" text="Acompanhe o que a sua escola está usando." />
      <Explain title="Você paga pelo uso">
        A plataforma cobra uma mensalidade pelo uso e um valor por <b>aluno ativo</b>, então o custo cresce junto com a
        sua escola. Videoaulas não têm limite de minutos. Recursos de inteligência artificial e armazenamento extra têm
        cota, e você pode contratar mais quando precisar.
      </Explain>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="space-y-6">
          <Meter label="Alunos ativos" value={count} max={Math.max(count, 20)} hint="Cobrado por aluno ativo no mês." />
          <Meter label="Créditos de IA" value={38} max={100} hint="Correção de exercícios e resumos de aula." />
          <Meter label="Armazenamento" value={2.1} max={10} unit="GB" hint="Cursos criados por você." />
          <div className="flex items-center justify-between rounded-xl bg-cream px-4 py-3 text-sm">
            <span className="font-bold">Videoaulas</span>
            <span className="font-bold text-emerald-800">Sem limite</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" onClick={() => ctx.notify("Aqui você compraria mais créditos de IA.")}>
              Comprar créditos de IA
            </Button>
            <Button variant="ghost" onClick={() => ctx.notify("Aqui você contrataria mais espaço.")}>
              Contratar espaço
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold">Sua mensalidade da plataforma</h3>
          {SHOW_PRICING ? (
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt>Mensalidade fixa</dt>
                <dd className="font-bold">{brl(PRICING.base)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>
                  {count} alunos ativos × {brl(PRICING.perStudent)}
                </dt>
                <dd className="font-bold">{brl(count * PRICING.perStudent)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base">
                <dt className="font-bold">Total no mês</dt>
                <dd className="font-display text-2xl font-semibold">{brl(PRICING.base + count * PRICING.perStudent)}</dd>
              </div>
              <p className="text-xs text-muted">Proposta inicial, em teste.</p>
            </dl>
          ) : (
            <p className="mt-4 rounded-xl bg-cream p-4 text-sm leading-relaxed text-muted">
              Os valores serão definidos com a ajuda dos professores da lista de espera. Quem entrar primeiro garante
              condição especial de lançamento.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
