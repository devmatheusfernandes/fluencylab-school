"use client";

import { useEffect, useState } from "react";
import { Mic, PhoneOff, Video, VideoOff } from "lucide-react";
import { LIVE_CAPTIONS, PAST_LESSONS, WEEK_LESSONS } from "@/lib/demo-data";
import { Badge, Button, Card, Explain, Modal, SectionHead } from "@/components/demo/ui";
import type { TeacherCtx } from "@/components/demo/teacher/types";

function VideoRoom({ onEnd, teacherName }: { onEnd: () => void; teacherName: string }) {
  const [shown, setShown] = useState(1);

  useEffect(() => {
    const id = setInterval(() => setShown((n) => Math.min(LIVE_CAPTIONS.length, n + 1)), 1800);
    return () => clearInterval(id);
  }, []);

  const lines = LIVE_CAPTIONS.slice(0, shown);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { name: teacherName, initial: teacherName.charAt(0) },
          { name: "Beatriz Lima", initial: "B" },
        ].map((p) => (
          <div key={p.name} className="relative grid aspect-video place-items-center rounded-2xl bg-ink">
            <span className="grid size-16 place-items-center rounded-full bg-brand font-display text-2xl font-semibold text-brand-ink">{p.initial}</span>
            <span className="absolute bottom-2 left-3 rounded-full bg-black/50 px-2.5 py-0.5 text-xs font-bold text-white">{p.name}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-bold">
          <span className="size-2.5 animate-pulse rounded-full bg-red-600" aria-hidden />
          Gravando e transcrevendo
        </span>
        <div className="flex gap-2" aria-hidden>
          <span className="grid size-10 place-items-center rounded-full border border-line">
            <Mic className="size-4" />
          </span>
          <span className="grid size-10 place-items-center rounded-full border border-line">
            <VideoOff className="size-4" />
          </span>
        </div>
      </div>

      <div className="min-h-32 rounded-2xl bg-cream p-4" aria-live="polite">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Legenda ao vivo (exemplo)</p>
        <ul className="space-y-1.5 text-sm">
          {lines.map((l, i) => (
            <li key={i}>
              <b>{l.who}:</b> {l.text}
            </li>
          ))}
        </ul>
      </div>

      <Button variant="danger" onClick={onEnd} className="w-full">
        <PhoneOff className="size-4" aria-hidden /> Encerrar aula
      </Button>
    </div>
  );
}

export function Classes({ ctx }: { ctx: TeacherCtx }) {
  const [inCall, setInCall] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <SectionHead title="Aulas e agenda" text="Agenda da semana, videoaula e transcrição no mesmo lugar." />
      <Explain title="Videoaula sem link externo">
        O aluno entra na aula pela própria plataforma, sem precisar de outro aplicativo. A aula pode ser gravada e
        transcrita, e a transcrição fica salva para você revisar o que foi dito e corrigir erros com calma. Clique em{" "}
        <b>Entrar na aula</b> para ver uma sala de exemplo com legenda ao vivo.
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
                    <p className="font-bold">{l.student}</p>
                    <p className="text-sm text-muted">{l.topic}</p>
                  </div>
                </div>
                {index === 0 ? (
                  <Button onClick={() => setInCall(true)}>
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
          <ul className="mt-4 space-y-3">
            {PAST_LESSONS.map((p) => {
              const open = openId === p.id;
              return (
                <li key={p.id} className="rounded-xl border border-line">
                  <button type="button" onClick={() => setOpenId(open ? null : p.id)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                    <div>
                      <p className="font-bold">{p.student}</p>
                      <p className="text-sm text-muted">
                        {p.when} · {p.topic}
                      </p>
                    </div>
                    <Badge tone="brand">{open ? "Ocultar" : "Ver transcrição"}</Badge>
                  </button>
                  {open && (
                    <ul className="space-y-1.5 border-t border-line bg-cream/60 p-4 text-sm">
                      {p.excerpt.map((line, i) => (
                        <li key={i}>
                          <b>{line.who}:</b> {line.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Modal
        open={inCall}
        onClose={() => setInCall(false)}
        title="Sala de aula (exemplo)"
        wide
      >
        <VideoRoom
          teacherName={ctx.brand.name.split(" ").pop() ?? "Prof."}
          onEnd={() => {
            setInCall(false);
            ctx.notify("Aula encerrada. A transcrição fica disponível em alguns minutos.");
          }}
        />
      </Modal>
    </>
  );
}
