'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DeckFormModal } from './DeckFormModal';
import { DeckList } from './DeckList';
import { Deck } from '@/types/deck';
import { getDecks } from '@/actions/decks';

export function DeckManager() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);

  const loadDecks = async () => {
    const res = await getDecks();
    if (res.success && res.decks) {
      setDecks(res.decks);
    }
  };

  useEffect(() => {
    loadDecks();
  }, []);

  const handleCreate = () => {
    setEditingDeck(null);
    setIsModalOpen(true);
  };

  const handleEdit = (deck: Deck) => {
    setEditingDeck(deck);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Flashcard Decks</h2>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Deck
        </Button>
      </div>

      <DeckList decks={decks} onEdit={handleEdit} onRefresh={loadDecks} />

      {isModalOpen && (
        <DeckFormModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          deckToEdit={editingDeck}
          onSuccess={loadDecks}
        />
      )}
    </div>
  );
}
