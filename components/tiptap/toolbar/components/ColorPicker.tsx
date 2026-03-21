import React from "react";
import { Editor } from "@tiptap/react";
import { Palette, Eraser, Check, Pipette } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/tiptap-ui-primitive/button";

// Paleta exata solicitada (valores Hex baseados no Tailwind CSS)
const MINIMAL_PALETTE = [
  { name: "Preto", hex: "#000000" }, // black
  { name: "Cinza", hex: "#6B7280" }, // gray-500
  { name: "Branco", hex: "#FFFFFF" }, // white
  { name: "Esmeralda", hex: "#10B981" }, // emerald-500
  { name: "Índigo", hex: "#6366F1" }, // indigo-500
  { name: "Violeta", hex: "#7C3AED" }, // violet-600
  { name: "Rosa", hex: "#F43F5E" }, // rose-500
  { name: "Âmbar", hex: "#F59E0B" }, // amber-500
];

interface MinimalColorPickerProps {
  editor: Editor;
}

const MinimalColorPicker: React.FC<MinimalColorPickerProps> = ({ editor }) => {
  const currentColor = editor.getAttributes("textStyle").color || "";

  const applyColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
  };

  const removeColor = () => {
    editor.chain().focus().unsetColor().run();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          data-style="ghost"
          data-active-state={currentColor ? "on" : "off"}
          role="button"
          aria-label="Selecionar cor do texto"
          title="Cor do texto"
          className="tiptap-button relative group"
        >
          <Palette size={18} className="tiptap-button-text" />
          {currentColor && (
            <div
              className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-background shadow-sm transition-transform group-hover:scale-110"
              style={{ backgroundColor: currentColor }}
            />
          )}
        </Button>
      </DropdownMenuTrigger>

      {/* Container focado no mobile com largura ideal */}
      <DropdownMenuContent
        align="start"
        className="w-[calc(100vw-2rem)] max-w-[260px] p-4 sm:w-auto"
      >
        <div className="space-y-4">
          {/* Grid de 4 colunas perfeito para as 8 cores */}
          <div className="grid grid-cols-4 gap-3">
            {MINIMAL_PALETTE.map((color) => {
              const isActive = currentColor === color.hex;
              const isWhite = color.hex === "#FFFFFF";
              return (
                <button
                  key={color.hex}
                  onClick={() => applyColor(color.hex)}
                  className={`
                    relative w-full aspect-square rounded-full shadow-sm transition-all flex items-center justify-center
                    focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1
                    active:scale-90
                    ${isActive ? "ring-2 ring-primary ring-offset-2" : "hover:scale-110"}
                    ${isWhite ? "border-2 border-zinc-200" : "border border-transparent"}
                  `}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                  aria-label={`Mudar cor para ${color.name}`}
                >
                  {isActive && (
                    <Check
                      size={16}
                      className={isWhite ? "text-zinc-900" : "text-white"}
                      strokeWidth={3}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Botão sutil para abrir o seletor nativo do sistema */}
          <div className="relative">
            <input
              type="color"
              value={currentColor || "#000000"}
              onChange={(e) => applyColor(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              aria-label="Abrir seletor de cor nativo"
            />
            <Button
              type="button"
              className="w-full flex items-center justify-center gap-2 h-9 text-xs font-medium border-dashed text-zinc-500 border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50"
            >
              <Pipette size={14} className="text-zinc-400" />
              Cor personalizada
            </Button>
          </div>

          {/* Rodapé de ação */}
          <div className="pt-2 border-t border-zinc-100">
            <button
              onClick={removeColor}
              disabled={!currentColor}
              className={`
                w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors
                ${
                  currentColor
                    ? "text-red-500 hover:bg-red-50 active:scale-[0.98]"
                    : "text-zinc-300 cursor-not-allowed"
                }
              `}
            >
              <Eraser size={16} />
              Remover cor
            </button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MinimalColorPicker;
