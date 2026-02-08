"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import BreadcrumbActionIcon from "./BreadcrumbActionIcon";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface BreadcrumbSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function BreadcrumbSearch({
  value,
  onChange,
  placeholder = "Search...",
}: BreadcrumbSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Se houver valor, mantemos aberto para o usuário ver o que digitou
  // Mas se ele clicar no X, limpamos e fechamos
  const handleClose = () => {
    onChange("");
    setIsOpen(false);
  };

  return (
    <>
      <BreadcrumbActionIcon
        icon={Search}
        onClick={() => setIsOpen(true)}
        className={cn(value && "text-primary")}
      />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-50 flex items-center bg-slate-200 dark:bg-slate-900 px-2"
          >
            <Search className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground min-w-0"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 ml-1 shrink-0"
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Close search</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
