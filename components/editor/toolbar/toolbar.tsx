"use client";

import React, { useState } from "react";
import { Editor } from "@tiptap/react";
import {
  Divider,
  HeadingSelector,
  TextFormattingGroup,
  AlignmentGroup,
  ListGroup,
  ColorPicker,
  LinkDrawer,
  HistoryGroup,
  CommentsButton,
} from "./components";
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button";
import { ColorHighlightPopover } from "@/components/tiptap-ui/color-highlight-popover";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/image-upload-node/image-upload-node.scss";
import ToolbarToolsSheet, { MODAL_COMPONENTS } from "./tools";
import { BackButton } from "@/components/ui/back-button";


interface ToolbarProps {
  editor: Editor | null;
}

const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
  const [openModalId, setOpenModalId] = useState<string | null>(null);
  if (!editor) {
    return null;
  }


  const handleOpenDialog = (toolId: string) => {
    setOpenModalId(toolId);
  };

  const handleCloseDialog = () => setOpenModalId(null);

  const ActiveModal = openModalId ? MODAL_COMPONENTS[openModalId] : null;
  return (
    <div className="sticky top-0 z-10 border-b border-border bg-background shadow-sm">
      <div className="p-2">
        <div className="flex items-center justify-between gap-4">
          {/* Espaço esquerdo - Placeholder para futuros botões */}
          <div className="flex items-center gap-1 min-w-0">
            <BackButton />
          </div>

          {/* Botões centralizados */}
          <div className="flex flex-wrap items-center justify-center gap-1 flex-1">
            <HeadingSelector editor={editor} />
            <Divider />
            <TextFormattingGroup editor={editor} />
            <Divider />
            <AlignmentGroup editor={editor} />
            <Divider />
            <ListGroup editor={editor} />
            <Divider />
            <ColorPicker editor={editor} />
            <ColorHighlightPopover
              editor={editor}
              hideWhenUnavailable={true}
              onApplied={({ color, label }) =>
                console.log(`Applied highlight: ${label} (${color})`)
              }
            />
            <Divider />
            {/* Comentários */}
            <CommentsButton editor={editor} />
            <Divider />
            <LinkDrawer editor={editor} />
            <Divider />
            <HistoryGroup editor={editor} />
            <ImageUploadButton editor={editor} />
          </div>

          {/* Espaço direito - Placeholder para futuros botões */}
          <div className="flex items-center gap-1 min-w-0">
            <ThemeSwitcher />
            <ToolbarToolsSheet
              onOpenDialog={handleOpenDialog}
              modalTools={Object.keys(MODAL_COMPONENTS)}
            />
          </div>
        </div>
      </div>
      {ActiveModal && (
        <ActiveModal isOpen={true} onClose={handleCloseDialog} editor={editor} />
      )}
    </div>
  );
};

export default Toolbar;
