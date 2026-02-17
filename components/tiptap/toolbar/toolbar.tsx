"use client";

import React, { useState } from "react";
import { Editor } from "@tiptap/react";
import { TOOL_ITEMS } from "./toolsConfig";
import ToolbarToolsSheet, { MODAL_COMPONENTS } from "./tools";
import { BackButton } from "@/components/ui/back-button";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { TitleEditor } from "./title-editor";

import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/image-upload-node/image-upload-node.scss";
import { useSession } from "next-auth/react";

interface ToolbarProps {
  editor: Editor | null;
  title?: string;
  onTitleChange?: (newTitle: string) => void;
  studentID?: string;
  notebookId?: string;
  name?: string;
}

const Toolbar: React.FC<ToolbarProps> = ({
  editor,
  title,
  onTitleChange,
  studentID,
  notebookId,
  name,
}) => {
  const { data: session } = useSession();
  const [openModalId, setOpenModalId] = useState<string | null>(null);
  if (!editor) {
    return null;
  }

  const handleCloseDialog = () => setOpenModalId(null);
  const firstName = name?.split(" ")[0] ?? "Aluno";

  const ActiveModal = openModalId ? MODAL_COMPONENTS[openModalId] : null;
  return (
    <div className="sticky top-0 z-50 bg-white dark:bg-black border-b border-secondary-foreground/10">
      <div className="p-2">
        <div className="flex items-center justify-between gap-4">
          {/* Esquerda */}
          <div className="flex items-center gap-1 min-w-0">
            <BackButton
              href={
                session?.user.role === "teacher"
                  ? `/hub/teacher/my-students/${firstName}?id=${studentID}`
                  : "/hub/student/my-notebook"
              }
            />
            {title !== undefined &&
              onTitleChange &&
              session?.user.role === "teacher" && (
                <TitleEditor title={title} onTitleChange={onTitleChange} />
              )}
          </div>

          {/* Centro: itens principais compartilhados */}
          <div className="flex flex-wrap items-center justify-center gap-1 flex-1">
            {TOOL_ITEMS.map((item) => {
              if (item.isDivider) {
                const DividerComp = item.component as React.ComponentType<
                  Record<string, unknown>
                >;
                return <DividerComp key={item.id} {...(item.props || {})} />;
              }
              const EditorComp = item.component as React.ComponentType<
                { editor: Editor } & Record<string, unknown>
              >;
              return (
                <EditorComp
                  key={item.id}
                  editor={editor}
                  {...(item.props || {})}
                />
              );
            })}
          </div>

          {/* Direita */}
          <div className="flex items-center gap-1 min-w-0">
            <ThemeSwitcher />
            {session?.user.role === "teacher" && (
              <ToolbarToolsSheet
                onOpenDialog={(toolId) => setOpenModalId(toolId)}
                modalTools={Object.keys(MODAL_COMPONENTS)}
                side="right"
                studentID={studentID}
              />
            )}
          </div>
        </div>
      </div>
      {ActiveModal && (
        <ActiveModal
          isOpen={true}
          onClose={handleCloseDialog}
          editor={editor}
          studentId={studentID}
          notebookId={notebookId}
        />
      )}
    </div>
  );
};

export default Toolbar;
