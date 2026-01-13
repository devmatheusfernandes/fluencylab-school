"use client";

import React, { useState, useEffect, useRef } from "react";
import { Editor } from "@tiptap/react";
import { ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TOOL_ITEMS, ToolItem } from "./toolsConfig";
import ToolbarToolsSheet, { MODAL_COMPONENTS } from "./tools";
import { BackButton } from "@/components/ui/back-button";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

interface ToolbarProps {
  editor: Editor | null;
}

const BottomToolbar: React.FC<ToolbarProps> = ({ editor }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openModalId, setOpenModalId] = useState<string | null>(null);
  const [visibleButtons, setVisibleButtons] = useState<string[]>([]);
  const [hiddenButtons, setHiddenButtons] = useState<string[]>([]);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Configuração compartilhada de botões
  const allButtons: ToolItem[] = TOOL_ITEMS;

  useEffect(() => {
    const calculateVisibleButtons = () => {
      if (!toolbarRef.current) return;

      const containerWidth = window.innerWidth - 120; // Espaço para o botão "Mais"
      let accumulatedWidth = 0;
      const visible: string[] = [];
      const hidden: string[] = [];

      for (const button of allButtons) {
        const w = button.width ?? 50;
        if (accumulatedWidth + w <= containerWidth) {
          visible.push(button.id);
          accumulatedWidth += w;
        } else {
          if (!button.isDivider) {
            hidden.push(button.id);
          }
        }
      }
      const isDivider = (id: string) => {
        const b = allButtons.find((x) => x.id === id);
        return !!b?.isDivider;
      };
      const cleanedVisible: string[] = [];
      for (let i = 0; i < visible.length; i++) {
        const id = visible[i];
        const prev = cleanedVisible[cleanedVisible.length - 1];
        const next = visible[i + 1];
        if (isDivider(id)) {
          if (prev && !isDivider(prev) && next && !isDivider(next)) {
            cleanedVisible.push(id);
          }
        } else {
          cleanedVisible.push(id);
        }
      }

      setVisibleButtons(cleanedVisible);
      setHiddenButtons(hidden);
    };

    calculateVisibleButtons();
    window.addEventListener("resize", calculateVisibleButtons);
    return () => window.removeEventListener("resize", calculateVisibleButtons);
  }, []);

  if (!editor) {
    return null;
  }

  const renderButton = (buttonId: string) => {
    const button = allButtons.find((b) => b.id === buttonId);
    if (!button) return null;

    if (button.isDivider) {
      const DividerComp = button.component as React.ComponentType<Record<string, unknown>>;
      return <DividerComp key={buttonId} {...(button.props || {})} />;
    }
    const EditorComp = button.component as React.ComponentType<{ editor: Editor } & Record<string, unknown>>;
    const extraProps = button.id === "toolsSheet"
      ? { onOpenDialog: (toolId: string) => setOpenModalId(toolId), modalTools: Object.keys(MODAL_COMPONENTS), side: "bottom" as const }
      : {};
    return <EditorComp key={buttonId} editor={editor} {...(button.props || {})} {...extraProps} />;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Camada expandida (animada) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-background border-t border-border shadow-lg overflow-hidden"
          >
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              exit={{ y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="p-2 flex items-center justify-center gap-1 flex-wrap"
            >
              {hiddenButtons.map((buttonId, index) => (
                <motion.div
                  key={buttonId}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    duration: 0.2,
                    delay: index * 0.03,
                    ease: "easeOut",
                  }}
                >
                  {renderButton(buttonId)}
                </motion.div>
              ))}
              <motion.div
                key="tools-sheet-expanded"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <ToolbarToolsSheet
                  onOpenDialog={(toolId) => setOpenModalId(toolId)}
                  modalTools={Object.keys(MODAL_COMPONENTS)}
                  side="bottom"
                />
              </motion.div>
              <motion.div
                key="theme-switcher-expanded"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <ThemeSwitcher />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camada principal (sempre visível) */}
      <motion.div
        ref={toolbarRef}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-background border-t border-border shadow-lg"
      >
        <div className="p-2 flex items-center justify-between gap-2">
          {/* Esquerda */}
          <div className="flex items-center gap-1 min-w-0">
            <BackButton />
          </div>

          {/* Centro */}
          <div className="flex items-center gap-1 flex-1 justify-center overflow-x-auto">
            {visibleButtons.map((buttonId) => renderButton(buttonId))}
          </div>

          {/* Direita */}
          <div className="flex items-center gap-2 min-w-0">
            {hiddenButtons.length > 0 && (
              <motion.button
                onClick={() => setIsExpanded(!isExpanded)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg transition-all duration-200 text-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-1 shrink-0"
                title={isExpanded ? "Ocultar ferramentas" : "Mais ferramentas"}
              >
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronUp size={18} />
                </motion.div>
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
      {openModalId && (
        (() => {
          const ActiveModal = MODAL_COMPONENTS[openModalId!];
          return ActiveModal ? (
            <ActiveModal isOpen={true} onClose={() => setOpenModalId(null)} editor={editor} />
          ) : null;
        })()
      )}
    </div>
  );
};

export default BottomToolbar;
