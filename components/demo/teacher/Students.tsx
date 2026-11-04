"use client";

import { useState } from "react";
import { Lock, LockOpen } from "lucide-react";
import { STATUS_LABEL, isBlocked, type PayStatus, type Student } from "@/lib/demo-data";
import { brl } from "@/lib/format";
import { Badge, Button, Card, Explain, Modal, SectionHead } from "@/components/demo/ui";
import type { TeacherCtx } from "@/components/demo/teacher/types";

const tone: Record<PayStatus, "ok" | "warn" | "danger"> = { em_dia: "ok", vence_breve: "warn", atrasado: "danger" };

export function Students({ ctx }: { ctx: TeacherCtx }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected: Student | undefined = ctx.students.find((s) => s.id === selectedId);

  return (
    <>
      <SectionHead title="Alunos" text="Todos os seus alunos, o que cada um paga e quem está com o acesso liberado." />
      <Explain title="Bloqueio automático por inadimplência">
        Quando uma mensalidade atrasa, o acesso do aluno às aulas e ao conteúdo é suspenso <b>automaticamente</b> e volta
        assim que ele paga. Você não precisa cobrar nem bloquear manualmente. Veja o aluno em atraso na lista abaixo e
        clique nele. (Dá para desligar essa política em <b>Cobranças</b>.)
      </Explain>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line bg-cream text-muted">
            <tr>
              {["Aluno", "Nível", "Plano", "Mensalidade", "Pagamento", "Acesso"].map((h) => (
                <th key={h} className="px-4 py-3 font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {ctx.students.map((s) => {
              const blocked = isBlocked(s, ctx.autoBlock);
              return (
                <tr key={s.id} className="hover:bg-cream/60">
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => setSelectedId(s.id)} className="font-bold underline-offset-2 hover:underline">
                      {s.name}
                    </button>
                  </td>
                  <td className="px-4 py-3">{s.level}</td>
                  <td className="px-4 py-3 text-muted">{s.plan}</td>
                  <td className="px-4 py-3">{brl(s.price)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={tone[s.status]}>{STATUS_LABEL[s.status]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {blocked ? (
                      <Badge tone="danger">
                        <Lock className="size-3" aria-hidden /> Bloqueado
                      </Badge>
                    ) : (
                      <Badge tone="ok">
                        <LockOpen className="size-3" aria-hidden /> Liberado
                      </Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Modal open={Boolean(selected)} onClose={() => setSelectedId(null)} title={selected?.name ?? ""}>
        {selected && (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted">Nível</dt>
                <dd className="font-bold">{selected.level}</dd>
              </div>
              <div>
                <dt className="text-muted">Plano</dt>
                <dd className="font-bold">{selected.plan}</dd>
              </div>
              <div>
                <dt className="text-muted">Mensalidade</dt>
                <dd className="font-bold">
                  {brl(selected.price)} · vence dia {selected.dueDay}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Contrato até</dt>
                <dd className="font-bold">{selected.contractUntil}</dd>
              </div>
            </dl>
            <div>
              <div className="flex justify-between text-sm">
                <span className="font-bold">Presença</span>
                <span>{selected.attendance}%</span>
              </div>
              <div className="mt-1.5 h-2.5 rounded-full bg-stone-200">
                <div className="h-2.5 rounded-full bg-brand" style={{ width: `${selected.attendance}%` }} />
              </div>
            </div>
            <div className="rounded-xl bg-cream p-4 text-sm">
              <p className="font-bold">Próximo foco</p>
              <p className="mt-1 text-muted">{selected.note}</p>
            </div>
            {isBlocked(selected, ctx.autoBlock) ? (
              <div className="space-y-3 rounded-xl bg-red-50 p-4 text-sm text-red-900">
                <p className="font-bold">Acesso bloqueado automaticamente por atraso.</p>
                <Button
                  onClick={() => {
                    ctx.markPaid(selected.id);
                    ctx.notify(`Pagamento registrado. Acesso de ${selected.name.split(" ")[0]} liberado.`);
                  }}
                >
                  Registrar pagamento manual
                </Button>
              </div>
            ) : (
              <p className="rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900">Acesso liberado.</p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
