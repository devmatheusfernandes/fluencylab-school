"use client";

import React, { useState } from "react";
import { Editor } from "@tiptap/react";
import { TOOL_ITEMS } from "./toolsConfig";
import { MODAL_COMPONENTS } from "./tools";
import { motion } from "framer-motion";

// Seus imports de CSS
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

  if (!editor) {
    return null;
  }

  const handleCloseDialog = () => setOpenModalId(null);
  const ActiveModal = openModalId ? MODAL_COMPONENTS[openModalId] : null;

  return (
    <>
      <motion.div
        initial={{ y: 150, opacity: 0, x: "-50%" }}
        animate={{ y: 0, opacity: 1, x: "-50%" }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
        // AJUSTES MOBILE:
        // 1. bottom-4: Um pouco mais perto do polegar no mobile.
        // 2. w-[92vw]: Ocupa quase toda a largura no celular.
        // 3. md:w-fit: No desktop, ocupa apenas o espaço necessário.
        className="fixed bottom-16 md:bottom-8 left-1/2 z-20 sm:z-50 w-[92vw] md:w-fit max-w-3xl"
      >
        <div
          className="
            bg-slate-100/75 dark:bg-slate-950/75
            backdrop-blur-xl
            border border-slate-200/30 dark:border-slate-800/30
            shadow-2xl rounded-2xl 
            px-3 py-2 md:px-4 md:py-2 /* Padding levemente menor no mobile para ganhar espaço */
            transition-all ease-in-out duration-300 
            hover:bg-slate-100/90 dark:hover:bg-slate-950/90 /* Aumentei opacidade no hover para leitura */
          "
        >
          {/* Container Flex ajustado para Scroll Horizontal */}
          <div className="flex items-center w-full">
            
            <div className="
              flex items-center 
              w-full
              gap-2 md:gap-1 
              no-scrollbar
              /* Lógica de Scroll Mobile vs Desktop */
              overflow-x-auto        /* Habilita scroll horizontal */
              flex-nowrap            /* Impede quebra de linha (vital para mobile) */
              justify-start          /* Alinha ao início para permitir scroll correto no mobile */
              md:justify-center      /* Centraliza no desktop se houver espaço */
              
              scrollbar-hide         /* Esconde a barra de rolagem visualmente */
              py-1                   /* Pequeno respiro vertical */
            ">
              {TOOL_ITEMS.map((item) => {
                // Divider
                if (item.isDivider) {
                  const DividerComp = item.component as React.ComponentType<
                    Record<string, unknown>
                  >;
                  // No mobile, divisores verticais às vezes atrapalham o toque, 
                  // podemos dar uma margem extra ou ocultar se desejar.
                  return (
                    <div key={item.id} className="flex-shrink-0">
                       <DividerComp {...(item.props || {})} />
                    </div>
                  );
                }

                // Editor Component (Botões)
                const EditorComp = item.component as React.ComponentType<
                  { editor: Editor } & Record<string, unknown>
                >;
                
                return (
                  // flex-shrink-0 impede que os botões sejam esmagados quando falta espaço
                  <div key={item.id} className="flex-shrink-0">
                    <EditorComp
                      editor={editor}
                      {...(item.props || {})}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
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