import React from "react";
import { Editor } from "@tiptap/react";
import { Bold, Italic, Code } from "lucide-react";
import { Button } from "@/components/tiptap-ui-primitive/button";

interface TextFormattingGroupProps {
  editor: Editor;
}

const TextFormattingGroup: React.FC<TextFormattingGroupProps> = ({
  editor,
}) => (
  <div className="flex gap-1">
    <Button
      onClick={() => editor.chain().focus().toggleBold().run()}
      type="button"
      data-style="ghost"
      data-active-state={editor.isActive("bold") ? "on" : "off"}
      role="button"
      tooltip="Negrito (Ctrl+B)"
      className="tiptap-button"
    >
      <Bold size={18} className="tiptap-button-text" />
    </Button>

    <Button
      onClick={() => editor.chain().focus().toggleItalic().run()}
      type="button"
      data-style="ghost"
      data-active-state={editor.isActive("italic") ? "on" : "off"}
      role="button"
      tooltip="Itálico (Ctrl+I)"
      className="tiptap-button"
    >
      <Italic size={18} className="tiptap-button-text" />
    </Button>

    <Button
      onClick={() => editor.chain().focus().toggleCode().run()}
      type="button"
      data-style="ghost"
      data-active-state={editor.isActive("code") ? "on" : "off"}
      role="button"
      tooltip="Código (Ctrl+E)"
      className="tiptap-button"
    >
      <Code size={18} className="tiptap-button-text" />
    </Button>
  </div>
);

export default TextFormattingGroup;
