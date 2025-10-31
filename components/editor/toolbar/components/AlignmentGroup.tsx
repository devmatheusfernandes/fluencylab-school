import React from "react";
import { Editor } from "@tiptap/react";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AlignmentGroupProps {
  editor: Editor;
}

const AlignmentGroup: React.FC<AlignmentGroupProps> = ({ editor }) => {
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

export default AlignmentGroup;