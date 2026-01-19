"use client";

import React, { useState } from "react";
import { Editor } from "@tiptap/react";
import { TOOL_ITEMS } from "./toolsConfig";
import { MODAL_COMPONENTS } from "./tools";
import { motion, AnimatePresence } from "framer-motion";
import { Type } from "lucide-react";

import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/image-upload-node/image-upload-node.scss";

interface ToolbarProps {
  editor: Editor | null;
  title?: string;
  onTitleChange?: (newTitle: string) => void;
  studentID?: string;
  notebookId?: string;
}

const Toolbar: React.FC<ToolbarProps> = ({
  editor,
  studentID,
  notebookId,
}) => {
  const [openModalId, setOpenModalId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!editor) {
    return null;
  }

  const handleCloseDialog = () => setOpenModalId(null);
  const ActiveModal = openModalId ? MODAL_COMPONENTS[openModalId] : null;

  return (
    <>
      <motion.div
        initial={{ y: 150, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
        className="fixed bottom-16 md:bottom-8 left-1/2 md:left-auto md:right-12 -translate-x-1/2 md:translate-x-0 z-20 sm:z-50 w-[92vw] md:w-fit max-w-3xl"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isCollapsed ? (
            <motion.button
              key="collapsed"
              type="button"
              onClick={() => setIsCollapsed(false)}
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ duration: 0.18 }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200/40 dark:border-slate-800/40 shadow-2xl text-slate-800 dark:text-slate-100 hover:bg-slate-100/95 dark:hover:bg-slate-950/95 transition-all"
              aria-label="Abrir barra de formatação"
            >
              <Type className="h-5 w-5" />
            </motion.button>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="
                bg-slate-100/75 dark:bg-slate-950/75
                backdrop-blur-xl
                border border-slate-200/30 dark:border-slate-800/30
                shadow-2xl rounded-2xl 
                px-3 py-2 md:px-4 md:py-2
                transition-all ease-in-out duration-300 
                hover:bg-slate-100/90 dark:hover:bg-slate-950/90
              "
            >
              <div className="flex items-center gap-2">
                <div
                  className="
                    flex items-center 
                    w-full
                    gap-2 md:gap-1 
                    no-scrollbar
                    overflow-x-auto
                    flex-nowrap
                    justify-start
                    md:justify-center
                    scrollbar-hide
                    py-1
                  "
                >
                  {TOOL_ITEMS.map((item) => {
                    if (item.isDivider) {
                      const DividerComp = item.component as React.ComponentType<
                        Record<string, unknown>
                      >;
                      return (
                        <div key={item.id} className="flex-shrink-0">
                          <DividerComp {...(item.props || {})} />
                        </div>
                      );
                    }

                    const EditorComp = item.component as React.ComponentType<
                      { editor: Editor } & Record<string, unknown>
                    >;

                    return (
                      <div key={item.id} className="flex-shrink-0">
                        <EditorComp editor={editor} {...(item.props || {})} />
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setIsCollapsed(true)}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-200/70 dark:bg-slate-900/70 border border-slate-300/40 dark:border-slate-700/40 text-slate-700 dark:text-slate-200 hover:bg-slate-200/90 dark:hover:bg-slate-900/90 transition-all"
                  aria-label="Recolher barra de formatação"
                >
                  <Type className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {ActiveModal && (
        <ActiveModal
          isOpen={true}
          onClose={handleCloseDialog}
          editor={editor}
          studentID={studentID}
          notebookId={notebookId}
        />
      )}
    </>
  );
};

export default Toolbar;
