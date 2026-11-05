"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import {
  ArrowLeft,
  Bold,
  Bookmark,
  Captions,
  GraduationCap,
  Heading,
  Highlighter,
  Italic,
  Link2,
  List,
  Loader2,
  Maximize2,
  Mic,
  MicOff,
  MonitorUp,
  Moon,
  PhoneOff,
  Plus,
  Redo2,
  Settings,
  Sparkles,
  Table2,
  Underline,
  Undo2,
  Video,
  VideoOff,
} from "lucide-react";
import { GapBlock, MatchBlock, QuizBlock, WriteBlock } from "@/components/demo/classroom/blocks";

type Role = "professor" | "aluno";
type Kind = "quiz" | "gaps" | "match" | "write" | "ai-quiz";
type Block = { id: string; kind: Kind };

const SYMPTOMS: [string, string][] = [
  ["I have a headache / a stomachache / a toothache.", "Estou com dor de cabeça / de estômago / de dente."],
  ["I have a sore throat.", "Estou com dor de garganta."],
  ["I have a fever / a cough / a cold.", "Estou com febre / tosse / resfriado."],
  ["My back hurts. / My knee hurts.", "Minhas costas doem. / Meu joelho dói."],
  ["I feel dizzy / tired / sick.", "Estou tonto / cansado / enjoado."],
];
const DOCTOR_QUESTIONS: [string, string][] = [
  ["What's the matter? / What seems to be the problem?", "Qual é o problema?"],
  ["How long have you felt like this?", "Há quanto tempo está assim?"],
  ["Are you taking any medicine?", "Está tomando algum remédio?"],
  ["Are you allergic to anything?", "Tem alergia a algo?"],
];
const ADVICE: [string, string][] = [
  ["You should rest.", "Você deveria descansar."],
  ["You should drink a lot of water.", "Deveria beber bastante água."],
  ["You shouldn't go to work today.", "Não deveria ir trabalhar hoje."],
  ["Take this medicine twice a day.", "Tome este remédio duas vezes ao dia."],
];

const CAPTIONS: Record<Role, string[]> = {
  professor: ["Good morning! I have a headache and a sore throat.", "Since yesterday.", "No, I'm not taking any medicine."],
  aluno: ["Good morning! What seems to be the problem?", "How long have you felt like this?", "You should rest and drink a lot of water."],
};

const MENU: { kind: Kind; label: string; hint: string }[] = [
  { kind: "quiz", label: "Quiz de múltipla escolha", hint: "Pergunta com resposta imediata" },
  { kind: "gaps", label: "Completar lacunas", hint: "Frases com palavras faltando" },
  { kind: "match", label: "Combinar pares", hint: "Palavra e tradução" },
  { kind: "write", label: "Escrita colaborativa", hint: "Os dois escrevem juntos" },
];

function VocabList({ items, saved, onToggle }: { items: [string, string][]; saved: string[]; onToggle: (phrase: string) => void }) {
  return (
    <ul className="space-y-2.5 pl-1">
      {items.map(([en, pt]) => {
        const isSaved = saved.includes(en);
        return (
          <li key={en} className="flex gap-3 leading-relaxed">
            <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[#6c47ff]" aria-hidden />
            <span>
              <button
                type="button"
                onClick={() => onToggle(en)}
                aria-pressed={isSaved}
                title="Clique para salvar na revisão"
                className={clsx("rounded px-0.5 text-left font-bold transition hover:bg-[#6c47ff]/20", isSaved && "bg-[#6c47ff]/25")}
              >
                {en}
              </button>
              <span className="text-[#aab6c3]"> — {pt}</span>
              {isSaved && <Bookmark className="ml-1.5 inline size-3.5 fill-[#b8a6ff] text-[#b8a6ff]" aria-label="Salvo na revisão" />}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function VideoPanel({ role, mate, saved, onEnd, flash }: { role: Role; mate: string; saved: string[]; onEnd: () => void; flash: (m: string) => void }) {
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [cc, setCc] = useState(true);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const captions = CAPTIONS[role];
  const caption = captions[Math.floor(seconds / 4) % captions.length];
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const ctrl = (label: string, onClick: () => void, children: ReactNode, tone: "red" | "violet" | "dark" = "dark") => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={clsx(
        "grid size-10 place-items-center rounded-full text-white transition hover:brightness-110 @3xl:size-12",
        tone === "red" && "bg-[#e5192b]",
        tone === "violet" && "bg-[#6c47ff]",
        tone === "dark" && "bg-[#1d2733]",
      )}
    >
      {children}
    </button>
  );

  return (
    <aside className="flex shrink-0 flex-col gap-3 border-b border-[#1a212b] p-3 @3xl:order-2 @3xl:m-4 @3xl:w-[400px] @3xl:rounded-3xl @3xl:border @3xl:bg-[#0a0f15] @3xl:p-4">
      <div className="relative h-56 overflow-hidden rounded-2xl bg-[#14202b] @3xl:aspect-[16/11] @3xl:h-auto">
        <button
          type="button"
          onClick={() => setCc(!cc)}
          aria-pressed={cc}
          className={clsx("absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold text-white", cc ? "bg-[#4c33ff]" : "bg-black/50")}
        >
          <Captions className="size-3.5" aria-hidden /> CC
        </button>
        <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-md bg-black/50 px-2 py-0.5 text-[11px] font-bold text-white">
          <span className="size-2 animate-pulse rounded-full bg-red-500" aria-hidden /> Gravando {mm}:{ss}
        </span>
        <div className="grid h-full place-items-center pb-24">
          <span className="grid size-16 place-items-center rounded-full bg-[#0a6cff] font-display text-2xl font-semibold text-white @3xl:size-24 @3xl:text-3xl">
            {mate.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-md bg-black/55 px-2.5 py-1 text-xs font-semibold text-white">
          {mate}
          <Mic className="size-3.5" aria-hidden />
        </span>
        <span className="absolute bottom-3 right-3 grid h-14 w-20 place-items-center rounded-lg border border-white/15 bg-[#0c141c] text-[11px] font-bold text-white/80 @3xl:h-16 @3xl:w-24">
          {cam ? "Você" : <VideoOff className="size-4" aria-hidden />}
        </span>
        {cc && (
          <p className="absolute inset-x-3 bottom-20 rounded-md bg-black/65 px-3 py-1.5 text-center text-xs text-white @3xl:text-sm" aria-live="off">
            {caption}
          </p>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 @3xl:gap-3">
        {ctrl(mic ? "Desligar microfone" : "Ligar microfone", () => setMic(!mic), mic ? <Mic className="size-5" /> : <MicOff className="size-5" />, mic ? "dark" : "red")}
        {ctrl(cam ? "Desligar câmera" : "Ligar câmera", () => setCam(!cam), cam ? <Video className="size-5" /> : <VideoOff className="size-5" />, cam ? "dark" : "red")}
        {ctrl("Efeitos de fundo", () => flash("Desfoque de fundo ligado (exemplo)."), <Sparkles className="size-5" />, "violet")}
        {ctrl("Compartilhar tela", () => flash("Compartilhamento de tela (exemplo)."), <MonitorUp className="size-5" />)}
        {ctrl("Tela cheia", () => flash("Tela cheia (exemplo)."), <Maximize2 className="size-5" />)}
        {ctrl("Encerrar aula", onEnd, <PhoneOff className="size-5" />, "red")}
      </div>

      <div className="hidden rounded-2xl border border-[#1a212b] bg-[#0d1218] p-4 text-sm @3xl:block">
        <p className="flex items-center justify-between font-bold">
          Frases para revisar
          <span className="rounded-full bg-[#6c47ff]/25 px-2 py-0.5 text-xs text-[#c8bbff]">{saved.length}</span>
        </p>
        {saved.length === 0 ? (
          <p className="mt-2 text-[#8d9bab]">Clique numa frase em negrito do caderno para mandá-la para a revisão espaçada do aluno.</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {saved.map((phrase) => (
              <li key={phrase} className="text-[#c9d2dc]">
                {phrase}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

export function Classroom({
  role,
  studentName = "Beatriz",
  onClose,
  contained = false,
  notebookTitle = "At the doctor",
}: {
  role: Role;
  studentName?: string;
  onClose: () => void;
  contained?: boolean;
  notebookTitle?: string;
}) {
  const firstName = studentName.split(" ")[0];
  const me = role === "professor" ? "Ana" : firstName;
  const mate = role === "professor" ? firstName : "Ana";

  const [blocks, setBlocks] = useState<Block[]>([
    { id: "quiz-0", kind: "quiz" },
    { id: "gaps-0", kind: "gaps" },
    { id: "write-0", kind: "write" },
  ]);
  const [counter, setCounter] = useState(1);
  const [menu, setMenu] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (messageTimer.current) clearTimeout(messageTimer.current);
      if (aiTimer.current) clearTimeout(aiTimer.current);
    },
    [],
  );

  function flash(text: string) {
    setMessage(text);
    if (messageTimer.current) clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(null), 2600);
  }

  function toggleSave(phrase: string) {
    setSaved((s) => (s.includes(phrase) ? s.filter((p) => p !== phrase) : [...s, phrase]));
  }

  function addBlock(kind: Kind) {
    const id = `${kind}-${counter}`;
    setCounter((c) => c + 1);
    setBlocks((b) => [...b, { id, kind }]);
    setMenu(false);
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
  }

  function generateWithAi() {
    if (generating) return;
    setGenerating(true);
    aiTimer.current = setTimeout(() => {
      setGenerating(false);
      addBlock("ai-quiz");
    }, 1300);
  }

  const toolbarIcon = (node: ReactNode) => (
    <span className="grid size-8 place-items-center rounded-md text-[#8d9bab]" aria-hidden>
      {node}
    </span>
  );

  return (
    <div
      className={clsx("@container flex flex-col bg-[#07090d] text-[#e8ecf1]", contained ? "absolute inset-0 z-30" : "fixed inset-0 z-50")}
      role="dialog"
      aria-label={`Sala de aula · ${notebookTitle}`}
    >
      {/* barra superior */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[#141a22] px-3">
        <button type="button" onClick={onClose} aria-label="Sair da sala de aula" className="grid size-9 place-items-center rounded-full hover:bg-[#141a22]">
          <ArrowLeft className="size-5" aria-hidden />
        </button>
        <div className="hidden items-center gap-0.5 @3xl:flex">
          {toolbarIcon(<Undo2 className="size-4" />)}
          {toolbarIcon(<Redo2 className="size-4" />)}
          {toolbarIcon(<Heading className="size-4" />)}
          {toolbarIcon(<List className="size-4" />)}
          {toolbarIcon(<Table2 className="size-4" />)}
          {toolbarIcon(<Bold className="size-4" />)}
          {toolbarIcon(<Italic className="size-4" />)}
          {toolbarIcon(<Underline className="size-4" />)}
          {toolbarIcon(<Highlighter className="size-4" />)}
          {toolbarIcon(<Link2 className="size-4" />)}
        </div>
        <div className="relative flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMenu(!menu)}
            aria-expanded={menu}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#141a22] px-3 py-1.5 text-sm font-semibold hover:bg-[#1b2430]"
          >
            <Plus className="size-4" aria-hidden /> Adicionar
          </button>
          <button
            type="button"
            onClick={generateWithAi}
            aria-label="Gerar exercício com IA"
            title="Gerar exercício com IA"
            className="grid size-9 place-items-center rounded-lg bg-[#6c47ff]/20 text-[#c8bbff] hover:bg-[#6c47ff]/30"
          >
            {generating ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
          </button>
          <span className="hidden size-9 place-items-center text-[#8d9bab] @3xl:grid" aria-hidden>
            <Moon className="size-4" />
          </span>
          <span className="hidden size-9 place-items-center text-[#8d9bab] @3xl:grid" aria-hidden>
            <Settings className="size-4" />
          </span>
          <span className="grid size-8 place-items-center rounded-full bg-[#2ea89a] text-xs font-bold text-white" aria-hidden>
            {me.slice(0, 1)}
          </span>
          {menu && (
            <div className="absolute right-0 top-12 z-20 w-72 rounded-2xl border border-[#1f2733] bg-[#0d1218] p-2 shadow-2xl" role="menu">
              <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-[#8d9bab]">Inserir no documento</p>
              {MENU.map((item) => (
                <button key={item.kind} type="button" role="menuitem" onClick={() => addBlock(item.kind)} className="block w-full rounded-xl px-3 py-2.5 text-left hover:bg-[#141a22]">
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="block text-xs text-[#8d9bab]">{item.hint}</span>
                </button>
              ))}
              <button type="button" role="menuitem" onClick={() => { setMenu(false); generateWithAi(); }} className="block w-full rounded-xl px-3 py-2.5 text-left hover:bg-[#141a22]">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-[#c8bbff]">
                  <Sparkles className="size-3.5" aria-hidden /> Gerar exercício com IA
                </span>
                <span className="block text-xs text-[#8d9bab]">Cria um quiz a partir do conteúdo deste caderno</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col @3xl:flex-row">
        <VideoPanel role={role} mate={mate} saved={saved} onEnd={onClose} flash={flash} />

        {/* documento colaborativo */}
        <main className="min-h-0 flex-1 overflow-y-auto">
          <article className="mx-auto max-w-[720px] space-y-8 px-5 py-8 @3xl:px-8 @3xl:py-10">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#141a22] px-3 py-1 font-semibold">
                <span className="size-2 rounded-full bg-[#2ea89a]" aria-hidden /> Ana (professora)
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#141a22] px-3 py-1 font-semibold">
                <span className="size-2 rounded-full bg-[#f2a541]" aria-hidden /> {firstName} (aluno)
              </span>
              <span className="text-[#8d9bab]">editando juntos, em tempo real</span>
            </div>

            <h1 className="font-display text-3xl font-semibold">{notebookTitle}</h1>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">Ponto de partida</h2>
              <p
                contentEditable
                suppressContentEditableWarning
                className="rounded-lg leading-relaxed text-[#c9d2dc] outline-none focus:bg-[#0d1218] focus:ring-1 focus:ring-[#6c47ff]"
              >
                Ficar doente fora do país é estressante. Saber dizer onde dói, há quanto tempo está assim e entender as recomendações do médico faz toda a diferença numa consulta ou numa farmácia.
              </p>
              <p className="text-xs text-[#6f7c8b]">Dica: clique no parágrafo acima e edite. Os dois lados escrevem no mesmo documento.</p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-semibold">Sintomas</h2>
              <VocabList items={SYMPTOMS} saved={saved} onToggle={toggleSave} />
            </section>
            <section className="space-y-3">
              <h2 className="font-display text-xl font-semibold">Perguntas do médico</h2>
              <VocabList items={DOCTOR_QUESTIONS} saved={saved} onToggle={toggleSave} />
            </section>
            <section className="space-y-3">
              <h2 className="font-display text-xl font-semibold">Conselhos com should</h2>
              <VocabList items={ADVICE} saved={saved} onToggle={toggleSave} />
            </section>

            <div className="space-y-5">
              <h2 className="font-display text-xl font-semibold">Dinâmicas</h2>
              {blocks.map((block) => {
                switch (block.kind) {
                  case "quiz":
                    return <QuizBlock key={block.id} id={block.id} question="Complete: “I ___ a headache.”" options={["have", "am", "do"]} correct={0} why="Em inglês, dor de cabeça é “I have a headache”." />;
                  case "ai-quiz":
                    return (
                      <QuizBlock key={block.id} id={block.id} ai question="Qual frase está correta?" options={["You should to rest.", "You should rest.", "You shoulds rest."]} correct={1} why="Depois de “should” usamos o verbo sem “to”." />
                    );
                  case "gaps":
                    return <GapBlock key={block.id} id={block.id} />;
                  case "match":
                    return <MatchBlock key={block.id} id={block.id} />;
                  case "write":
                    return <WriteBlock key={block.id} id={block.id} me={role === "professor" ? "Ana" : "Beatriz"} />;
                }
              })}
              {generating && (
                <p className="flex items-center gap-2 rounded-2xl border border-dashed border-[#6c47ff]/50 p-4 text-sm text-[#c8bbff]" role="status">
                  <Loader2 className="size-4 animate-spin" aria-hidden /> A IA está criando um exercício com base no caderno…
                </p>
              )}
            </div>

            <section className="space-y-2 pb-10">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                <GraduationCap className="size-5 text-[#8d9bab]" aria-hidden /> Anotações da aula
              </h2>
              <div
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-label="Anotações da aula"
                className="min-h-24 rounded-xl border border-[#1f2733] bg-[#0d1218] p-4 text-sm leading-relaxed outline-none empty:before:text-[#5f6c7a] empty:before:content-['Escreva_anotações_para_o_aluno_rever_depois…'] focus:border-[#6c47ff]"
              />
            </section>
          </article>
        </main>
      </div>

      {message && (
        <div role="status" className="absolute bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full bg-[#e8ecf1] px-4 py-2 text-sm font-bold text-[#07090d] shadow-xl">
          {message}
        </div>
      )}
    </div>
  );
}
