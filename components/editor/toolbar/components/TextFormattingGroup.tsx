import React from "react";
import { Editor } from "@tiptap/react";
import { Bold, Italic, Code } from "lucide-react";
import ToolbarButton from "./ToolbarButton";

interface TextFormattingGroupProps {
  editor: Editor;
}

const TextFormattingGroup: React.FC<TextFormattingGroupProps> = ({ editor }) => (
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

export default TextFormattingGroup;