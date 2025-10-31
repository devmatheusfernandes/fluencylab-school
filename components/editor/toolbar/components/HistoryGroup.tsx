import React from "react";
import { Editor } from "@tiptap/react";
import { Undo, Redo } from "lucide-react";
import ToolbarButton from "./ToolbarButton";

interface HistoryGroupProps {
  editor: Editor;
}

const HistoryGroup: React.FC<HistoryGroupProps> = ({ editor }) => (
  <div className="flex gap-1">
    {/* <ToolbarButton
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
    </ToolbarButton> */}
  </div>
);

export default HistoryGroup;
