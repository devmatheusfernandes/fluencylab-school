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
import { QuestionsToolModal } from "@/components/tiptap/extensions/Questions/QuestionsToolModal";
import { MusicToolModal } from "@/components/tiptap/extensions/Music/MusicToolModal";
import { WorkbookToolModal } from "@/components/tiptap/extensions/Workbooks/WorkbookToolModal";
import { TasksToolSheet } from "@/components/tiptap/extensions/Tasks/TasksToolSheet";

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
    id: "content",
    label: "Biblioteca",
    description: "Importe conteúdo de apostilas e materiais",
    items: [
      {
        id: "workbooks",
        label: "Apostilas",
        description: "Navegue e insira conteúdo de aulas das apostilas.",
        keywords: ["apostila", "livro", "lição", "aula", "conteúdo"],
      },
    ],
  },
  {
    id: "organization",
    label: "Organização",
    description: "Ferramentas de gestão e organização",
    items: [
      {
        id: "tasks",
        label: "Tarefas",
        description: "Visualize e gerencie as tarefas do aluno",
        keywords: ["tarefa", "todo", "dever", "casa", "atividade"],
      },
    ],
  },
  {
    id: "extensions",
    label: "Extensões",
    description: "Ferramentas adicionais para conteúdo interativo",
    items: [
      {
        id: "questions",
        label: "Perguntas/Quizzes",
        description:
          "Crie perguntas, selecione existentes e monte decks",
        keywords: ["quiz", "pergunta", "deck", "prova", "atividade"],
      },
      {
        id: "music",
        label: "Música/YouTube",
        description: "Integre vídeo e letra sincronizada (LRCLIB) com modo de completar.",
        keywords: ["youtube", "music", "lyrics", "lrclib", "jogo"],
      },
    ],
  },
];
type BaseModalProps = { isOpen: boolean; onClose: () => void; editor: Editor; studentID?: string };
export const MODAL_COMPONENTS: Record<string, React.ComponentType<BaseModalProps>> = {
  questions: QuestionsToolModal as React.ComponentType<BaseModalProps>,
  music: MusicToolModal as React.ComponentType<BaseModalProps>,
  workbooks: WorkbookToolModal as React.ComponentType<BaseModalProps>,
  tasks: TasksToolSheet as React.ComponentType<BaseModalProps>,
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
  side = "right",
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
        <Button variant="outline" className="max-w-10">
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
