// FlashcardModal.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const FlashcardModal = ({ isOpen, onClose, editor }) => {
  const [decks, setDecks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadDecks = async () => {
      if (!isOpen) return;

      try {
        const decksQuery = collection(db, 'Flashcards');
        const decksSnapshot = await getDocs(decksQuery);

        const decksData = decksSnapshot.docs.map(doc => {
          const data = doc.data();

          // Validate and provide fallbacks for missing fields
          return {
            id: doc.id,
            name: data.name || `Deck ${doc.id}`, // Fallback for missing name
            tags: Array.isArray(data.tags) ? data.tags : [], // Ensure tags is always an array
          };
        });

        setDecks(decksData);
      } catch (error) {
        console.error('Error loading decks:', error);
        toast.error('Failed to load decks');
      }
    };

    loadDecks();
  }, [isOpen]);

  const handleDeckSelect = (deckId) => {
    editor.commands.insertContent({
      type: 'flashcard',
      attrs: { deckId },
    });
    onClose();
  };

  const filteredDecks = decks.filter(deck => {
    const deckName = deck.name.toLowerCase();
    const searchTermLower = searchTerm.toLowerCase();
    const tags = deck.tags.map(tag => tag.toLowerCase());

    return (
      deckName.includes(searchTermLower) ||
      tags.some(tag => tag.includes(searchTermLower))
    );
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Selecione um Deck</DialogTitle>
        </DialogHeader>
        <Input
          type="text"
          placeholder="Procurar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full mb-4"
        />
        <div className="max-h-96 overflow-y-auto">
          {filteredDecks.length > 0 ? (
            filteredDecks.map(deck => (
              <div
                key={deck.id}
                className="p-3 mb-2 rounded hover:bg-muted cursor-pointer"
                onClick={() => handleDeckSelect(deck.id)}
              >
                <h3 className="font-semibold">{deck.name}</h3>
                {deck.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {deck.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs bg-accent px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">No decks found</p>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={onClose} variant="outline">Cancelar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FlashcardModal;