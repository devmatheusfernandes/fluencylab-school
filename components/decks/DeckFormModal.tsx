'use client';

import { useState, useRef } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalIcon,
  ModalPrimaryButton,
  ModalSecondaryButton,
  ModalBody,
  ModalField,
  ModalInput,
} from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Deck, DeckCard, CreateDeckInput, UpdateDeckInput } from '@/types/deck';
import { createDeck, updateDeck } from '@/actions/decks';
import { Trash2, Plus, Upload, FileJson } from 'lucide-react';
import { toast } from 'sonner';

interface DeckFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deckToEdit?: Deck | null;
  onSuccess: () => void;
}

export function DeckFormModal({ open, onOpenChange, deckToEdit, onSuccess }: DeckFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(deckToEdit?.title || '');
  const [description, setDescription] = useState(deckToEdit?.description || '');
  const [tags, setTags] = useState(deckToEdit?.tags?.join(', ') || '');
  const [cards, setCards] = useState<DeckCard[]>(deckToEdit?.cards || []);
  const [jsonInput, setJsonInput] = useState('');
  const [showJsonImport, setShowJsonImport] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!title) {
      toast('Title is required');
      return;
    }

    setLoading(true);
    try {
      const deckData: CreateDeckInput = {
        title,
        description,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        cards,
        isPublic: true, // Default to public for now
      };

      let result;
      if (deckToEdit) {
        result = await updateDeck(deckToEdit.id, deckData);
      } else {
        result = await createDeck(deckData);
      }

      if (result.success) {
        toast(`Deck ${deckToEdit ? 'updated' : 'created'} successfully`);
        onSuccess();
        onOpenChange(false);
      } else {
        toast(result.error);
      }
    } catch (error) {
      toast('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleJsonImport = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (Array.isArray(parsed)) {
        // Assume array of cards
        setCards([...cards, ...parsed]);
      } else if (parsed.cards && Array.isArray(parsed.cards)) {
        // Assume deck object
        setCards([...cards, ...parsed.cards]);
        if (parsed.title && !title) setTitle(parsed.title);
        if (parsed.description && !description) setDescription(parsed.description);
      } else {
        toast('Invalid JSON format');
        return;
      }
      setJsonInput('');
      setShowJsonImport(false);
      toast('Cards imported successfully');
    } catch (e) {
      toast('Invalid JSON');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        // Reuse import logic
        if (Array.isArray(parsed)) {
          setCards([...cards, ...parsed]);
        } else if (parsed.cards && Array.isArray(parsed.cards)) {
          setCards([...cards, ...parsed.cards]);
          if (parsed.title && !title) setTitle(parsed.title);
          if (parsed.description && !description) setDescription(parsed.description);
        }
        toast('File imported successfully');
      } catch (e) {
        toast('Failed to parse file');
      }
    };
    reader.readAsText(file);
  };

  const addCard = () => {
    setCards([...cards, { front: '', back: '' }]);
  };

  const updateCard = (index: number, field: keyof DeckCard, value: string) => {
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], [field]: value };
    setCards(newCards);
  };

  const removeCard = (index: number) => {
    setCards(cards.filter((_, i) => i !== index));
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <ModalIcon type={deckToEdit ? "edit" : "document"} />
        <ModalHeader>
          <ModalTitle>{deckToEdit ? 'Edit Deck' : 'Create New Deck'}</ModalTitle>
          <ModalDescription>
            {deckToEdit ? 'Update existing deck details and cards.' : 'Create a new collection of flashcards.'}
          </ModalDescription>
        </ModalHeader>

        <ModalBody>
          <div className="grid grid-cols-2 gap-4">
            <ModalField label="Title" required>
              <ModalInput 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g. Basic Spanish Vocabulary" 
              />
            </ModalField>
            <ModalField label="Tags">
              <ModalInput 
                value={tags} 
                onChange={(e) => setTags(e.target.value)} 
                placeholder="Comma separated tags" 
              />
            </ModalField>
          </div>

          <ModalField label="Description">
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Describe the contents of this deck..." 
              className="resize-none"
            />
          </ModalField>

          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Cards ({cards.length})</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowJsonImport(!showJsonImport)}>
                  <FileJson className="w-4 h-4 mr-2" />
                  Import JSON
                </Button>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".json" 
                  onChange={handleFileUpload} 
                />
                <Button onClick={addCard} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Card
                </Button>
              </div>
            </div>

            {showJsonImport && (
              <div className="bg-muted p-4 rounded-md mb-4">
                <Textarea 
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Paste JSON here... format: [{ 'front': '...', 'back': '...' }]"
                  className="mb-2 font-mono text-xs"
                  rows={5}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowJsonImport(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleJsonImport}>Import</Button>
                </div>
              </div>
            )}

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {cards.map((card, index) => (
                <div key={index} className="flex gap-4 items-start bg-card p-3 rounded-md border">
                  <div className="flex-1 space-y-2">
                    <Textarea 
                      value={card.front} 
                      onChange={(e) => updateCard(index, 'front', e.target.value)}
                      placeholder="Front"
                      className="min-h-[60px]"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Textarea 
                      value={card.back} 
                      onChange={(e) => updateCard(index, 'back', e.target.value)}
                      placeholder="Back"
                      className="min-h-[60px]"
                    />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeCard(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {cards.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No cards yet. Add manually or import JSON.
                </div>
              )}
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <ModalSecondaryButton onClick={() => onOpenChange(false)}>
            Cancel
          </ModalSecondaryButton>
          <ModalPrimaryButton onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save Deck'}
          </ModalPrimaryButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
