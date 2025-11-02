"use client";

import React, { useState, useEffect, useRef } from "react";
import { Editor } from "@tiptap/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Divider,
  HeadingSelector,
  TextFormattingGroup,
  AlignmentGroup,
  ListGroup,
  ColorPicker,
  LinkDrawer,
  HistoryGroup,
} from "./components";
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button";
import { ColorHighlightPopover } from "@/components/tiptap-ui/color-highlight-popover";
import { BackButton } from "@/components/ui/back-button";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

interface ToolbarProps {
  editor: Editor | null;
}

const BottomToolbar: React.FC<ToolbarProps> = ({ editor }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibleButtons, setVisibleButtons] = useState<string[]>([]);
  const [hiddenButtons, setHiddenButtons] = useState<string[]>([]);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Define todos os botões/grupos disponíveis
  const allButtons = [
    { id: "heading", component: HeadingSelector, width: 140 },
    { id: "divider1", component: Divider, width: 20 },
    { id: "formatting", component: TextFormattingGroup, width: 120 },
    { id: "divider2", component: Divider, width: 20 },
    { id: "alignment", component: AlignmentGroup, width: 50 },
    { id: "divider3", component: Divider, width: 20 },
    { id: "list", component: ListGroup, width: 50 },
    { id: "divider4", component: Divider, width: 20 },
    { id: "color", component: ColorPicker, width: 50 },
    { id: "colorHighlight", component: ColorHighlightPopover, width: 50 },
    { id: "divider5", component: Divider, width: 20 },
    { id: "link", component: LinkDrawer, width: 50 },
    { id: "divider6", component: Divider, width: 20 },
    { id: "history", component: HistoryGroup, width: 90 },
    { id: "imageUpload", component: ImageUploadButton, width: 50 },
    { id: "themeswitcher", component: ThemeSwitcher, width: 50 },
  ];

  useEffect(() => {
    const calculateVisibleButtons = () => {
      if (!toolbarRef.current) return;

      const containerWidth = window.innerWidth - 120; // Espaço para o botão "Mais"
      let accumulatedWidth = 0;
      const visible: string[] = [];
      const hidden: string[] = [];

      for (const button of allButtons) {
        if (accumulatedWidth + button.width <= containerWidth) {
          visible.push(button.id);
          accumulatedWidth += button.width;
        } else {
          if (!button.id.startsWith("divider")) {
            hidden.push(button.id);
          }
        }
      }

      setVisibleButtons(visible);
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

    const Component = button.component;
    return <Component key={buttonId} editor={editor} />;
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
          <BackButton />
          <div className="flex items-center gap-1 flex-1 justify-center overflow-x-auto">
            {visibleButtons.map((buttonId) => renderButton(buttonId))}
          </div>

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
              <span className="text-sm hidden sm:inline">Mais</span>
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default BottomToolbar;
