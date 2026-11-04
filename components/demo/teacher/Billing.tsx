"use client";

import { useEffect, useRef, useState } from "react";
import { BellRing, CheckCircle2, Wallet } from "lucide-react";
import { STATUS_LABEL, isBlocked, type PayStatus, type Student } from "@/lib/demo-data";
import { brl } from "@/lib/format";
import { Badge, Button, Card, Explain, SectionHead, Switch } from "@/components/demo/ui";
import type { TeacherCtx } from "@/components/demo/teacher/types";

const tone: Record<PayStatus, "ok" | "warn" | "danger"> = { em_dia: "ok", vence_breve: "warn", atrasado: "danger" };

export function Billing({ ctx }: { ctx: TeacherCtx }) {
  const [events, setEvents] = useState<{ id: number; text: string }[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  function simulate(student: Student) {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setEvents([]);
    const wasBlocked = isBlocked(student, ctx.autoBlock);
    const steps = [
      `${student.name.split(" ")[0]} pagou o PIX`,
      "Aviso de pagamento recebido pela plataforma",
      "Parcela marcada como paga",
      wasBlocked ? "Acesso do aluno liberado automaticamente" : "Acesso do aluno segue liberado",
      "Recibo enviado por e-mail e notificação",
    ];
    steps.forEach((text, index) => {
      timers.current.push(
        setTimeout(() => {
          setEvents((prev) => [...prev, { id: index, text }]);
          if (index === 2) ctx.markPaid(student.id);
        }, 500 * (index + 1)),
      );
    });
  }

  const open = ctx.students.filter((s) => s.status !== "em_dia");

  return (
    <>
      <SectionHead title="Cobranças" text="Mensalidades, lembretes e a política de atraso, tudo no automático." />
      <Explain title="O dinheiro vai direto para a sua conta">
        A plataforma gera a cobrança por PIX antes do vencimento e envia ao aluno. O pagamento cai na <b>sua conta de
        recebimento</b>, não passa por nós. Você paga apenas o uso da plataforma. Use o botão{" "}
        <b>Simular pagamento PIX</b> para ver o que acontece quando um aluno paga.
      </Explain>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card className="p-0">
          <div className="border-b border-line px-5 py-4">
            <h3 className="text-lg font-semibold">Mensalidades em aberto ({open.length})</h3>
          </div>
          {open.length === 0 ? (
            <div className="flex items-center gap-3 p-6 text-emerald-800">
              <CheckCircle2 className="size-6" aria-hidden />
              <p className="font-bold">Tudo pago neste mês.</p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {open.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="font-bold">{s.name}</p>
                    <p className="text-sm text-muted">
                      {brl(s.price)} · vence dia {s.dueDay}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={tone[s.status]}>{STATUS_LABEL[s.status]}</Badge>
                    <Button onClick={() => simulate(s)}>Simular pagamento PIX</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {events.length > 0 && (
            <div className="border-t border-line bg-cream/60 px-5 py-4" aria-live="polite">
              <p className="mb-3 text-sm font-bold">O que a plataforma faz quando o aluno paga</p>
              <ol className="space-y-2">
                {events.map((e) => (
                  <li key={e.id} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden />
                    {e.text}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card>
            <h3 className="text-lg font-semibold">Política de atraso</h3>
            <div className="mt-4 flex items-start justify-between gap-4">
              <p className="text-sm leading-relaxed">
                <b>Bloquear o acesso automaticamente</b> quando a mensalidade atrasa e liberar ao pagar.
              </p>
              <Switch checked={ctx.autoBlock} onChange={ctx.setAutoBlock} label="Bloquear acesso automaticamente" />
            </div>
            <p className="mt-3 text-xs text-muted">
              {ctx.autoBlock
                ? "Ligado: alunos em atraso ficam sem acesso até pagar. Veja na aba Alunos."
                : "Desligado: você só recebe os lembretes e decide o que fazer."}
            </p>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <BellRing className="size-5 text-brand" aria-hidden />
              <h3 className="text-lg font-semibold">Lembretes automáticos</h3>
            </div>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <b>2 dias antes:</b> e-mail, notificação e WhatsApp.
              </li>
              <li>
                <b>No dia do vencimento:</b> e-mail e notificação.
              </li>
              <li>
                <b>1 dia depois:</b> marca como atrasada e avisa o aluno.
              </li>
            </ul>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <Wallet className="size-5 text-brand" aria-hidden />
              <h3 className="text-lg font-semibold">Conta de recebimento</h3>
            </div>
            <p className="mt-3 text-sm text-muted">
              Conta conectada: <b className="text-ink">••••  4821</b>. As taxas do meio de pagamento (PIX e cartão) são as
              da sua conta.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
