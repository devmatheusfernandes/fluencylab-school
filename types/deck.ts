export interface DeckCard {
  front: string;
  back: string;
  category?: string;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  cards: DeckCard[];
  tags: string[];
  isPublic: boolean;
  createdBy: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type CreateDeckInput = Omit<Deck, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;
export type UpdateDeckInput = Partial<Omit<Deck, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>;
