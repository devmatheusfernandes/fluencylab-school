'use client';

import { Deck } from '@/types/deck';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Calendar, Layers } from 'lucide-react';
import { deleteDeck } from '@/actions/decks';
import { format } from 'date-fns';
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
} from '@/components/ui/modal';
import { useState } from 'react';
import { toast } from 'sonner';

interface DeckListProps {
  decks: Deck[];
  onEdit: (deck: Deck) => void;
  onRefresh: () => void;
}

export function DeckList({ decks, onEdit, onRefresh }: DeckListProps) {
  const [deckToDelete, setDeckToDelete] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deckToDelete) return;

    const res = await deleteDeck(deckToDelete);
    if (res.success) {
      toast( 'Deck deleted successfully' );
      onRefresh();
    } else {
      toast('Failed to delete deck');
    }
    setDeckToDelete(null);
  };

  if (decks.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/50">
        <Layers className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-lg font-semibold text-muted-foreground">No decks found</h3>
        <p className="text-sm text-muted-foreground/80">Create your first deck to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {decks.map((deck) => (
          <Card key={deck.id} className="flex flex-col h-full hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex justify-between items-start gap-2">
                <span className="truncate" title={deck.title}>{deck.title}</span>
              </CardTitle>
              <CardDescription className="line-clamp-2 min-h-[40px]">
                {deck.description || 'No description'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex flex-wrap gap-2 mb-4">
                {deck.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-muted rounded-md text-xs font-medium text-muted-foreground">
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center text-sm text-muted-foreground gap-4">
                <div className="flex items-center gap-1">
                  <Layers className="w-4 h-4" />
                  <span>{deck.cards?.length || 0} cards</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(deck.updatedAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="ghost" size="sm" onClick={() => onEdit(deck)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setDeckToDelete(deck.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Modal open={!!deckToDelete} onOpenChange={(open) => !open && setDeckToDelete(null)}>
        <ModalContent>
          <ModalIcon type="delete" />
          <ModalHeader>
            <ModalTitle>Delete Deck</ModalTitle>
            <ModalDescription>
              Are you sure you want to delete this deck? This action cannot be undone.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalSecondaryButton onClick={() => setDeckToDelete(null)}>
              Cancel
            </ModalSecondaryButton>
            <ModalPrimaryButton variant="destructive" onClick={handleDelete}>
              Confirm Delete
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
