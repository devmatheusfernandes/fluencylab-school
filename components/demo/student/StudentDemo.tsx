"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import clsx from "clsx";
import { BookOpen, CalendarDays, CreditCard, Gamepad2, Home, Monitor, Smartphone, type LucideIcon } from "lucide-react";
import { Explain, ExplainProvider, Switch, useToast } from "@/components/demo/ui";
import { Classroom } from "@/components/demo/classroom/Classroom";
import { HomeScreen, LessonsScreen } from "@/components/demo/student/HomeLessons";
import { PracticeScreen } from "@/components/demo/student/Practice";
import { BlockedScreen, PayScreen, StudyScreen, type StudentTab } from "@/components/demo/student/screens";

const TABS: { id: StudentTab; label: string; icon: LucideIcon }[] = [
  { id: "inicio", label: "Início", icon: Home },
  { id: "aulas", label: "Aulas", icon: CalendarDays },
  { id: "estudar", label: "Estudar", icon: BookOpen },
  { id: "revisar", label: "Praticar", icon: Gamepad2 },
  { id: "pagar", label: "Pagar", icon: CreditCard },
];

const INFO: Record<StudentTab, { title: string; points: string[]; tryIt: string }> = {
  inicio: {
    title: "Tela inicial",
    points: [
      "A próxima aula em destaque, com um toque para entrar na sala de aula.",
      "O nível atual e o caminho até o próximo, para o aluno ver que está evoluindo.",
      "O plano da semana, criado automaticamente a partir do nivelamento feito na primeira aula.",
      "Sequência de dias e a prática do dia, que incentivam o hábito de estudar.",
    ],
    tryIt: "Toque em “Entrar na aula” para ver o caderno colaborativo com o vídeo.",
  },
  aulas: {
    title: "Aulas e aulas gravadas",
    points: [
      "O aluno vê as próximas aulas, entra na sala e reagenda sozinho, sem trocar mensagens.",
      "O professor é avisado do novo horário automaticamente.",
      "As aulas ficam gravadas: o aluno revê o que foi dito, com transcrição, e salva frases no caderno.",
    ],
    tryIt: "Reagende uma aula e abra uma aula gravada.",
  },
  estudar: {
    title: "Cursos e caderno",
    points: [
      "Cursos com exercícios e resposta imediata.",
      "Certificado de conclusão para cada curso finalizado.",
      "Caderno com as anotações das aulas e vocabulário novo, que pode ir direto para a revisão.",
    ],
    tryIt: "Responda o exercício, abra o certificado e veja o Caderno.",
  },
  revisar: {
    title: "Revisão e jogos de imersão",
    points: [
      "Revisão espaçada: o aluno vira o cartão e diz se lembrou. O que ele erra volta logo, o que acerta volta depois.",
      "Jogos de imersão (Wordle, Word Ladder e Lyrics Training) para praticar o idioma de forma leve todo dia.",
      "O professor acompanha essa prática diária na página do aluno.",
    ],
    tryIt: "Vire alguns cartões e jogue o Wordle.",
  },
  pagar: {
    title: "Mensalidade e contrato",
    points: [
      "PIX com copia e cola direto no app. O pagamento cai na conta do professor e a baixa é automática.",
      "O contrato fica sempre à mão, com renovação automática.",
      "Se a mensalidade atrasa, o acesso é suspenso até o pagamento ser confirmado.",
    ],
    tryIt: "Ligue “Simular mensalidade atrasada” acima.",
  },
};

function isTab(value: string | undefined): value is StudentTab {
  return TABS.some((t) => t.id === value);
}

type Device = "auto" | "desktop" | "mobile";

function subscribeLarge(callback: () => void) {
  const query = window.matchMedia("(min-width: 1024px)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const getLarge = () => window.matchMedia("(min-width: 1024px)").matches;

export function StudentDemo({ initialTab }: { initialTab?: string }) {
  const [tab, setTab] = useState<StudentTab>(isTab(initialTab) ? initialTab : "inicio");
  const [late, setLate] = useState(false);
  const [explain, setExplain] = useState(true);
  const [device, setDevice] = useState<Device>("auto");
  const [inClass, setInClass] = useState(false);
  const isLarge = useSyncExternalStore(subscribeLarge, getLarge, () => true);
  const { notify, toast } = useToast();

  const effective: "desktop" | "mobile" = device === "auto" ? (isLarge ? "desktop" : "mobile") : device;
  const info = INFO[tab];

  const screen = (wide: boolean): ReactNode =>
    late ? (
      <BlockedScreen
        onPaid={() => {
          setLate(false);
          notify("Pagamento confirmado. Acesso liberado.");
        }}
      />
    ) : tab === "inicio" ? (
      <HomeScreen go={setTab} onJoin={() => setInClass(true)} wide={wide} />
    ) : tab === "aulas" ? (
      <LessonsScreen notify={notify} onJoin={() => setInClass(true)} />
    ) : tab === "estudar" ? (
      <StudyScreen notify={notify} />
    ) : tab === "revisar" ? (
      <PracticeScreen />
    ) : (
      <PayScreen notify={notify} />
    );

  const classroom = inClass ? <Classroom role="aluno" studentName="Beatriz Lima" contained onClose={() => setInClass(false)} /> : null;

  const explanation = (
    <div className="space-y-5">
      {explain && (
        <div className="rounded-2xl border border-line bg-card p-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal">{info.title}</p>
          <ul className="mt-4 space-y-3 leading-relaxed">
            {info.points.map((p) => (
              <li key={p} className="flex gap-3">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-5 rounded-xl bg-cream px-4 py-3 text-sm">
            <b>Experimente:</b> {info.tryIt}
          </p>
        </div>
      )}
      {late && (
        <Explain title="Acesso bloqueado por atraso">
          Foi isso que o aluno veria se a mensalidade atrasasse. O bloqueio é automático e some assim que o pagamento é confirmado. Use “Já paguei (simular)”.
        </Explain>
      )}
    </div>
  );

  const phone = (
    <div className="mx-auto w-full max-w-[390px]">
      <div className="rounded-[2.75rem] border-[10px] border-ink bg-ink shadow-2xl">
        <div className="relative flex h-[720px] flex-col overflow-hidden rounded-[2rem] bg-cream">
          <div className="flex items-center justify-between bg-card px-5 py-3 text-xs font-bold">
            <span>9:41</span>
            <span className="font-display text-sm font-semibold">Inglês com a Ana</span>
            <span aria-hidden>100%</span>
          </div>
          <div className="flex-1 overflow-y-auto p-5">{screen(false)}</div>
          {!late && (
            <nav aria-label="Navegação do aluno" className="grid grid-cols-5 border-t border-line bg-card">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  aria-current={tab === id ? "page" : undefined}
                  className={clsx("flex flex-col items-center gap-1 py-3 text-[11px] font-bold transition", tab === id ? "text-brand" : "text-muted hover:text-ink")}
                >
                  <Icon className="size-5" aria-hidden />
                  {label}
                </button>
              ))}
            </nav>
          )}
          {classroom}
        </div>
      </div>
    </div>
  );

  const desktop = (
    <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-2xl">
      <div className="flex items-center gap-3 border-b border-line bg-stone-100 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-3 rounded-full bg-red-400" />
          <span className="size-3 rounded-full bg-amber-400" />
          <span className="size-3 rounded-full bg-emerald-400" />
        </span>
        <span className="flex-1 truncate rounded-lg bg-white px-4 py-1.5 text-center text-sm text-muted">ana.fluencylab.school/aluno</span>
      </div>
      <div className="relative flex h-[720px]">
        {!late && (
          <nav aria-label="Navegação do aluno" className="hidden w-56 shrink-0 flex-col gap-1 border-r border-line bg-card p-4 sm:flex">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-brand font-display font-semibold text-brand-ink">I</span>
              <span className="font-display font-semibold leading-tight">Inglês com a Ana</span>
            </div>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-current={tab === id ? "page" : undefined}
                className={clsx("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition", tab === id ? "bg-brand text-brand-ink" : "hover:bg-cream")}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </button>
            ))}
            <div className="mt-auto flex items-center gap-2 rounded-xl bg-cream p-3 text-sm">
              <span className="grid size-8 place-items-center rounded-full bg-amber font-bold text-ink">B</span>
              Beatriz Lima
            </div>
          </nav>
        )}
        <div className="flex-1 overflow-y-auto bg-cream p-6 sm:p-8">
          <div className="mx-auto max-w-3xl">{screen(true)}</div>
        </div>
        {classroom}
      </div>
    </div>
  );

  return (
    <ExplainProvider value={explain}>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-2xl bg-ink px-5 py-3 text-sm text-cream">
          <strong>Demonstração navegável.</strong> É assim que o aluno vê a escola do professor, no computador e no celular. Dados fictícios.
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-card p-4">
          <div className="inline-flex rounded-full border border-line p-1" role="group" aria-label="Aparelho">
            {(
              [
                ["desktop", "Computador", Monitor],
                ["mobile", "Celular", Smartphone],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setDevice(id)}
                aria-pressed={effective === id}
                className={clsx("inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition", effective === id ? "bg-ink text-cream" : "hover:bg-cream")}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-3 text-sm font-bold">
            Simular mensalidade atrasada
            <Switch checked={late} onChange={setLate} label="Simular mensalidade atrasada" />
          </label>
          <label className="flex items-center gap-3 text-sm font-bold">
            Mostrar explicações
            <Switch checked={explain} onChange={setExplain} label="Mostrar explicações" />
          </label>
        </div>

        {effective === "mobile" ? (
          <div className="mt-6 grid items-start gap-8 lg:grid-cols-[auto_1fr]">
            {phone}
            {explanation}
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {desktop}
            {explanation}
          </div>
        )}
      </div>
      {toast}
    </ExplainProvider>
  );
}
