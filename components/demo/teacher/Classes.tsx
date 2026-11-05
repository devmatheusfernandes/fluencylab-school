"use client";

import { useState } from "react";
import { PlayCircle, Video } from "lucide-react";
import { PAST_LESSONS, WEEK_LESSONS } from "@/lib/demo-data";
import { Badge, Button, Card, Explain, SectionHead } from "@/components/demo/ui";
import { RecordingPlayer } from "@/components/demo/shared/RecordingPlayer";
import type { TeacherCtx } from "@/components/demo/teacher/types";

export function Classes({ ctx }: { ctx: TeacherCtx }) {
  const [recording, setRecording] = useState<string | null>(null);

  return (
    <>
      <SectionHead title="Aulas e agenda" text="Agenda da semana, sala de aula e aulas gravadas." />
      <Explain title="A aula acontece dentro do caderno">
        A sala de aula junta, na mesma tela, o <b>caderno colaborativo</b> e o <b>vídeo</b>. Professor e aluno escrevem no
        mesmo documento ao mesmo tempo e podem inserir dinâmicas nele (quiz, lacunas, combinar pares, escrita em dupla,
        exercício gerado por IA). Clique em <b>Entrar na aula</b>. Clique no <b>nome de um aluno</b> para abrir a página dele.
      </Explain>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <h3 className="text-lg font-semibold">Agenda da semana</h3>
          <ul className="mt-4 divide-y divide-line">
            {WEEK_LESSONS.map((l, index) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-4">
                  <div className="w-24 text-sm">
                    <p className="font-bold">{l.day}</p>
                    <p className="text-muted">{l.time}</p>
                  </div>
                  <div>
                    <button type="button" onClick={() => ctx.openStudent(l.studentId)} className="font-bold underline decoration-line underline-offset-4 hover:decoration-ink">
                      {l.student}
                    </button>
                    <p className="text-sm text-muted">{l.topic}</p>
                  </div>
                </div>
                {index === 0 ? (
                  <Button onClick={() => ctx.openClassroom(l.student)}>
                    <Video className="size-4" aria-hidden /> Entrar na aula
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={() => ctx.notify("Na plataforma, aluno e professor reagendam sem trocar mensagens.")}>
                    Reagendar
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold">Aulas gravadas</h3>
          <p className="mt-1 text-sm text-muted">Revise o que foi dito, com transcrição.</p>
          <ul className="mt-4 space-y-3">
            {PAST_LESSONS.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-line p-4">
                <div>
                  <p className="font-bold">{p.student}</p>
                  <p className="text-sm text-muted">
                    {p.when} · {p.topic}
                  </p>
                </div>
                <button type="button" onClick={() => setRecording(p.when)} className="inline-flex items-center gap-1.5 text-sm font-bold">
                  <PlayCircle className="size-5" aria-hidden />
                  <Badge tone="brand">Assistir</Badge>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <RecordingPlayer open={Boolean(recording)} onClose={() => setRecording(null)} when={recording ?? ""} onSave={ctx.notify} />
    </>
  );
}
