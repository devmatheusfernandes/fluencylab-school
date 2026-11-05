"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { AlertTriangle, CheckCircle2, Loader2, Lock, Plus, Sparkles } from "lucide-react";
import { AI_CHECKS, LESSONS, READY_NOTEBOOKS, SAMPLE_MATERIAL, lessonTitle } from "@/lib/demo-library";
import { Badge, Button, Card, Explain, Meter, SectionHead } from "@/components/demo/ui";
import type { TeacherCtx } from "@/components/demo/teacher/types";

type View = "licoes" | "cadernos" | "meus";
type Own = { id: string; title: string; level: string; size: string };

const LEVELS = ["Todos", "A1", "A2", "B1", "B2", "C1"] as const;

function QualityReview({ onPublished, notify }: { onPublished: (item: Own) => void; notify: (m: string) => void }) {
  const [title, setTitle] = useState("Falando sobre gostos");
  const [level, setLevel] = useState("A2");
  const [text, setText] = useState(SAMPLE_MATERIAL);
  const [shown, setShown] = useState(-1);
  const [applied, setApplied] = useState<string[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const running = shown >= 0 && shown < AI_CHECKS.length;
  const done = shown >= AI_CHECKS.length;
  const pendingFixes = AI_CHECKS.filter((c) => c.result === "ajuste" && !applied.includes(c.id));

  function start() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setApplied([]);
    setShown(0);
    AI_CHECKS.forEach((_, i) => {
      timers.current.push(setTimeout(() => setShown(i + 1), 750 * (i + 1)));
    });
  }

  function applyFix(id: string) {
    const check = AI_CHECKS.find((c) => c.id === id);
    if (!check?.fix) return;
    setText((t) => t.replace(check.fix!.from, check.fix!.to));
    setApplied((a) => [...a, id]);
  }

  function publish() {
    onPublished({ id: `own-${Date.now()}`, title: title.trim() || "Material sem título", level, size: "0,1 GB" });
    notify("Material aprovado pela revisão de IA e publicado na sua biblioteca.");
    setShown(-1);
    setApplied([]);
    setText(SAMPLE_MATERIAL);
  }

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Criar um material</h3>
        <p className="mt-1 text-sm text-muted">Escreva o seu caderno ou apostila e envie para a revisão de qualidade antes de usar com os alunos.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px]">
        <div>
          <label htmlFor="mat-title" className="mb-1 block text-sm font-bold">
            Título
          </label>
          <input id="mat-title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border border-line bg-card px-4 py-2.5 focus:border-ink focus:outline-none focus:ring-2 focus:ring-amber/60" />
        </div>
        <div>
          <label htmlFor="mat-level" className="mb-1 block text-sm font-bold">
            Nível
          </label>
          <select id="mat-level" value={level} onChange={(e) => setLevel(e.target.value)} className="w-full rounded-xl border border-line bg-card px-3 py-2.5 focus:border-ink focus:outline-none focus:ring-2 focus:ring-amber/60">
            {["A1", "A2", "B1", "B2", "C1"].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="mat-text" className="mb-1 block text-sm font-bold">
          Conteúdo
        </label>
        <textarea id="mat-text" value={text} onChange={(e) => setText(e.target.value)} rows={6} className="w-full resize-y rounded-xl border border-line bg-card px-4 py-3 font-mono text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-amber/60" />
        <p className="mt-1 text-xs text-muted">O texto de exemplo tem dois problemas de propósito, para você ver a revisão funcionando.</p>
      </div>

      {shown < 0 && (
        <Button onClick={start}>
          <Sparkles className="size-4" aria-hidden /> Enviar para revisão de qualidade (IA)
        </Button>
      )}

      {shown >= 0 && (
        <div className="space-y-3" aria-live="polite">
          <p className="text-sm font-bold">Revisão de qualidade por IA especializada em ensino de idiomas</p>
          <ul className="space-y-2">
            {AI_CHECKS.slice(0, shown).map((c) => {
              const fixed = applied.includes(c.id);
              const issue = c.result === "ajuste" && !fixed;
              return (
                <li key={c.id} className={clsx("rounded-xl border p-3 text-sm", issue ? "border-amber-400 bg-amber-50" : "border-emerald-300 bg-emerald-50")}>
                  <div className="flex items-start gap-2">
                    {issue ? <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden />}
                    <div className="flex-1">
                      <p className="font-bold">{c.label}</p>
                      <p className="text-ink/80">{fixed ? "Ajuste aplicado." : c.message}</p>
                      {issue && c.fix && (
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <span className="rounded-lg bg-card px-2 py-1 text-xs">Sugestão: “{c.fix.to}”</span>
                          <Button onClick={() => applyFix(c.id)}>Aplicar sugestão</Button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
            {running && (
              <li className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="size-4 animate-spin" aria-hidden /> Verificando…
              </li>
            )}
          </ul>
          {done && (
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={publish} disabled={pendingFixes.length > 0}>
                Publicar na minha biblioteca
              </Button>
              {pendingFixes.length > 0 && <span className="text-xs text-muted">Aplique as {pendingFixes.length} sugestões para publicar.</span>}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function LibrarySection({ ctx }: { ctx: TeacherCtx }) {
  const [view, setView] = useState<View>("licoes");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("Todos");
  const [own, setOwn] = useState<Own[]>([{ id: "own-1", title: "Inglês para o Natal", level: "A2", size: "0,4 GB" }]);
  const [creating, setCreating] = useState(false);

  const lessons = level === "Todos" ? LESSONS : LESSONS.filter((l) => l.level === level);

  return (
    <>
      <SectionHead title="Cursos e biblioteca" text="Lições e apostilas prontas, e o seu próprio material." />

      <div className="inline-flex flex-wrap rounded-3xl border border-line bg-card p-1" role="tablist" aria-label="Tipo de conteúdo">
        {(
          [
            ["licoes", "Lições da plataforma"],
            ["cadernos", "Cadernos e apostilas"],
            ["meus", "Meus materiais"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={view === id} onClick={() => setView(id)} className={clsx("rounded-full px-4 py-2 text-sm font-bold transition", view === id ? "bg-brand text-brand-ink" : "hover:bg-cream")}>
            {label}
          </button>
        ))}
      </div>

      {view === "licoes" && (
        <>
          <Explain title="Lições prontas, em modo leitura">
            Cada lição traz vídeo, vocabulário, exercícios e quiz, e já vem com o nível definido. Elas são do catálogo da
            plataforma, incluídas na sua assinatura. Você pode usá-las nas aulas e nos planos de estudo dos alunos.
          </Explain>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por nível">
            {LEVELS.map((l) => (
              <button key={l} type="button" onClick={() => setLevel(l)} aria-pressed={level === l} className={clsx("rounded-full border px-4 py-1.5 text-sm font-bold", level === l ? "border-ink bg-ink text-cream" : "border-line bg-card hover:border-ink")}>
                {l}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {lessons.map((l) => (
              <Card key={l.id} className="flex flex-col">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone="brand">{l.tag}</Badge>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-muted">
                    <Lock className="size-3" aria-hidden /> Somente leitura
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-semibold">{l.title}</h3>
                <p className="mt-1 flex-1 text-sm text-muted">
                  Nível {l.level} · {l.minutes} min · com quiz
                </p>
                <Button className="mt-4" variant="ghost" onClick={() => ctx.notify(`“${l.title}” adicionada ao plano do aluno (exemplo).`)}>
                  Usar com um aluno
                </Button>
              </Card>
            ))}
          </div>
        </>
      )}

      {view === "cadernos" && (
        <>
          <Explain title="Cadernos e apostilas montados com as lições">
            São apostilas prontas, feitas pela plataforma a partir das lições que já existem, organizadas por objetivo e
            nível. Você pode abrir como caderno colaborativo na aula ou atribuir ao aluno para estudar sozinho.
          </Explain>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {READY_NOTEBOOKS.map((n) => (
              <Card key={n.id} className="flex flex-col">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone="brand">Nível {n.level}</Badge>
                  <span className="text-xs font-bold text-muted">{n.pages} páginas</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold">{n.title}</h3>
                <p className="mt-1 text-sm text-muted">{n.description}</p>
                <p className="mt-3 text-xs font-bold text-muted">Feito com as lições:</p>
                <ul className="mt-1 flex flex-wrap gap-1.5">
                  {n.lessonIds.map((id) => (
                    <li key={id} className="rounded-full bg-cream px-2.5 py-1 text-xs font-semibold">
                      {lessonTitle(id)}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => ctx.openClassroom("Beatriz Lima", n.title)}>Abrir na aula</Button>
                  <Button variant="ghost" onClick={() => ctx.notify(`“${n.title}” atribuído ao aluno (exemplo).`)}>
                    Atribuir a um aluno
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {view === "meus" && (
        <>
          <Explain title="Seu material passa por revisão de qualidade">
            Você pode criar seus próprios cadernos e apostilas. Antes de chegarem aos alunos, eles passam por uma{" "}
            <b>revisão de qualidade com IA especializada</b>: gramática, coerência com o nível, clareza das instruções,
            gabarito e originalidade. Você aceita as sugestões e publica. Materiais próprios ocupam espaço de
            armazenamento.
          </Explain>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-4">
              {creating ? (
                <QualityReview
                  notify={ctx.notify}
                  onPublished={(item) => {
                    setOwn((o) => [...o, item]);
                    setCreating(false);
                  }}
                />
              ) : (
                <button type="button" onClick={() => setCreating(true)} className="flex min-h-32 w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line text-sm font-bold text-muted transition hover:border-ink hover:text-ink">
                  <Plus className="size-6" aria-hidden /> Criar novo material
                </button>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {own.map((c) => (
                  <Card key={c.id}>
                    <Badge tone="ok">
                      <CheckCircle2 className="size-3" aria-hidden /> Aprovado pela IA
                    </Badge>
                    <h3 className="mt-3 text-xl font-semibold">{c.title}</h3>
                    <p className="mt-1 text-sm text-muted">
                      Nível {c.level} · {c.size}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
            <Card className="h-fit">
              <h3 className="text-lg font-semibold">Armazenamento</h3>
              <div className="mt-4">
                <Meter label="Espaço usado" value={2.1} max={10} unit="GB" hint="Vídeos e arquivos dos seus materiais ocupam espaço." />
              </div>
              <Button className="mt-5 w-full" onClick={() => ctx.notify("Aqui você contrataria mais espaço (pacotes extras).")}>
                Contratar mais espaço
              </Button>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
