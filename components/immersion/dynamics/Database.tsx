import { getSession } from "next-auth/react";
import ptWords from "@/vocabulary/palavras.json";
import enWords from "@/vocabulary/words.json";

export type LearnedWord = {
  id: string;
  word: string;
  type: "item" | "structure";
  lang?: string;
};

const WORD_LENGTH = { min: 4, max: 8 } as const;

const isValidLength = (w: string) =>
  w.length >= WORD_LENGTH.min && w.length <= WORD_LENGTH.max;

function normalizeWord(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[^\p{L}]/gu, "")
    .toLowerCase();
}

// client-only
export async function fetchLearnedWords(): Promise<LearnedWord[]> {
  try {
    const res = await fetch("/api/srs/learned", {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];
    const seen = new Set<string>();
    const words: LearnedWord[] = [];
    for (const it of items) {
      const w = normalizeWord(typeof it.title === "string" ? it.title : "");
      if (!w || !isValidLength(w) || seen.has(w)) continue;
      seen.add(w);
      words.push({
        id: String(it.id),
        word: w,
        type: it.type === "structure" ? "structure" : "item",
      });
    }
    return words;
  } catch {
    return [];
  }
}

// client-only
export async function getStudentLanguages(): Promise<string[]> {
  const s = await getSession();
  const langs = (s?.user?.languages || []).filter(
    (x): x is string => typeof x === "string"
  );
  return langs.length ? langs.map((x) => x.toLowerCase()) : ["en"];
}

// Para adicionar um novo idioma futuramente, basta importar o JSON (string[])
// e adicionar uma entrada aqui: ex. fr: frWords as string[]
const VOCAB_LISTS: Record<string, string[]> = {
  en: enWords as string[],
  pt: ptWords as string[],
};

const vocabWordSetCache: Record<string, Set<string>> = {};

function getVocabWordSet(lang: string): Set<string> {
  const base = lang.toLowerCase().split("-")[0];
  if (vocabWordSetCache[base]) return vocabWordSetCache[base];
  const set = new Set<string>();
  for (const w of VOCAB_LISTS[base] ?? []) {
    const normalized = normalizeWord(w);
    if (normalized) set.add(normalized);
  }
  return (vocabWordSetCache[base] = set);
}

export function wordExistsInVocabulary(word: string, lang: string): boolean {
  return getVocabWordSet(lang).has(normalizeWord(word));
}

export function getVocabularyWords(lang: string): string[] {
  return Array.from(getVocabWordSet(lang)).filter(isValidLength);
}

function wordsFromVocabulary(code: string): LearnedWord[] {
  const base = code.toLowerCase().split("-")[0];
  const seen = new Set<string>();
  const result: LearnedWord[] = [];
  for (const w of VOCAB_LISTS[base] ?? []) {
    const normalized = normalizeWord(w);
    if (!normalized || !isValidLength(normalized) || seen.has(normalized))
      continue;
    seen.add(normalized);
    result.push({ id: normalized, word: normalized, type: "item", lang: code });
    if (result.length >= 4000) break;
  }
  return result;
}

// ─── LocalStorage helpers ────────────────────────────────────────────────────

type BlockedEntry = { word: string; ts: number };

export type PlayedEntry = {
  word: string;
  ts: number;
  success?: boolean;
  attempts?: number;
  lang?: string;
  length?: number;
};

const BLOCKED_KEY = "immersion_wordle_blocked_words";
const HISTORY_KEY = "immersion_wordle_history";

const isBlockedEntry = (x: any): x is BlockedEntry =>
  typeof x?.word === "string" && typeof x?.ts === "number";

const isPlayedEntry = (x: any): x is PlayedEntry =>
  typeof x?.word === "string" && typeof x?.ts === "number";

// client-only
function getStore<T>(key: string, isValid: (x: any) => x is T): T[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(isValid);
  } catch {
    return [];
  }
}

// client-only
function setStore<T extends { ts: number }>(
  key: string,
  arr: T[],
  maxAgeMs: number
) {
  if (typeof window === "undefined") return;
  const now = Date.now();
  const pruned = arr.filter((x) => now - x.ts < maxAgeMs);
  localStorage.setItem(key, JSON.stringify(pruned));
}

// client-only
function getBlockedStore(): BlockedEntry[] {
  return getStore(BLOCKED_KEY, isBlockedEntry);
}

// client-only
function setBlockedStore(arr: BlockedEntry[]) {
  setStore(BLOCKED_KEY, arr, 3 * 24 * 60 * 60 * 1000);
}

// client-only
export function markWordPlayed(word: string) {
  const store = getBlockedStore();
  store.push({ word, ts: Date.now() });
  setBlockedStore(store);
}

// client-only
function getHistoryStore(): PlayedEntry[] {
  return getStore(HISTORY_KEY, isPlayedEntry);
}

// client-only
function setHistoryStore(arr: PlayedEntry[]) {
  setStore(HISTORY_KEY, arr, 30 * 24 * 60 * 60 * 1000);
}

// client-only
export function getPlayedWordsHistory(days: number = 7): PlayedEntry[] {
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  return getHistoryStore()
    .filter((x) => x.ts >= cutoff)
    .sort((a, b) => b.ts - a.ts);
}

// client-only
export function recordGameResult(entry: PlayedEntry) {
  const store = getHistoryStore();
  let updated = false;
  for (let i = store.length - 1; i >= 0; i--) {
    if (store[i].word === entry.word) {
      store[i] = { ...store[i], ...entry };
      updated = true;
      break;
    }
  }
  if (!updated) store.push(entry);
  setHistoryStore(store);
}

// ─── Word selection ──────────────────────────────────────────────────────────

// client-only
export async function getAvailableWords(): Promise<LearnedWord[]> {
  const blocked = getBlockedStore();
  const blockedSet = new Set<string>();
  const now = Date.now();
  for (const e of blocked) {
    if (now - e.ts < 2 * 24 * 60 * 60 * 1000) blockedSet.add(e.word);
  }

  const learned = await fetchLearnedWords();
  const filteredLearned = learned.filter((w) => !blockedSet.has(w.word));
  if (filteredLearned.length >= 10) return filteredLearned;

  const langs = await getStudentLanguages();
  const fallback: LearnedWord[] = [];
  for (const code of langs) {
    fallback.push(...wordsFromVocabulary(code));
  }

  const seen = new Set(filteredLearned.map((w) => w.word));
  const fallbackFiltered = fallback.filter(
    (w) => !seen.has(w.word) && !blockedSet.has(w.word)
  );

  return [...filteredLearned, ...fallbackFiltered];
}

export function pickTargetWord(words: LearnedWord[]): LearnedWord | null {
  if (!words.length) return null;
  const five = words.filter((w) => w.word.length === 5);
  if (!five.length && process.env.NODE_ENV !== "production") {
    console.warn(
      "[wordle] pickTargetWord fallback: no 5-letter words in pool",
      {
        total: words.length,
      }
    );
  }
  const pool = five.length ? five : words;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Word details ────────────────────────────────────────────────────────────

export type WordDetails = {
  definitions: string[];
  synonyms: string[];
  examples: string[];
};

// client-only
export async function fetchWordDetails(
  word: string,
  lang: string
): Promise<WordDetails> {
  try {
    const url = new URL("/api/words/definition", window.location.origin);
    url.searchParams.set("q", word);
    url.searchParams.set("lang", (lang || "en").toLowerCase());
    const res = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) return { definitions: [], synonyms: [], examples: [] };
    const data = await res.json();
    return {
      definitions: Array.isArray(data.definitions) ? data.definitions : [],
      synonyms: Array.isArray(data.synonyms) ? data.synonyms : [],
      examples: Array.isArray(data.examples) ? data.examples : [],
    };
  } catch {
    return { definitions: [], synonyms: [], examples: [] };
  }
}
