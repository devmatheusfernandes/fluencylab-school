"use client";

import { Lock, LockOpen } from "lucide-react";
import { STATUS_LABEL, isBlocked, type PayStatus } from "@/lib/demo-data";
import { brl } from "@/lib/format";
import { Badge, Card, Explain, SectionHead } from "@/components/demo/ui";
import type { TeacherCtx } from "@/components/demo/teacher/types";

const tone: Record<PayStatus, "ok" | "warn" | "danger"> = { em_dia: "ok", vence_breve: "warn", atrasado: "danger" };

export function Students({ ctx }: { ctx: TeacherCtx }) {
  return (
    <>
      <SectionHead title="Alunos" text="Todos os seus alunos, o que cada um paga e quem está com o acesso liberado." />
      <Explain title="Bloqueio automático por inadimplência">
        Quando uma mensalidade atrasa, o acesso do aluno às aulas e ao conteúdo é suspenso <b>automaticamente</b> e volta
        assim que ele paga. Você não precisa cobrar nem bloquear manualmente. Veja os alunos em atraso na lista abaixo.
        (Dá para desligar essa política em <b>Cobranças</b>.) Clique no nome de um aluno para abrir a página dele, com
        perfil, plano, cadernos, prática diária e aulas do mês.
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
                    <button type="button" onClick={() => ctx.openStudent(s.id)} className="font-bold underline-offset-2 hover:underline">
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
    </>
  );
}
