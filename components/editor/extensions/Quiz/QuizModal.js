// QuizModal.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const QuizModal = ({ isOpen, onClose, editor }) => {
  const [decks, setDecks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState('');

  useEffect(() => {
    const loadDecks = async () => {
      if (!isOpen) return;

      try {
        const decksQuery = collection(db, 'Quizzes');
        const decksSnapshot = await getDocs(decksQuery);

        const decksData = decksSnapshot.docs.map(doc => {
          const data = doc.data();

          // Validate and provide fallbacks for missing fields
          return {
            id: doc.id,
            deckTitle: data.deckTitle || `Quiz ${doc.id}`, // Fallback for missing title
            deckDescription: data.deckDescription || 'Sem descrição',
            tags: Array.isArray(data.tags) ? data.tags : [], // Ensure tags is always an array
            questions: Array.isArray(data.questions) ? data.questions : [],
          };
        });

        setDecks(decksData);
      } catch (error) {
        console.error('Error loading quiz decks:', error);
        toast.error('Failed to load quiz decks');
      }
    };

    loadDecks();
  }, [isOpen]);

  const handleDeckSelect = (deckId) => {
    editor.commands.insertContent({
      type: 'quiz',
      attrs: { deckId },
    });
    onClose();
  };

  // Get all unique tags
  const getAllTags = () => {
    const allTags = new Set();
    decks.forEach((deck) => {
      deck.tags?.forEach((tag) => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  };

  const filteredDecks = decks.filter(deck => {
    const deckTitle = deck.deckTitle.toLowerCase();
    const searchTermLower = searchTerm.toLowerCase();
    const tags = deck.tags.map(tag => tag.toLowerCase());

    const matchesSearch = deckTitle.includes(searchTermLower) ||
      tags.some(tag => tag.includes(searchTermLower));
    
    const matchesTag = selectedTagFilter === '' || 
      (deck.tags && deck.tags.includes(selectedTagFilter));

    return matchesSearch && matchesTag;
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Selecione um Quiz</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 mb-4">
          <Input
            type="text"
            placeholder="Procurar quiz..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Select value={selectedTagFilter} onValueChange={setSelectedTagFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todas as tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as tags</SelectItem>
              {getAllTags().map((tag) => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {filteredDecks.length > 0 ? (
            filteredDecks.map(deck => (
              <div
                key={deck.id}
                className="p-3 mb-2 rounded hover:bg-muted cursor-pointer border"
                onClick={() => handleDeckSelect(deck.id)}
              >
                <h3 className="font-semibold">{deck.deckTitle}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {deck.deckDescription}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs bg-accent px-2 py-1 rounded">
                    {deck.questions.length} perguntas
                  </span>
                  {deck.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {deck.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs bg-accent px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {deck.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{deck.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">Nenhum quiz encontrado</p>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={onClose} variant="outline">Cancelar</Button>
        </div>
        <Toaster />
      </DialogContent>
    </Dialog>
  );
};

export default QuizModal;

