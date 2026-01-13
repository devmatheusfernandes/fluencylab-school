'use server';

import { requireAuth } from '@/lib/auth';
import { deckRepository } from '@/repositories';
import { CreateDeckInput, UpdateDeckInput, Deck } from '@/types/deck';
import { UserRoles } from '@/types/users/userRoles';
import { revalidatePath } from 'next/cache';

const ALLOWED_ROLES = [UserRoles.ADMIN, UserRoles.MANAGER, UserRoles.TEACHER];

function checkPermission(role?: string) {
  if (!role || !ALLOWED_ROLES.includes(role as UserRoles)) {
    throw new Error("Unauthorized: Insufficient permissions");
  }
}

export async function createDeck(data: CreateDeckInput) {
  try {
    const user = await requireAuth();
    checkPermission(user.role);

    const deckId = await deckRepository.create(user.id, data);
    revalidatePath('/hub/teacher/decks');
    return { success: true, deckId };
  } catch (error) {
    console.error("Failed to create deck:", error);
    return { success: false, error: "Failed to create deck" };
  }
}

export async function updateDeck(deckId: string, data: UpdateDeckInput) {
  try {
    const user = await requireAuth();
    checkPermission(user.role);

    // Ideally check if user is owner or admin, but for now shared access
    await deckRepository.update(deckId, data);
    revalidatePath('/hub/teacher/decks');
    return { success: true };
  } catch (error) {
    console.error("Failed to update deck:", error);
    return { success: false, error: "Failed to update deck" };
  }
}

export async function deleteDeck(deckId: string) {
  try {
    const user = await requireAuth();
    checkPermission(user.role);

    await deckRepository.delete(deckId);
    revalidatePath('/hub/teacher/decks');
    return { success: true };
  } catch (error) {
    console.error("Failed to delete deck:", error);
    return { success: false, error: "Failed to delete deck" };
  }
}

export async function getDecks(): Promise<{ success: boolean; decks?: Deck[]; error?: string }> {
  try {
    const user = await requireAuth();
    // Students can see decks, so we don't need strict role check for viewing
    // checkPermission(user.role); 

    const decks = await deckRepository.findAll();
    
    // Serialize dates
    const serializedDecks = decks.map(deck => ({
      ...deck,
      createdAt: deck.createdAt instanceof Date ? deck.createdAt.toISOString() : deck.createdAt,
      updatedAt: deck.updatedAt instanceof Date ? deck.updatedAt.toISOString() : deck.updatedAt,
    }));

    return { success: true, decks: JSON.parse(JSON.stringify(serializedDecks)) };
  } catch (error) {
    console.error("Failed to fetch decks:", error);
    return { success: false, error: "Failed to fetch decks" };
  }
}
