"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Bookmark, BookmarkCheck, Pause, Play, RotateCcw } from "lucide-react";
import { RECORDING, fmtTime } from "@/lib/demo-practice";
import { Modal } from "@/components/demo/ui";

/** Aula gravada para revisão: vídeo simulado, capítulos e transcrição que acompanha o tempo. */
export function RecordingPlayer({ open, onClose, when, onSave }: { open: boolean; onClose: () => void; when: string; onSave?: (text: string) => void }) {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [saved, setSaved] = useState<number[]>([]);

  const ended = time >= RECORDING.duration;

  useEffect(() => {
    if (!open || !playing) return;
    const id = setInterval(() => setTime((t) => Math.min(RECORDING.duration, t + speed)), 1000);
    return () => clearInterval(id);
  }, [open, playing, speed]);

  const activeIndex = RECORDING.lines.reduce((acc, line, i) => (line.t <= time ? i : acc), 0);
  const chapter = [...RECORDING.chapters].reverse().find((c) => c.t <= time) ?? RECORDING.chapters[0];

  function close() {
    setPlaying(false);
    onClose();
  }

  return (
    <Modal open={open} onClose={close} title={`Aula gravada · ${RECORDING.title}`} wide>
      <p className="-mt-2 mb-4 text-sm text-muted">{when} · trecho de demonstração</p>

      <div className="overflow-hidden rounded-2xl bg-ink text-cream">
        <div className="relative grid aspect-video place-items-center">
          <div className="grid grid-cols-2 gap-6">
            <span className="grid size-20 place-items-center rounded-full bg-brand font-display text-2xl font-semibold text-brand-ink">A</span>
            <span className="grid size-20 place-items-center rounded-full bg-amber font-display text-2xl font-semibold text-ink">B</span>
          </div>
          <span className="absolute left-3 top-3 rounded-full bg-black/50 px-3 py-1 text-xs font-bold">{chapter.label}</span>
          <p className="absolute inset-x-4 bottom-3 rounded-lg bg-black/60 px-3 py-2 text-center text-sm" aria-live="off">
            {RECORDING.lines[activeIndex].text}
          </p>
        </div>
        <div className="space-y-3 px-4 py-3">
          <input
            type="range"
            min={0}
            max={RECORDING.duration}
            value={time}
            onChange={(e) => setTime(Number(e.target.value))}
            aria-label="Posição da aula"
            className="w-full accent-amber"
          />
          <div className="flex items-center justify-between gap-3 text-sm">
            <button
              type="button"
              onClick={() => {
                if (ended) setTime(0);
                setPlaying(!playing || ended);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-amber px-4 py-2 font-bold text-ink"
            >
              {ended ? <RotateCcw className="size-4" aria-hidden /> : playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
              {ended ? "Rever" : playing ? "Pausar" : "Reproduzir"}
            </button>
            <span className="tabular-nums">
              {fmtTime(time)} / {fmtTime(RECORDING.duration)}
            </span>
            <div className="flex gap-1" role="group" aria-label="Velocidade">
              {[1, 1.5, 2].map((s) => (
                <button key={s} type="button" onClick={() => setSpeed(s)} aria-pressed={speed === s} className={clsx("rounded-full px-3 py-1 text-xs font-bold", speed === s ? "bg-cream text-ink" : "bg-white/10")}>
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1.6fr]">
        <div>
          <p className="mb-2 text-sm font-bold">Capítulos</p>
          <ul className="space-y-1.5">
            {RECORDING.chapters.map((c) => (
              <li key={c.t}>
                <button type="button" onClick={() => setTime(c.t)} className={clsx("flex w-full justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-cream", chapter.t === c.t && "bg-brand-soft font-bold")}>
                  <span>{c.label}</span>
                  <span className="text-muted">{fmtTime(c.t)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-sm font-bold">Transcrição</p>
          <ul className="max-h-56 space-y-1 overflow-y-auto rounded-xl bg-cream p-2">
            {RECORDING.lines.map((line, i) => {
              const isSaved = saved.includes(i);
              return (
                <li key={line.t} className={clsx("flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm", i === activeIndex && "bg-card font-semibold shadow-sm")}>
                  <button type="button" onClick={() => setTime(line.t)} className="flex-1 text-left">
                    <span className="mr-2 text-xs text-muted">{fmtTime(line.t)}</span>
                    <b>{line.who}:</b> {line.text}
                  </button>
                  <button
                    type="button"
                    aria-label={isSaved ? "Remover do caderno" : "Salvar frase no caderno"}
                    aria-pressed={isSaved}
                    onClick={() => {
                      setSaved((s) => (isSaved ? s.filter((x) => x !== i) : [...s, i]));
                      if (!isSaved) onSave?.("Frase salva no caderno e enviada para a revisão espaçada.");
                    }}
                    className="mt-0.5 shrink-0 text-muted hover:text-ink"
                  >
                    {isSaved ? <BookmarkCheck className="size-4 text-brand" aria-hidden /> : <Bookmark className="size-4" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Modal>
  );
}
