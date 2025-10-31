import React, { useState } from "react";
import { Editor } from "@tiptap/react";
import { Palette } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface ColorPickerProps {
  editor: Editor;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ editor }) => {
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

export default ColorPicker;