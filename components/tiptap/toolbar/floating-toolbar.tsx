"use client";

import React, { useState, useEffect, useRef } from "react";
import { Editor } from "@tiptap/react";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { motion, AnimatePresence, useDragControls, PanInfo } from "framer-motion";
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

const FloatingToolbar: React.FC<ToolbarProps> = ({ editor }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibleButtons, setVisibleButtons] = useState<string[]>([]);
  const [hiddenButtons, setHiddenButtons] = useState<string[]>([]);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

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

      const containerWidth = Math.min(window.innerWidth * 0.9, 800); // Max 800px ou 90% da tela
      let accumulatedWidth = 0;
      const visible: string[] = [];
      const hidden: string[] = [];

      for (const button of allButtons) {
        if (accumulatedWidth + button.width <= containerWidth - 120) {
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

  // Posição inicial centralizada na parte inferior
  useEffect(() => {
    const initialX = (window.innerWidth - 800) / 2;
    const initialY = window.innerHeight - 100;
    setPosition({ x: initialX, y: initialY });
  }, []);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setPosition({
      x: position.x + info.offset.x,
      y: position.y + info.offset.y,
    });
  };

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
    <motion.div
      ref={toolbarRef}
      drag
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{
        x: position.x,
        y: position.y,
      }}
      className="fixed z-99 max-w-[90vw] md:max-w-[800px]"
    >
      {/* Camada expandida (animada) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: 20 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-background/95 backdrop-blur-lg border border-border rounded-t-xl shadow-2xl overflow-hidden mb-1"
          >
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              exit={{ y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="p-3 flex items-center justify-center gap-2 flex-wrap"
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
      <div className="bg-background/95 backdrop-blur-lg border border-border rounded-xl shadow-2xl">
        <div className="p-3 flex items-center gap-2">
          {/* Drag Handle */}
          <motion.div
            onPointerDown={(e) => dragControls.start(e)}
            whileHover={{ scale: 1.1 }}
            className="cursor-grab active:cursor-grabbing p-2 hover:bg-accent rounded-lg transition-colors"
            title="Arrastar toolbar"
          >
            <GripVertical size={18} className="text-muted-foreground" />
          </motion.div>

          <BackButton />

          <Divider />

          <div className="flex items-center gap-1 flex-1 justify-center overflow-x-auto">
            {visibleButtons.map((buttonId) => renderButton(buttonId))}
          </div>

          {hiddenButtons.length > 0 && (
            <>
              <Divider />
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
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </motion.div>
                <span className="text-sm hidden sm:inline">Mais</span>
              </motion.button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FloatingToolbar;