import type { LearnedWord, WordDetails } from "../Database";
import type { FinishedState } from "./types";

export type PersistedWordleState = {
  target: LearnedWord;
  guesses: string[];
  current: string;
  finished: FinishedState;
  details?: WordDetails | null;
  selectedLang?: string;
  savedAt: number;
};

export const WORDLE_MAX_ATTEMPTS = 6;
export const WORDLE_PERSIST_KEY = "immersion_wordle_progress";
export const WORDLE_PERSIST_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function loadPersistedWordleState(): PersistedWordleState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(WORDLE_PERSIST_KEY);
  if (!raw) return null;

  try {
    const data = JSON.parse(raw);
    if (!data) return null;
    if (typeof data.savedAt !== "number") return null;
    if (Date.now() - data.savedAt > WORDLE_PERSIST_TTL_MS) {
      localStorage.removeItem(WORDLE_PERSIST_KEY);
      return null;
    }

    const target = data.target;
    const targetWord = typeof target?.word === "string" ? target.word : "";
    const targetId = typeof target?.id === "string" ? target.id : "";
    const targetType = target?.type === "structure" ? "structure" : "item";
    const targetLang =
      typeof target?.lang === "string" ? target.lang : undefined;
    if (!targetWord || !targetId) return null;

    const finished: FinishedState =
      data.finished === "win" || data.finished === "lose"
        ? data.finished
        : null;

    const length = targetWord.length;
    const guessesRaw = Array.isArray(data.guesses) ? data.guesses : [];
    const guesses = guessesRaw
      .filter((x: unknown) => typeof x === "string")
      .map((x: string) => x.trim().toLowerCase())
      .filter((x: string) => x.length === length)
      .slice(0, WORDLE_MAX_ATTEMPTS);

    const current =
      typeof data.current === "string"
        ? data.current.trim().toLowerCase().slice(0, length)
        : "";

    const detailsRaw = data.details;
    const details: WordDetails | null =
      detailsRaw &&
      Array.isArray(detailsRaw.definitions) &&
      Array.isArray(detailsRaw.synonyms) &&
      Array.isArray(detailsRaw.examples)
        ? {
            definitions: detailsRaw.definitions.filter(
              (x: unknown) => typeof x === "string"
            ),
            synonyms: detailsRaw.synonyms.filter(
              (x: unknown) => typeof x === "string"
            ),
            examples: detailsRaw.examples.filter(
              (x: unknown) => typeof x === "string"
            ),
          }
        : null;

    const selectedLang =
      typeof data.selectedLang === "string" && data.selectedLang.trim()
        ? data.selectedLang.trim().toLowerCase()
        : undefined;

    return {
      target: {
        id: targetId,
        word: targetWord,
        type: targetType,
        lang: targetLang,
      },
      guesses,
      current,
      finished,
      details,
      selectedLang,
      savedAt: data.savedAt,
    };
  } catch {
    return null;
  }
}

export function savePersistedWordleState(
  state: Omit<PersistedWordleState, "savedAt">
) {
  if (typeof window === "undefined") return;
  const payload: PersistedWordleState = { ...state, savedAt: Date.now() };
  localStorage.setItem(WORDLE_PERSIST_KEY, JSON.stringify(payload));
}

export function clearPersistedWordleState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(WORDLE_PERSIST_KEY);
}
