"use client";

import { useState } from "react";
import clsx from "clsx";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Flame, PlayCircle, Video } from "lucide-react";
import { STATUS_LABEL, isBlocked, type PayStatus } from "@/lib/demo-data";
import { CLASS_STATUS, MONTHS, countByStatus, monthClasses, type ClassStatus, type MonthClass } from "@/lib/demo-classes";
import { PRACTICE, PROFILE_INFO, notebooksFor } from "@/lib/demo-practice";
import { SKILL_LABEL, buildPlan } from "@/lib/demo-placement";
import { Badge, Button, Card, Explain } from "@/components/demo/ui";
import { RecordingPlayer } from "@/components/demo/shared/RecordingPlayer";
import type { TeacherCtx } from "@/components/demo/teacher/types";

const payTone: Record<PayStatus, "ok" | "warn" | "danger"> = { em_dia: "ok", vence_breve: "warn", atrasado: "danger" };
const SUMMARY_ORDER: ClassStatus[] = ["compareceu", "faltou", "cancelada_aluno", "cancelada_prof", "reposicao", "agendada"];

export function StudentDetail({ ctx, studentId, onBack }: { ctx: TeacherCtx; studentId: string; onBack: () => void }) {
  const student = ctx.students.find((s) => s.id === studentId);
  const [monthIndex, setMonthIndex] = useState(1);
  const [recording, setRecording] = useState<MonthClass | null>(null);

  if (!student) return null;

  const month = MONTHS[monthIndex];
  const classes = monthClasses(student.id, student.attendance, month.year, month.month);
  const counts = countByStatus(classes);
  const practice = PRACTICE[student.id];
  const profile = PROFILE_INFO[student.id];
  const plan = buildPlan(student.level, profile.weakest);
  const notebooks = notebooksFor(student.id);
  const blocked = isBlocked(student, ctx.autoBlock);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold underline-offset-2 hover:underline">
          <ArrowLeft className="size-4" aria-hidden /> Voltar
        </button>
        <Button onClick={() => ctx.openClassroom(student.name)}>
          <Video className="size-4" aria-hidden /> Entrar na aula
        </Button>
      </div>

      <Card className="flex flex-wrap items-center gap-4">
        <span className="grid size-16 place-items-center rounded-2xl bg-brand font-display text-2xl font-semibold text-brand-ink">{student.name.charAt(0)}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-semibold sm:text-3xl">{student.name}</h2>
          <p className="text-sm text-muted">
            {student.plan} · contrato até {student.contractUntil}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="brand">Nível {student.level}</Badge>
          <Badge tone={payTone[student.status]}>{STATUS_LABEL[student.status]}</Badge>
          <Badge tone={blocked ? "danger" : "ok"}>{blocked ? "Acesso bloqueado" : "Acesso liberado"}</Badge>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="space-y-5">
          <Explain title="Perfil e plano criados na primeira aula">
            Na primeira aula o aluno faz o <b>nivelamento adaptativo</b>. Com o resultado, a plataforma monta o perfil
            (pontos fortes e o que mais precisa de atenção) e gera um <b>plano de 4 semanas</b> com lições da
            biblioteca no nível dele. Você revisa e ajusta.
          </Explain>
          <Card>
            <h3 className="text-lg font-semibold">Perfil do aluno</h3>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted">Nivelado em</dt>
                <dd className="font-bold">{profile.placedOn}</dd>
              </div>
              <div>
                <dt className="text-muted">Objetivo</dt>
                <dd className="font-bold">{profile.goal}</dd>
              </div>
              <div>
                <dt className="text-muted">Ponto forte</dt>
                <dd className="font-bold text-emerald-700">{SKILL_LABEL[profile.strongest]}</dd>
              </div>
              <div>
                <dt className="text-muted">Precisa de atenção</dt>
                <dd className="font-bold text-amber-700">{SKILL_LABEL[profile.weakest]}</dd>
              </div>
            </dl>
            <h4 className="mt-5 text-sm font-bold">Plano de estudos gerado</h4>
            <ol className="mt-2 space-y-2">
              {plan.map((week) => (
                <li key={week.n} className="rounded-xl bg-cream p-3 text-sm">
                  <p className="font-bold">
                    Semana {week.n}: {week.theme}
                  </p>
                  <p className="text-muted">
                    {week.lessons.join(" · ")} · foco em {SKILL_LABEL[week.focus].toLowerCase()}
                  </p>
                </li>
              ))}
            </ol>
          </Card>

          <Explain title="Prática diária">
            Entre as aulas, o aluno pratica todo dia (revisão espaçada e jogos). Aqui você vê se ele está mantendo o ritmo
            antes mesmo da próxima aula. O ciclo tem 6 dias por semana.
          </Explain>
          <Card>
            <h3 className="text-lg font-semibold">Prática diária</h3>
            <div className="mt-3 flex items-center justify-between text-xs font-bold text-muted">
              <span>Progresso do ciclo</span>
              <span>{practice.cycleDays}/6 dias</span>
            </div>
            <div className="mt-2 flex gap-1.5" role="img" aria-label={`${practice.cycleDays} de 6 dias concluídos neste ciclo`}>
              {[1, 2, 3, 4, 5, 6].map((d) => (
                <div key={d} className={clsx("grid h-9 flex-1 place-items-center rounded-lg border-2 text-xs font-bold", d <= practice.cycleDays ? "border-emerald-500 bg-emerald-500 text-white" : d === practice.cycleDays + 1 ? "border-brand bg-brand-soft" : "border-stone-200 bg-stone-100 text-stone-400")}>
                  {d <= practice.cycleDays ? "✓" : d}
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div className="rounded-xl bg-cream p-3">
                <p className="flex items-center gap-1 font-display text-2xl font-semibold">
                  <Flame className="size-5 text-amber-600" aria-hidden />
                  {practice.streak}
                </p>
                <p className="text-xs text-muted">dias seguidos</p>
              </div>
              <div className="rounded-xl bg-cream p-3">
                <p className="font-display text-2xl font-semibold">{practice.minutesWeek}</p>
                <p className="text-xs text-muted">min na semana</p>
              </div>
              <div className="rounded-xl bg-cream p-3">
                <p className="font-display text-2xl font-semibold">{practice.accuracy}%</p>
                <p className="text-xs text-muted">acertos</p>
              </div>
              <div className="rounded-xl bg-cream p-3">
                <p className="font-display text-2xl font-semibold">{practice.itemsReviewed}</p>
                <p className="text-xs text-muted">itens revisados</p>
              </div>
            </div>
            <p className="mt-4 text-xs font-bold text-muted">Últimos 14 dias</p>
            <div className="mt-1.5 flex gap-1" role="img" aria-label="Atividade dos últimos 14 dias">
              {practice.last14.map((v, i) => (
                <span key={i} className={clsx("h-6 flex-1 rounded", v === 0 && "bg-stone-200", v === 1 && "bg-emerald-200", v === 2 && "bg-emerald-400", v === 3 && "bg-emerald-600")} />
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Explain title="Cadernos">
            Cada aula gera um caderno colaborativo que fica salvo. O aluno revê o que foi feito e você reabre quando
            quiser para continuar de onde pararam.
          </Explain>
          <Card>
            <h3 className="text-lg font-semibold">Cadernos criados</h3>
            <ul className="mt-3 divide-y divide-line">
              {notebooks.map((n) => (
                <li key={n.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft">
                      <BookOpen className="size-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold">{n.title}</p>
                      <p className="text-xs text-muted">
                        {n.date} · {n.kind}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => ctx.openClassroom(student.name, n.title)}>
                    Abrir
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Explain title="Aulas do mês e o que aconteceu em cada uma">
        Veja de relance quem veio, quem faltou e quem cancelou (o aluno ou você). Aulas com gravação podem ser revistas
        com a transcrição, tanto por você quanto pelo aluno, para revisar o conteúdo.
      </Explain>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Aulas do mês</h3>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setMonthIndex(0)} disabled={monthIndex === 0} aria-label="Mês anterior" className="grid size-9 place-items-center rounded-full border border-line disabled:opacity-40">
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <span className="min-w-40 text-center text-sm font-bold">{month.label}</span>
            <button type="button" onClick={() => setMonthIndex(1)} disabled={monthIndex === MONTHS.length - 1} aria-label="Próximo mês" className="grid size-9 place-items-center rounded-full border border-line disabled:opacity-40">
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {SUMMARY_ORDER.filter((s) => counts[s] > 0).map((s) => (
            <Badge key={s} tone={CLASS_STATUS[s].tone}>
              {counts[s]} · {CLASS_STATUS[s].label}
            </Badge>
          ))}
        </div>

        <ul className="mt-4 divide-y divide-line">
          {classes.map((c) => (
            <li key={c.id} className={clsx("flex flex-wrap items-center justify-between gap-3 py-3", c.isToday && "rounded-xl bg-brand-soft px-3")}>
              <div className="flex items-center gap-4">
                <div className="w-20 text-sm">
                  <p className="font-bold">
                    {c.weekday}, {c.date}
                  </p>
                  <p className="text-muted">{c.time}</p>
                </div>
                <p className="text-sm font-semibold">{c.topic}</p>
              </div>
              <div className="flex items-center gap-2">
                {c.isToday && <Badge tone="brand">Hoje</Badge>}
                <Badge tone={CLASS_STATUS[c.status].tone}>{CLASS_STATUS[c.status].label}</Badge>
                {c.recorded && (
                  <Button variant="ghost" onClick={() => setRecording(c)}>
                    <PlayCircle className="size-4" aria-hidden /> Gravação
                  </Button>
                )}
              </div>
            </li>
          ))}
          {classes.length === 0 && <li className="py-6 text-center text-sm text-muted">Sem aulas neste mês.</li>}
        </ul>
      </Card>

      <RecordingPlayer open={Boolean(recording)} onClose={() => setRecording(null)} when={recording ? `${recording.weekday}, ${recording.date} · ${recording.time}` : ""} onSave={ctx.notify} />
    </>
  );
}
