import React from "react";
import { Editor } from "@tiptap/react";
import { Undo, Redo } from "lucide-react";
import { Button } from "@/components/tiptap-ui-primitive/button";

interface HistoryGroupProps {
  editor: Editor;
}

const HistoryGroup: React.FC<HistoryGroupProps> = ({ editor }) => (
  <div className="flex gap-1">
    <Button
      onClick={() => editor.chain().focus().undo().run()}
      type="button"
      data-style="ghost"
      data-active-state="off"
      role="button"
      tooltip="Desfazer (Ctrl+Z)"
      className="tiptap-button"
      disabled={!editor.can().undo()}
    >
      <Undo size={18} className="tiptap-button-text" />
    </Button>

    <Button
      onClick={() => editor.chain().focus().redo().run()}
      type="button"
      data-style="ghost"
      data-active-state="off"
      role="button"
      tooltip="Refazer (Ctrl+Y)"
      className="tiptap-button"
      disabled={!editor.can().redo()}
    >
      <Redo size={18} className="tiptap-button-text" />
    </Button>
  </div>
);

export default HistoryGroup;
