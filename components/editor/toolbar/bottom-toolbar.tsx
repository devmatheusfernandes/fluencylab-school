"use client";

import React, { useState, useEffect, useRef } from "react";
import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Palette,
  Link,
  Unlink,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Strikethrough,
  Code,
  ChevronDown,
  Check,
  ExternalLink,
  ChevronUp,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ToolbarProps {
  editor: Editor | null;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  title: string;
  disabled?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  isActive = false,
  children,
  title,
  disabled = false,
}) => (
  <button
    onClick={onClick}
    title={title}
    disabled={disabled}
    className={`
      p-2 rounded-lg transition-all duration-200 
      ${
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-foreground hover:bg-accent hover:text-accent-foreground"
      }
      disabled:opacity-40 disabled:cursor-not-allowed
      active:scale-95
    `}
  >
    {children}
  </button>
);

const Divider = () => <div className="h-8 w-px bg-border mx-1" />;

const HeadingSelector: React.FC<{ editor: Editor }> = ({ editor }) => {
  const headings = [
    {
      level: 1,
      label: "Título 1",
      icon: <Heading1 size={18} />,
      shortcut: "Ctrl+Alt+1",
    },
    {
      level: 2,
      label: "Título 2",
      icon: <Heading2 size={18} />,
      shortcut: "Ctrl+Alt+2",
    },
    {
      level: 3,
      label: "Título 3",
      icon: <Heading3 size={18} />,
      shortcut: "Ctrl+Alt+3",
    },
    { level: 0, label: "Parágrafo", icon: <Type size={18} />, shortcut: "" },
  ];

  const getCurrentHeading = () => {
    for (let i = 1; i <= 3; i++) {
      if (editor.isActive("heading", { level: i })) {
        return headings[i - 1];
      }
    }
    return headings[3];
  };

  const currentHeading = getCurrentHeading();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-foreground hover:bg-accent hover:text-accent-foreground"
          title="Estilo do texto"
        >
          {currentHeading.icon}
          <span className="text-sm font-medium hidden sm:inline">
            {currentHeading.label}
          </span>
          <ChevronDown size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {headings.map((heading) => (
          <DropdownMenuItem
            key={heading.level}
            onClick={() => {
              if (heading.level === 0) {
                editor.chain().focus().setParagraph().run();
              } else {
                editor
                  .chain()
                  .focus()
                  .toggleHeading({ level: heading.level as 1 | 2 | 3 })
                  .run();
              }
            }}
            className={`flex items-center gap-3 cursor-pointer ${
              (heading.level === 0 && editor.isActive("paragraph")) ||
              editor.isActive("heading", { level: heading.level })
                ? "bg-primary/10 text-primary"
                : ""
            }`}
          >
            {heading.icon}
            <div className="flex-1">
              <div className="font-medium">{heading.label}</div>
              {heading.shortcut && (
                <div className="text-xs text-muted-foreground">
                  {heading.shortcut}
                </div>
              )}
            </div>
            {((heading.level === 0 && editor.isActive("paragraph")) ||
              editor.isActive("heading", { level: heading.level })) && (
              <Check size={16} />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const TextFormattingGroup: React.FC<{ editor: Editor }> = ({ editor }) => (
  <div className="flex gap-1">
    <ToolbarButton
      onClick={() => editor.chain().focus().toggleBold().run()}
      isActive={editor.isActive("bold")}
      title="Negrito (Ctrl+B)"
    >
      <Bold size={18} />
    </ToolbarButton>

    <ToolbarButton
      onClick={() => editor.chain().focus().toggleItalic().run()}
      isActive={editor.isActive("italic")}
      title="Itálico (Ctrl+I)"
    >
      <Italic size={18} />
    </ToolbarButton>

    <ToolbarButton
      onClick={() => editor.chain().focus().toggleCode().run()}
      isActive={editor.isActive("code")}
      title="Código (Ctrl+E)"
    >
      <Code size={18} />
    </ToolbarButton>
  </div>
);

const AlignmentGroup: React.FC<{ editor: Editor }> = ({ editor }) => {
  const alignments = [
    {
      value: "left",
      icon: <AlignLeft size={18} />,
      label: "Esquerda",
      shortcut: "Ctrl+Shift+L",
    },
    {
      value: "center",
      icon: <AlignCenter size={18} />,
      label: "Centro",
      shortcut: "Ctrl+Shift+E",
    },
    {
      value: "right",
      icon: <AlignRight size={18} />,
      label: "Direita",
      shortcut: "Ctrl+Shift+R",
    },
    {
      value: "justify",
      icon: <AlignJustify size={18} />,
      label: "Justificar",
      shortcut: "Ctrl+Shift+J",
    },
  ];

  const getCurrentAlignment = () => {
    const current = alignments.find((a) =>
      editor.isActive({ textAlign: a.value })
    );
    return current || alignments[0];
  };

  const currentAlignment = getCurrentAlignment();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="p-2 rounded-lg transition-all duration-200 text-foreground hover:bg-accent hover:text-accent-foreground"
          title="Alinhamento"
        >
          {currentAlignment.icon}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {alignments.map((alignment) => (
          <DropdownMenuItem
            key={alignment.value}
            onClick={() =>
              editor.chain().focus().setTextAlign(alignment.value).run()
            }
            className={`flex items-center gap-3 cursor-pointer ${
              editor.isActive({ textAlign: alignment.value })
                ? "bg-primary/10 text-primary"
                : ""
            }`}
          >
            {alignment.icon}
            <div className="flex-1">
              <div className="font-medium">Alinhar à {alignment.label}</div>
              <div className="text-xs text-muted-foreground">
                {alignment.shortcut}
              </div>
            </div>
            {editor.isActive({ textAlign: alignment.value }) && (
              <Check size={16} />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const ListGroup: React.FC<{ editor: Editor }> = ({ editor }) => {
  const lists = [
    {
      type: "bulletList",
      icon: <List size={18} />,
      label: "Marcadores",
      shortcut: "Ctrl+Shift+8",
    },
    {
      type: "orderedList",
      icon: <ListOrdered size={18} />,
      label: "Numerada",
      shortcut: "Ctrl+Shift+7",
    },
    {
      type: "taskList",
      icon: <ListChecks size={18} />,
      label: "Tarefas",
      shortcut: "",
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`
            p-2 rounded-lg transition-all duration-200 flex items-center gap-1
            ${
              editor.isActive("bulletList") ||
              editor.isActive("orderedList") ||
              editor.isActive("taskList")
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground hover:bg-accent hover:text-accent-foreground"
            }
          `}
          title="Listas"
        >
          <List size={18} />
          <ChevronDown size={14} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {lists.map((list) => (
          <DropdownMenuItem
            key={list.type}
            onClick={() => {
              if (list.type === "bulletList") {
                editor.chain().focus().toggleBulletList().run();
              } else if (list.type === "orderedList") {
                editor.chain().focus().toggleOrderedList().run();
              } else if (list.type === "taskList") {
                editor.chain().focus().toggleTaskList().run();
              }
            }}
            className={`flex items-center gap-3 cursor-pointer ${
              editor.isActive(list.type) ? "bg-primary/10 text-primary" : ""
            }`}
          >
            {list.icon}
            <div className="flex-1">
              <div className="font-medium">Lista {list.label}</div>
              {list.shortcut && (
                <div className="text-xs text-muted-foreground">
                  {list.shortcut}
                </div>
              )}
            </div>
            {editor.isActive(list.type) && <Check size={16} />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`flex items-center gap-3 cursor-pointer ${
            editor.isActive("blockquote") ? "bg-primary/10 text-primary" : ""
          }`}
        >
          <Quote size={18} />
          <div className="flex-1">
            <div className="font-medium">Citação</div>
            <div className="text-xs text-muted-foreground">Ctrl+Shift+B</div>
          </div>
          {editor.isActive("blockquote") && <Check size={16} />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const ColorPicker: React.FC<{ editor: Editor }> = ({ editor }) => {
  const [customColor, setCustomColor] = useState("#000000");

  const colorPalette = [
    { name: "Preto", hex: "#000000" },
    { name: "Cinza escuro", hex: "#374151" },
    { name: "Cinza", hex: "#6B7280" },
    { name: "Cinza claro", hex: "#9CA3AF" },
    { name: "Branco", hex: "#FFFFFF" },
    { name: "Vermelho", hex: "#EF4444" },
    { name: "Laranja", hex: "#F97316" },
    { name: "Amarelo", hex: "#EAB308" },
    { name: "Lima", hex: "#84CC16" },
    { name: "Verde", hex: "#22C55E" },
    { name: "Esmeralda", hex: "#10B981" },
    { name: "Ciano", hex: "#06B6D4" },
    { name: "Azul", hex: "#3B82F6" },
    { name: "Índigo", hex: "#6366F1" },
    { name: "Roxo", hex: "#8B5CF6" },
    { name: "Magenta", hex: "#D946EF" },
    { name: "Rosa", hex: "#EC4899" },
    { name: "Âmbar", hex: "#F59E0B" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="p-2 rounded-lg transition-all duration-200 text-foreground hover:bg-accent hover:text-accent-foreground relative"
          title="Cor do texto"
        >
          <Palette size={18} />
          {editor.getAttributes("textStyle").color && (
            <div
              className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background"
              style={{
                backgroundColor: editor.getAttributes("textStyle").color,
              }}
            />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-3">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Cores pré-definidas
            </p>
            <div className="grid grid-cols-6 gap-2">
              {colorPalette.map((color) => (
                <button
                  key={color.hex}
                  onClick={() =>
                    editor.chain().focus().setColor(color.hex).run()
                  }
                  className={`
                    w-8 h-8 rounded-md border-2 transition-all
                    ${
                      editor.getAttributes("textStyle").color === color.hex
                        ? "border-primary scale-110"
                        : "border-border hover:scale-110 hover:border-muted-foreground"
                    }
                  `}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <DropdownMenuSeparator />

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Cor personalizada
            </p>
            <div className="flex gap-2">
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-12 h-10 rounded border border-input cursor-pointer bg-background"
              />
              <button
                onClick={() =>
                  editor.chain().focus().setColor(customColor).run()
                }
                className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>

          <DropdownMenuSeparator />

          <button
            onClick={() => editor.chain().focus().unsetColor().run()}
            className="w-full px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
          >
            Remover cor
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const LinkDrawer: React.FC<{ editor: Editor }> = ({ editor }) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");

  const handleOpen = () => {
    const previousUrl = editor.getAttributes("link").href || "";
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");

    setUrl(previousUrl);
    setText(selectedText);
    setOpen(true);
  };

  const handleSave = () => {
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setOpen(false);
      return;
    }

    if (text) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .command(({ tr }) => {
          const { from, to } = tr.selection;
          if (from === to || !tr.doc.textBetween(from, to, " ")) {
            tr.insertText(text);
          }
          return true;
        })
        .run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }

    setOpen(false);
    setUrl("");
    setText("");
  };

  const handleRemove = () => {
    editor.chain().focus().unsetLink().run();
    setOpen(false);
    setUrl("");
    setText("");
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          onClick={handleOpen}
          className={`
            p-2 rounded-lg transition-all duration-200 
            ${
              editor.isActive("link")
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground hover:bg-accent hover:text-accent-foreground"
            }
            active:scale-95
          `}
          title="Adicionar link (Ctrl+K)"
        >
          <Link size={18} />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <ExternalLink size={20} />
              Adicionar Link
            </DrawerTitle>
            <DrawerDescription>
              Insira a URL e o texto do link que deseja adicionar.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link-text">Texto do Link</Label>
              <Input
                id="link-text"
                placeholder="Ex: Clique aqui"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="input-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                type="url"
                placeholder="https://exemplo.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="input-base"
              />
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={handleSave} className="w-full">
              Salvar Link
            </Button>
            {editor.isActive("link") && (
              <Button
                variant="outline"
                onClick={handleRemove}
                className="w-full"
              >
                Remover Link
              </Button>
            )}
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

const HistoryGroup: React.FC<{ editor: Editor }> = ({ editor }) => (
  <div className="flex gap-1">
    <ToolbarButton
      onClick={() => editor.chain().focus().undo().run()}
      disabled={!editor.can().undo()}
      title="Desfazer (Ctrl+Z)"
    >
      <Undo size={18} />
    </ToolbarButton>

    <ToolbarButton
      onClick={() => editor.chain().focus().redo().run()}
      disabled={!editor.can().redo()}
      title="Refazer (Ctrl+Y)"
    >
      <Redo size={18} />
    </ToolbarButton>
  </div>
);

const BottomToolbar: React.FC<ToolbarProps> = ({ editor }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibleButtons, setVisibleButtons] = useState<string[]>([]);
  const [hiddenButtons, setHiddenButtons] = useState<string[]>([]);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Define todos os botões/grupos disponíveis
  const allButtons = [
    { id: "heading", component: HeadingSelector, width: 140 },
    { id: "divider1", component: Divider, width: 20 },
    { id: "formatting", component: TextFormattingGroup, width: 120 },
    { id: "divider2", component: Divider, width: 20 },
    { id: "alignment", component: AlignmentGroup, width: 50 },
    { id: "divider3", component: Divider, width: 20 },
    { id: "list", component: ListGroup, width: 50 },
    { id: "divider4", component: Divider, width: 20 },
    { id: "color", component: ColorPicker, width: 50 },
    { id: "divider5", component: Divider, width: 20 },
    { id: "link", component: LinkDrawer, width: 50 },
    { id: "divider6", component: Divider, width: 20 },
    { id: "history", component: HistoryGroup, width: 90 },
  ];

  useEffect(() => {
    const calculateVisibleButtons = () => {
      if (!toolbarRef.current) return;

      const containerWidth = window.innerWidth - 120; // Espaço para o botão "Mais"
      let accumulatedWidth = 0;
      const visible: string[] = [];
      const hidden: string[] = [];

      for (const button of allButtons) {
        if (accumulatedWidth + button.width <= containerWidth) {
          visible.push(button.id);
          accumulatedWidth += button.width;
        } else {
          if (!button.id.startsWith("divider")) {
            hidden.push(button.id);
          }
        }
      }

      setVisibleButtons(visible);
      setHiddenButtons(hidden);
    };

    calculateVisibleButtons();
    window.addEventListener("resize", calculateVisibleButtons);
    return () => window.removeEventListener("resize", calculateVisibleButtons);
  }, []);

  if (!editor) {
    return null;
  }

  const renderButton = (buttonId: string) => {
    const button = allButtons.find((b) => b.id === buttonId);
    if (!button) return null;

    const Component = button.component;
    return <Component key={buttonId} editor={editor} />;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Camada expandida (escondida) */}
      <div
        className={`
          bg-background border-t border-border shadow-lg
          transition-all duration-300 ease-in-out overflow-hidden
          ${isExpanded ? "max-h-20 opacity-100" : "max-h-0 opacity-0"}
        `}
      >
        <div className="p-2 flex items-center justify-center gap-1 flex-wrap">
          {hiddenButtons.map((buttonId) => renderButton(buttonId))}
        </div>
      </div>

      {/* Camada principal (sempre visível) */}
      <div
        ref={toolbarRef}
        className="bg-background border-t border-border shadow-lg"
      >
        <div className="p-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 flex-1 justify-center overflow-x-auto">
            {visibleButtons.map((buttonId) => renderButton(buttonId))}
          </div>

          {hiddenButtons.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg transition-all duration-200 text-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-1 shrink-0"
              title={isExpanded ? "Ocultar ferramentas" : "Mais ferramentas"}
            >
              {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              <span className="text-sm hidden sm:inline">Mais</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BottomToolbar;
