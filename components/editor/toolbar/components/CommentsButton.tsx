import React from "react";
import { Editor } from "@tiptap/react";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/tiptap-ui-primitive/button";

interface CommentsButtonProps {
  editor: Editor;
}

const CommentsButton: React.FC<CommentsButtonProps> = ({ editor }) => {
  const handleOpen = () => {
    try {
      const { from, to } = editor.state.selection;
      const hasSelection = from !== to;
      const mode = hasSelection ? "add" : "list";
      window.dispatchEvent(
        new CustomEvent("open-comment-sheet", { detail: { mode } })
      );
    } catch {
      window.dispatchEvent(
        new CustomEvent("open-comment-sheet", { detail: { mode: "list" } })
      );
    }
  };

  return (
    <Button
      onClick={handleOpen}
      type="button"
      data-style="ghost"
      data-active-state="off"
      role="button"
      tooltip="Comentários"
      className="tiptap-button"
    >
      <MessageSquarePlus size={18} className="tiptap-button-text" />
    </Button>
  );
};

export default CommentsButton;