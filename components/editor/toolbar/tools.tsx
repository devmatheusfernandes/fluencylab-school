"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import {
  Search as SearchIcon,
  Wrench as WrenchIcon,
  ChevronDown,
} from "lucide-react";
import * as Accordion from "@radix-ui/react-accordion";

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Editor } from "@tiptap/react";
import AudioModal from "@/components/editor/extensions/Audio/AudioModal";
import BandImageModal from "@/components/editor/extensions/BandImage/BandImageModal";
import BandVideoModal from "@/components/editor/extensions/BandVideo/BandVideoModal";
import DownloadModal from "@/components/editor/extensions/Download/DownloadModal";
import FlashcardModal from "@/components/editor/extensions/Flashcards/FlashcardModal";
import GoalModal from "@/components/editor/extensions/Goal/GoalModal";
import MultipleChoiceModal from "@/components/editor/extensions/MultipleChoice/MultipleChoiceModal";
import PronounceModal from "@/components/editor/extensions/Pronounce/PronounceModal";
import QuestionsModal from "@/components/editor/extensions/Question/QuestionsModal";
import QuizModal from "@/components/editor/extensions/Quiz/QuizModal";
import ReviewModal from "@/components/editor/extensions/Review/ReviewModal";
import SentencesModal from "@/components/editor/extensions/Sentences/SentencesModal";
import TextStudentModal from "@/components/editor/extensions/TextStudent/TextStudentModal";
import TextTeacherModal from "@/components/editor/extensions/TextTeacher/TextTeacherModal";
import TextTipModal from "@/components/editor/extensions/TextTip/TextTipModal";
import TranslationModal from "@/components/editor/extensions/Translation/TranslationModal";
import VocabulabModal from "@/components/editor/extensions/Vocabulab/VocabulabModal";

type ToolItem = {
  id: string;
  label: string;
  description: string;
  keywords?: string[];
};

type ToolCategory = {
  id: string;
  label: string;
  description: string;
  items: ToolItem[];
};

const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: "media",
    label: "Mídia",
    description: "Componentes de áudio e vídeo.",
    items: [
      { id: "audio", label: "Áudio", description: "Player de áudio.", keywords: ["som", "media"] },
      { id: "band-image", label: "Imagem da banda", description: "Imagem do material da banda.", keywords: ["imagem", "banda"] },
      { id: "band-video", label: "Vídeo da banda", description: "Vídeo do material da banda.", keywords: ["vídeo", "banda"] },
    ],
  },
  {
    id: "exercises",
    label: "Exercícios",
    description: "Atividades e prática do aluno.",
    items: [
      { id: "question", label: "Perguntas", description: "Criar exercício de lacunas.", keywords: ["quiz", "lacuna"] },
      { id: "multiple-choice", label: "Múltipla escolha", description: "Questões objetivas.", keywords: ["pergunta", "opções"] },
      { id: "sentences", label: "Frases", description: "Exercício de escrita.", keywords: ["texto", "escrita"] },
      { id: "translation", label: "Tradução", description: "Prática de tradução.", keywords: ["idioma"] },
      { id: "pronounce", label: "Pronúncia", description: "Prática de pronúncia.", keywords: ["fala", "audio"] },
      { id: "flashcards", label: "Flashcards", description: "Cartões de memorização.", keywords: ["estudo"] },
      { id: "quiz", label: "Quiz", description: "Avaliação por quiz.", keywords: ["teste"] },
      { id: "vocabulab", label: "Vocabulab", description: "Vocabulário interativo.", keywords: ["vocabulário"] },
    ],
  },
  {
    id: "conteudo",
    label: "Conteúdo",
    description: "Blocos de conteúdo e orientação.",
    items: [
      { id: "text-student", label: "Texto do aluno", description: "Área para escrita do aluno.", keywords: ["aluno"] },
      { id: "text-teacher", label: "Texto do professor", description: "Área para instruções do professor.", keywords: ["professor"] },
      { id: "text-tip", label: "Dica de texto", description: "Dicas de escrita.", keywords: ["dica"] },
      { id: "review", label: "Revisão", description: "Faixa de revisão.", keywords: ["recapitular"] },
      { id: "goal", label: "Objetivo", description: "Objetivo da aula.", keywords: ["meta"] },
    ],
  },
  {
    id: "recursos",
    label: "Recursos",
    description: "Utilidades e anexos.",
    items: [
      { id: "download", label: "Download", description: "Bloco para baixar arquivos.", keywords: ["arquivo"] },
    ],
  },
  {
    id: "comentarios",
    label: "Comentários",
    description: "Anotações e discussões.",
    items: [
      { id: "comments", label: "Comentários", description: "Abrir painel de comentários.", keywords: ["feedback"] },
    ],
  },
];

type BaseModalProps = { isOpen: boolean; onClose: () => void; editor: Editor };

const TextTipModalAdapter: React.FC<BaseModalProps> = ({ isOpen, onClose, editor }) => (
  <TextTipModal isOpen={isOpen} onClose={onClose} editor={editor} initialText="" />
);

const TextStudentModalAdapter: React.FC<BaseModalProps> = ({ isOpen, onClose, editor }) => (
  <TextStudentModal isOpen={isOpen} onClose={onClose} editor={editor} initialText="" />
);

const TextTeacherModalAdapter: React.FC<BaseModalProps> = ({ isOpen, onClose, editor }) => (
  <TextTeacherModal isOpen={isOpen} onClose={onClose} editor={editor} initialText="" />
);

export const MODAL_COMPONENTS: Record<string, React.ComponentType<BaseModalProps>> = {
  audio: AudioModal,
  "band-image": BandImageModal,
  "band-video": BandVideoModal,
  download: DownloadModal,
  flashcards: FlashcardModal,
  goal: GoalModal,
  "multiple-choice": MultipleChoiceModal,
  pronounce: PronounceModal,
  question: QuestionsModal,
  quiz: QuizModal,
  review: ReviewModal,
  sentences: SentencesModal,
  "text-student": TextStudentModalAdapter,
  "text-teacher": TextTeacherModalAdapter,
  "text-tip": TextTipModalAdapter,
  translation: TranslationModal,
  vocabulab: VocabulabModal,
};

export type ToolbarToolsSheetProps = {
  onSelectTool?: (toolId: string) => void;
  onOpenDialog?: (toolId: string) => void;
  triggerLabel?: string;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  modalTools?: string[];
};

export function ToolbarToolsSheet({
  onSelectTool,
  onOpenDialog,
  triggerLabel = "Ferramentas",
  side = "right",
  className,
  modalTools = Object.keys(MODAL_COMPONENTS),
}: ToolbarToolsSheetProps) {
  const [query, setQuery] = useState("");

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TOOL_CATEGORIES;
    return TOOL_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => {
        const inLabel = item.label.toLowerCase().includes(q);
        const inKeywords = (item.keywords || []).some((k) =>
          k.toLowerCase().includes(q)
        );
        const inDescription = item.description.toLowerCase().includes(q);
        return inLabel || inKeywords || inDescription;
      }),
    })).filter((cat) => cat.items.length > 0);
  }, [query]);

  const handleSelect = (toolId: string) => {
    try {
      onSelectTool?.(toolId);
    } catch (e) {
      // silencioso: consumidores podem lançar ao tratar seleção
    }
  };

  const handleOpenDialog = (toolId: string) => {
    try {
      onOpenDialog?.(toolId);
    } catch (e) {
      // silencioso: consumidores podem lançar ao abrir modal
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className={className}>
          <WrenchIcon className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side={side} className="p-0">
        <SheetHeader className="p-4">
          <SheetTitle>Ferramentas</SheetTitle>
          <SheetDescription>
            Explore e selecione ferramentas por categoria. Use a busca para
            encontrar rapidamente.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquise ferramentas..."
              className="pl-9"
            />
          </div>
        </div>

        <Separator />

        <div className="overflow-y-auto p-2">
          {filteredCategories.length === 0 ? (
            <div className="text-muted-foreground p-4 text-sm">
              Nenhum resultado encontrado.
            </div>
          ) : (
            <Accordion.Root type="multiple" className="flex flex-col">
              {filteredCategories.map((cat) => (
                <Accordion.Item
                  key={cat.id}
                  value={cat.id}
                  className="border-b"
                >
                  <Accordion.Header>
                    <Accordion.Trigger className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/40">
                      <div>
                        <div className="text-foreground text-sm font-semibold">
                          {cat.label}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {cat.description}
                        </div>
                      </div>
                      <ChevronDown className="size-4 shrink-0 transition-transform data-[state=open]:rotate-180" />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                    <div className="space-y-3 p-4">
                      {cat.items.map((item) => (
                        <Card key={item.id} className="p-3">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-sm font-medium">
                                {item.label}
                              </div>
                              <div className="text-muted-foreground mt-1 text-xs">
                                {item.description}
                              </div>
                              {item.keywords && item.keywords.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {item.keywords.map((kw) => (
                                    <Badge
                                      key={kw}
                                      variant="outline"
                                      className="text-[10px]"
                                    >
                                      {kw}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() =>
                                  modalTools.includes(item.id) && onOpenDialog
                                    ? handleOpenDialog(item.id)
                                    : handleSelect(item.id)
                                }
                              >
                                Selecionar
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Export default para facilitar import em outros arquivos
export default ToolbarToolsSheet;
