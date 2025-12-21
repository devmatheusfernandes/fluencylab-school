import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface TitleEditorProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
}

export const TitleEditor: React.FC<TitleEditorProps> = ({ title, onTitleChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentTitle(title);
  }, [title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (currentTitle.trim() !== "") {
      onTitleChange(currentTitle);
    } else {
      setCurrentTitle(title); // Revert if empty
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setCurrentTitle(title);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center" style={{ width: "200px" }}>
        <Input
          ref={inputRef}
          value={currentTitle}
          onChange={(e) => setCurrentTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="h-8 text-sm font-medium"
        />
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setIsEditing(true)}
      className="flex items-center gap-2 h-8 px-2 text-sm font-medium hover:bg-muted max-w-[200px] justify-start"
      title="Clique para editar o título"
    >
      <span className="truncate">{currentTitle || "Sem título"}</span>
      <Pencil className="h-3 w-3 opacity-50 ml-1" />
    </Button>
  );
};
