"use client";

import { useState } from "react";
import clsx from "clsx";
import { BookOpen, CalendarDays, CreditCard, Home, RefreshCw, type LucideIcon } from "lucide-react";
import { Explain, ExplainProvider, Switch, useToast } from "@/components/demo/ui";
import {
  BlockedScreen,
  HomeScreen,
  LessonsScreen,
  PayScreen,
  ReviewScreen,
  StudyScreen,
  type StudentTab,
} from "@/components/demo/student/screens";

const TABS: { id: StudentTab; label: string; icon: LucideIcon }[] = [
  { id: "inicio", label: "Início", icon: Home },
  { id: "aulas", label: "Aulas", icon: CalendarDays },
  { id: "estudar", label: "Estudar", icon: BookOpen },
  { id: "revisar", label: "Revisar", icon: RefreshCw },
  { id: "pagar", label: "Pagar", icon: CreditCard },
];

const INFO: Record<StudentTab, { title: string; points: string[]; tryIt: string }> = {
  inicio: {
    title: "Tela inicial",
    points: [
      "A próxima aula em destaque, com um toque para entrar.",
      "O nível atual e o caminho até o próximo, para o aluno ver que está evoluindo.",
      "Sequência de dias e a revisão do dia, que incentivam o hábito de estudar.",
    ],
    tryIt: "Toque em “Revisão de hoje”.",
  },
  aulas: {
    title: "Aulas e agenda",
    points: [
      "O aluno vê as próximas aulas e reagenda sozinho, sem trocar mensagens.",
      "O professor é avisado do novo horário automaticamente.",
      "Depois da aula, o aluno pode rever o que foi dito (transcrição).",
    ],
    tryIt: "Reagende uma aula e abra “Ver o que foi dito na aula”.",
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
    title: "Revisão espaçada",
    points: [
      "O aluno vira o cartão e diz se lembrou. A plataforma decide quando mostrar de novo: o que ele erra volta logo, o que acerta volta depois.",
      "Isso ajuda a fixar vocabulário e estruturas sem ele precisar planejar nada.",
    ],
    tryIt: "Vire os cartões e escolha Errei, Difícil ou Fácil.",
  },
  pagar: {
    title: "Mensalidade e contrato",
    points: [
      "PIX com copia e cola direto no app. O pagamento cai na conta do professor e a baixa é automática.",
      "O contrato fica sempre à mão, com renovação automática.",
      "Se a mensalidade atrasa, o acesso é suspenso até o pagamento ser confirmado.",
    ],
    tryIt: "Ligue “Simular mensalidade atrasada” ao lado.",
  },
};

function isTab(value: string | undefined): value is StudentTab {
  return TABS.some((t) => t.id === value);
}

export function StudentDemo({ initialTab }: { initialTab?: string }) {
  const [tab, setTab] = useState<StudentTab>(isTab(initialTab) ? initialTab : "inicio");
  const [late, setLate] = useState(false);
  const [explain, setExplain] = useState(true);
  const { notify, toast } = useToast();
  const info = INFO[tab];

  return (
    <ExplainProvider value={explain}>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-2xl bg-ink px-5 py-3 text-sm text-cream">
          <strong>Demonstração navegável.</strong> É assim que o aluno vê a sua escola no celular. Dados fictícios.
        </div>

        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[auto_1fr]">
          {/* Celular */}
          <div className="mx-auto w-full max-w-[390px]">
            <div className="rounded-[2.75rem] border-[10px] border-ink bg-ink shadow-2xl">
              <div className="flex h-[720px] flex-col overflow-hidden rounded-[2rem] bg-cream">
                <div className="flex items-center justify-between bg-card px-5 py-3 text-xs font-bold">
                  <span>9:41</span>
                  <span className="font-display text-sm font-semibold">Inglês com a Ana</span>
                  <span aria-hidden>100%</span>
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                  {late ? (
                    <BlockedScreen
                      onPaid={() => {
                        setLate(false);
                        notify("Pagamento confirmado. Acesso liberado.");
                      }}
                    />
                  ) : (
                    <>
                      {tab === "inicio" && <HomeScreen go={setTab} notify={notify} />}
                      {tab === "aulas" && <LessonsScreen notify={notify} />}
                      {tab === "estudar" && <StudyScreen notify={notify} />}
                      {tab === "revisar" && <ReviewScreen />}
                      {tab === "pagar" && <PayScreen notify={notify} />}
                    </>
                  )}
                </div>
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
              </div>
            </div>
          </div>

          {/* Explicações */}
          <div className="space-y-5">
            <div className="space-y-4 rounded-2xl border border-line bg-card p-5">
              <label className="flex items-center justify-between gap-4 text-sm font-bold">
                Mostrar explicações
                <Switch checked={explain} onChange={setExplain} label="Mostrar explicações" />
              </label>
              <label className="flex items-center justify-between gap-4 text-sm font-bold">
                Simular mensalidade atrasada
                <Switch checked={late} onChange={setLate} label="Simular mensalidade atrasada" />
              </label>
            </div>

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
                Foi isso que o aluno veria se a mensalidade atrasasse. O bloqueio é automático e some assim que o
                pagamento é confirmado. Toque em “Já paguei (simular)” no celular.
              </Explain>
            )}
          </div>
        </div>
      </div>
      {toast}
    </ExplainProvider>
  );
}
