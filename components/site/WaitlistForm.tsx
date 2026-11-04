"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import clsx from "clsx";
import { CheckCircle2, Loader2, Share2 } from "lucide-react";
import {
  BILLING_METHODS,
  LANGUAGES,
  MAIN_PAINS,
  PRICE_INTENTS,
  STUDENTS_RANGES,
} from "@/lib/waitlist-options";
import { PRODUCT_NAME } from "@/lib/config";

type Status = "idle" | "loading" | "done" | "error";

const fieldClass =
  "w-full rounded-xl border border-line bg-card px-4 py-3 text-base text-ink placeholder:text-muted/70 focus:border-ink focus:outline-none focus:ring-2 focus:ring-amber/60";

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-bold text-ink">
      {children}
    </label>
  );
}

function PillRadio({ name, value, label, required }: { name: string; value: string; label: string; required?: boolean }) {
  return (
    <label className="cursor-pointer">
      <input type="radio" name={name} value={value} required={required} className="peer sr-only" />
      <span className="block rounded-full border border-line bg-card px-4 py-2.5 text-sm font-semibold transition peer-checked:border-ink peer-checked:bg-ink peer-checked:text-cream peer-focus-visible:ring-2 peer-focus-visible:ring-amber">
        {label}
      </span>
    </label>
  );
}

export function WaitlistForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [already, setAlready] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const params = new URLSearchParams(window.location.search);

    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          whatsapp: data.get("whatsapp"),
          language: data.get("language"),
          studentsRange: data.get("studentsRange"),
          billing: data.getAll("billing"),
          priceIntent: data.get("priceIntent"),
          mainPain: data.get("mainPain"),
          notes: data.get("notes"),
          consent: data.get("consent") === "on",
          website: data.get("website"),
          source: params.get("utm_source") ?? params.get("ref") ?? "",
        }),
      });
      const json = (await response.json().catch(() => ({}))) as { error?: string; alreadyRegistered?: boolean };
      if (!response.ok) {
        setError(json.error ?? "Não foi possível enviar. Tente novamente.");
        setStatus("error");
        return;
      }
      setAlready(Boolean(json.alreadyRegistered));
      setStatus("done");
    } catch {
      setError("Sem conexão no momento. Tente novamente.");
      setStatus("error");
    }
  }

  if (status === "done") {
    const text = `Estou na lista de espera da ${PRODUCT_NAME}, uma plataforma para professores de idiomas independentes. Dá uma olhada:`;
    const shareHref = `https://wa.me/?text=${encodeURIComponent(`${text} ${typeof window === "undefined" ? "" : window.location.origin}`)}`;
    return (
      <div className="rounded-3xl border border-line bg-card p-8 text-center sm:p-12" role="status">
        <CheckCircle2 className="mx-auto size-14 text-teal" aria-hidden />
        <h3 className="mt-5 text-3xl font-semibold">{already ? "Atualizamos o seu cadastro." : "Você está na lista!"}</h3>
        <p className="mx-auto mt-3 max-w-md text-lg leading-relaxed text-muted">
          Vamos avisar quando a sua vaga abrir. Enquanto isso, que tal conhecer a plataforma por dentro?
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/demo/professor" className="rounded-full bg-ink px-6 py-3 font-bold text-cream hover:bg-ink-2">
            Ver a demo do professor
          </Link>
          <a
            href={shareHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-ink px-6 py-3 font-bold text-ink hover:bg-ink hover:text-cream"
          >
            <Share2 className="size-4" aria-hidden />
            Indicar a um colega
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-7 rounded-3xl border border-line bg-card p-6 sm:p-10" noValidate={false}>
      {/* campo-isca anti-robô: invisível para pessoas */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label>
          Não preencha
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Seu nome</Label>
          <input id="name" name="name" required minLength={2} maxLength={100} autoComplete="name" className={fieldClass} placeholder="Como você quer ser chamado" />
        </div>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <input id="email" name="email" type="email" required autoComplete="email" className={fieldClass} placeholder="voce@exemplo.com" />
        </div>
        <div>
          <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
          <input id="whatsapp" name="whatsapp" type="tel" autoComplete="tel" className={fieldClass} placeholder="(00) 90000-0000" />
        </div>
        <div>
          <Label htmlFor="language">Idioma que você ensina</Label>
          <select id="language" name="language" required defaultValue="" className={fieldClass}>
            <option value="" disabled>
              Escolha
            </option>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-bold">Quantos alunos você tem hoje?</legend>
        <div className="flex flex-wrap gap-2">
          {STUDENTS_RANGES.map((o) => (
            <PillRadio key={o.value} name="studentsRange" value={o.value} label={o.label} required />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-bold">Como você cobra hoje? (pode marcar mais de uma)</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {BILLING_METHODS.map((o) => (
            <label key={o.value} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-card px-4 py-3 text-sm font-semibold has-[:checked]:border-ink has-[:checked]:bg-cream">
              <input type="checkbox" name="billing" value={o.value} className="size-4 accent-ink" />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-bold">O que mais atrapalha o seu dia a dia hoje?</legend>
        <div className="flex flex-wrap gap-2">
          {MAIN_PAINS.map((o) => (
            <PillRadio key={o.value} name="mainPain" value={o.value} label={o.label} required />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1 text-sm font-bold">Quanto você acharia justo pagar por mês por uma plataforma assim?</legend>
        <p className="mb-3 text-sm text-muted">Considere contratos, cobrança automática, aulas em vídeo e acompanhamento dos alunos. Sua resposta sincera ajuda a definir o preço.</p>
        <div className="flex flex-wrap gap-2">
          {PRICE_INTENTS.map((o) => (
            <PillRadio key={o.value} name="priceIntent" value={o.value} label={o.label} required />
          ))}
        </div>
      </fieldset>

      <div>
        <Label htmlFor="notes">O que não pode faltar? (opcional)</Label>
        <textarea id="notes" name="notes" rows={3} maxLength={600} className={fieldClass} placeholder="Conte o que você mais sente falta hoje" />
      </div>

      <label className="flex items-start gap-3 text-sm leading-relaxed">
        <input type="checkbox" name="consent" required className="mt-1 size-4 accent-ink" />
        <span>
          Concordo em receber contato sobre o lançamento e que meus dados sejam usados conforme a{" "}
          <Link href="/privacidade" className="font-bold underline" target="_blank">
            política de privacidade
          </Link>
          .
        </span>
      </label>

      {status === "error" && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className={clsx(
          "inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-8 py-4 text-lg font-bold text-cream transition hover:bg-ink-2 sm:w-auto",
          status === "loading" && "opacity-70",
        )}
      >
        {status === "loading" && <Loader2 className="size-5 animate-spin" aria-hidden />}
        Entrar na lista de espera
      </button>
    </form>
  );
}
