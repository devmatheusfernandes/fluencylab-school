"use client";

import { Check } from "lucide-react";
import { DOMAIN } from "@/lib/config";
import { Badge, Card, Explain, SectionHead } from "@/components/demo/ui";
import type { TeacherCtx } from "@/components/demo/teacher/types";

const SWATCHES = ["#187066", "#1d4ed8", "#9333ea", "#be123c", "#c2410c", "#12263a"];

export function BrandStudio({ ctx }: { ctx: TeacherCtx }) {
  const { brand, setBrand } = ctx;
  const cleanSlug = brand.slug.replace(/[^a-z0-9-]/g, "");

  return (
    <>
      <SectionHead title="Minha marca" text="O aluno entra na sua escola, não em uma plataforma genérica." />
      <Explain title="Mude e veja na hora">
        Troque o nome e a cor: o painel inteiro ao lado muda junto, assim como a tela de login que o aluno vê. Cada
        professor tem o seu endereço. Domínio próprio (por exemplo, <i>escoladaana.com.br</i>) será uma opção
        adicional.
      </Explain>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="space-y-6">
          <div>
            <label htmlFor="school-name" className="mb-1.5 block text-sm font-bold">
              Nome da escola
            </label>
            <input
              id="school-name"
              value={brand.name}
              maxLength={40}
              onChange={(e) => setBrand({ ...brand, name: e.target.value })}
              className="w-full rounded-xl border border-line bg-card px-4 py-3 focus:border-ink focus:outline-none focus:ring-2 focus:ring-amber/60"
            />
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-bold">Cor principal</legend>
            <div className="flex flex-wrap items-center gap-3">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Usar a cor ${c}`}
                  aria-pressed={brand.color === c}
                  onClick={() => setBrand({ ...brand, color: c })}
                  className="grid size-11 place-items-center rounded-full ring-offset-2 transition focus-visible:ring-2 focus-visible:ring-ink"
                  style={{ background: c, outline: brand.color === c ? "3px solid var(--ink)" : "none", outlineOffset: 2 }}
                >
                  {brand.color === c && <Check className="size-5 text-white" aria-hidden />}
                </button>
              ))}
              <label className="flex items-center gap-2 text-sm font-bold">
                Outra
                <input
                  type="color"
                  value={brand.color}
                  onChange={(e) => setBrand({ ...brand, color: e.target.value })}
                  className="h-11 w-14 cursor-pointer rounded-lg border border-line bg-card"
                  aria-label="Escolher outra cor"
                />
              </label>
            </div>
          </fieldset>

          <div>
            <label htmlFor="school-slug" className="mb-1.5 block text-sm font-bold">
              Endereço da sua escola
            </label>
            <div className="flex items-center overflow-hidden rounded-xl border border-line bg-card focus-within:border-ink focus-within:ring-2 focus-within:ring-amber/60">
              <input
                id="school-slug"
                value={brand.slug}
                maxLength={30}
                onChange={(e) => setBrand({ ...brand, slug: e.target.value.toLowerCase() })}
                className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none"
              />
              <span className="bg-cream px-4 py-3 text-sm text-muted">.{DOMAIN}</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-cream px-4 py-3 text-sm">
            <span className="font-bold">Domínio próprio</span>
            <Badge>Em breve</Badge>
          </div>
        </Card>

        <Card className="p-0">
          <div className="rounded-t-2xl bg-stone-200 px-5 py-3 text-sm text-ink/80">
            {cleanSlug || "suaescola"}.{DOMAIN}/entrar
          </div>
          <div className="space-y-6 p-8">
            <div className="flex items-center gap-4">
              <span className="grid size-16 place-items-center rounded-2xl bg-brand font-display text-2xl font-semibold text-brand-ink">
                {brand.name.trim().charAt(0).toUpperCase() || "?"}
              </span>
              <h3 className="text-2xl font-semibold">{brand.name || "Sua escola"}</h3>
            </div>
            <p className="text-muted">Bem-vindo de volta. Entre para ver suas aulas.</p>
            <div className="space-y-3">
              <div className="rounded-xl border border-line px-4 py-3 text-sm text-muted">E-mail</div>
              <div className="rounded-xl border border-line px-4 py-3 text-sm text-muted">Senha</div>
              <div className="rounded-xl bg-brand px-4 py-3 text-center font-bold text-brand-ink">Entrar</div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
