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
    id: "formatting",
    label: "Formatação",
    description: "Ferramentas para estilizar texto e melhorar a legibilidade.",
    items: [
      {
        id: "bold",
        label: "Negrito",
        description: "Aplica peso de fonte elevado no texto selecionado.",
        keywords: ["texto", "forte"],
      },
      {
        id: "italic",
        label: "Itálico",
        description: "Inclina o texto para dar ênfase.",
        keywords: ["ênfase"],
      },
      {
        id: "underline",
        label: "Sublinhado",
        description: "Adiciona uma linha sob o texto selecionado.",
        keywords: ["linha"],
      },
      {
        id: "strike",
        label: "Riscado",
        description: "Tacha o texto para indicar remoção ou correção.",
        keywords: ["tachado"],
      },
      {
        id: "highlight",
        label: "Destaque",
        description: "Aplica marca-texto para chamar atenção.",
        keywords: ["marca-texto"],
      },
    ],
  },
  {
    id: "structure",
    label: "Estrutura",
    description:
      "Elementos para organizar conteúdo como listas, títulos e separadores.",
    items: [
      {
        id: "heading",
        label: "Título",
        description: "Define níveis de cabeçalho (H1–H3) para hierarquia.",
        keywords: ["h1", "h2", "h3"],
      },
      {
        id: "bullet-list",
        label: "Lista com pontos",
        description: "Cria uma lista não ordenada para tópicos.",
        keywords: ["ul"],
      },
      {
        id: "ordered-list",
        label: "Lista numerada",
        description: "Cria uma lista ordenada para sequências.",
        keywords: ["ol"],
      },
      {
        id: "blockquote",
        label: "Citação",
        description: "Destaca trechos citados com formatação especial.",
        keywords: ["quote"],
      },
      {
        id: "separator",
        label: "Separador",
        description: "Insere uma linha divisória para seções.",
        keywords: ["linha"],
      },
    ],
  },
  {
    id: "insert",
    label: "Inserir",
    description: "Componentes para inserir links, imagens e blocos especiais.",
    items: [
      {
        id: "link",
        label: "Link",
        description: "Cria uma âncora para navegar para uma URL.",
        keywords: ["url", "ancora"],
      },
      {
        id: "image",
        label: "Imagem",
        description: "Insere mídias para ilustrar o conteúdo.",
        keywords: ["foto", "media"],
      },
      {
        id: "code",
        label: "Código",
        description: "Adiciona bloco de código com sintaxe destacada.",
        keywords: ["snippet", "dev"],
      },
      {
        id: "table",
        label: "Tabela",
        description: "Organiza dados em linhas e colunas.",
        keywords: ["dados"],
      },
      {
        id: "callout",
        label: "Callout",
        description: "Cria uma caixa para notas e alertas.",
        keywords: ["nota", "alerta"],
      },
    ],
  },
  {
    id: "content",
    label: "Conteúdo",
    description:
      "Ferramentas de ensino como exercício, vídeo e perguntas interativas.",
    items: [
      {
        id: "exercise",
        label: "Inserir exercício",
        description: "Adiciona um bloco de exercício com enunciado e resposta.",
        keywords: ["atividade", "prática"],
      },
      {
        id: "video",
        label: "Inserir vídeo",
        description: "Embute um vídeo hospedado (YouTube/Vimeo) com controles.",
        keywords: ["media", "aula"],
      },
      {
        id: "question",
        label: "Inserir pergunta",
        description: "Cria uma pergunta objetiva ou discursiva para avaliação.",
        keywords: ["quiz", "avaliação"],
      },
    ],
  },
];

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
  modalTools = ["exercise", "video", "question"],
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
          <WrenchIcon />
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
                                onClick={() => handleSelect(item.id)}
                              >
                                Selecionar
                              </Button>
                              {modalTools.includes(item.id) && onOpenDialog && (
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenDialog(item.id)}
                                >
                                  Abrir modal
                                </Button>
                              )}
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
