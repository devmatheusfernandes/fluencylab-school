"use client";

import { useState } from "react";
import clsx from "clsx";
import { Lock, Plus } from "lucide-react";
import { OWN_COURSES, PLATFORM_COURSES } from "@/lib/demo-data";
import { Badge, Button, Card, Explain, Meter, SectionHead } from "@/components/demo/ui";
import type { TeacherCtx } from "@/components/demo/teacher/types";

export function LibrarySection({ ctx }: { ctx: TeacherCtx }) {
  const [view, setView] = useState<"biblioteca" | "meus">("biblioteca");

  return (
    <>
      <SectionHead title="Cursos e biblioteca" text="Conteúdo pronto para usar e espaço para criar o seu." />
      <Explain title="Dois tipos de conteúdo">
        A <b>biblioteca</b> traz aulas, cursos e materiais prontos, incluídos na plataforma e disponíveis em modo de
        leitura para você usar com seus alunos. Os <b>meus cursos</b> são criados por você e ocupam espaço de
        armazenamento, por isso há um limite e a opção de contratar mais espaço.
      </Explain>

      <div className="inline-flex rounded-full border border-line bg-card p-1" role="tablist" aria-label="Tipo de conteúdo">
        {(
          [
            ["biblioteca", "Biblioteca da plataforma"],
            ["meus", "Meus cursos"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={clsx("rounded-full px-4 py-2 text-sm font-bold transition", view === id ? "bg-brand text-brand-ink" : "hover:bg-cream")}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "biblioteca" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {PLATFORM_COURSES.map((c) => (
            <Card key={c.id} className="flex flex-col">
              <div className="flex items-center justify-between gap-2">
                <Badge tone="brand">{c.tag}</Badge>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-muted">
                  <Lock className="size-3" aria-hidden /> Somente leitura
                </span>
              </div>
              <h3 className="mt-4 text-xl font-semibold">{c.title}</h3>
              <p className="mt-1 flex-1 text-sm text-muted">
                {c.level} · {c.lessons} aulas
              </p>
              <Button className="mt-4" variant="ghost" onClick={() => ctx.notify(`“${c.title}” atribuído a um aluno (exemplo).`)}>
                Usar com um aluno
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {OWN_COURSES.map((c) => (
              <Card key={c.id}>
                <Badge tone="ok">Meu curso</Badge>
                <h3 className="mt-4 text-xl font-semibold">{c.title}</h3>
                <p className="mt-1 text-sm text-muted">
                  {c.level} · {c.lessons} aulas · {c.size}
                </p>
              </Card>
            ))}
            <button
              type="button"
              onClick={() => ctx.notify("Aqui abriria o editor de cursos e aulas.")}
              className="grid min-h-40 place-items-center rounded-2xl border-2 border-dashed border-line text-sm font-bold text-muted transition hover:border-ink hover:text-ink"
            >
              <span className="flex flex-col items-center gap-2">
                <Plus className="size-6" aria-hidden />
                Criar novo curso
              </span>
            </button>
          </div>
          <Card>
            <h3 className="text-lg font-semibold">Armazenamento</h3>
            <div className="mt-4">
              <Meter label="Espaço usado" value={2.1} max={10} unit="GB" hint="Vídeos e arquivos dos seus cursos ocupam espaço." />
            </div>
            <Button className="mt-5 w-full" onClick={() => ctx.notify("Aqui você contrataria mais espaço (pacotes extras).")}>
              Contratar mais espaço
            </Button>
          </Card>
        </div>
      )}
    </>
  );
}
