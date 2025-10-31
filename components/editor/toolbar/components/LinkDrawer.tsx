import React, { useState } from "react";
import { Editor } from "@tiptap/react";
import { Link, ExternalLink } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LinkDrawerProps {
  editor: Editor;
}

const LinkDrawer: React.FC<LinkDrawerProps> = ({ editor }) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");

  const handleOpen = () => {
    const previousUrl = editor.getAttributes("link").href || "";
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");

    setUrl(previousUrl);
    setText(selectedText);
    setOpen(true);
  };

  const handleSave = () => {
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setOpen(false);
      return;
    }

    // Se houver texto selecionado ou texto digitado, aplicar o link
    if (text) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .command(({ tr }) => {
          const { from, to } = tr.selection;
          if (from === to || !tr.doc.textBetween(from, to, " ")) {
            tr.insertText(text);
          }
          return true;
        })
        .run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }

    setOpen(false);
    setUrl("");
    setText("");
  };

  const handleRemove = () => {
    editor.chain().focus().unsetLink().run();
    setOpen(false);
    setUrl("");
    setText("");
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          onClick={handleOpen}
          className={`
            p-2 rounded-lg transition-all duration-200 
            ${
              editor.isActive("link")
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground hover:bg-accent hover:text-accent-foreground"
            }
            active:scale-95
          `}
          title="Adicionar link (Ctrl+K)"
        >
          <Link size={18} />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <ExternalLink size={20} />
              Adicionar Link
            </DrawerTitle>
            <DrawerDescription>
              Insira a URL e o texto do link que deseja adicionar.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link-text">Texto do Link</Label>
              <Input
                id="link-text"
                placeholder="Ex: Clique aqui"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="input-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                type="url"
                placeholder="https://exemplo.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="input-base"
              />
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={handleSave} className="w-full">
              Salvar Link
            </Button>
            {editor.isActive("link") && (
              <Button
                variant="outline"
                onClick={handleRemove}
                className="w-full"
              >
                Remover Link
              </Button>
            )}
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default LinkDrawer;