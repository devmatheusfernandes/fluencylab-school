import React from "react";
import { Editor } from "@tiptap/react";
import {
  Heading1,
  Heading2,
  Heading3,
  Type,
  ChevronDown,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/tiptap-ui-primitive/button";

interface HeadingSelectorProps {
  editor: Editor;
}

const HeadingSelector: React.FC<HeadingSelectorProps> = ({ editor }) => {
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
        <Button
          type="button"
          data-style="ghost"
          data-active-state="off"
          role="button"
          tooltip="Estilo do texto"
          className="tiptap-button px-3 py-2 flex items-center gap-2"
        >
          {currentHeading.icon}
          <span className="text-sm font-medium hidden sm:inline">
            {currentHeading.label}
          </span>
        </Button>
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

export default HeadingSelector;
