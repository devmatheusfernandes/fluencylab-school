import { getSession } from "next-auth/react";
import ptVocab from "@/vocabulary/pt.json";
import esVocab from "@/vocabulary/es.json";
import deVocab from "@/vocabulary/de.json";

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
  const onlyLetters = input.normalize("NFKD").replace(/[^\p{L}]/gu, "");
  return onlyLetters.toLowerCase();
}

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
      const title = typeof it.title === "string" ? it.title : "";
      const w = normalizeWord(title);
      if (!w) continue;
      if (!isValidLength(w)) continue;
      if (seen.has(w)) continue;
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
  const langs = (s?.user?.languages || []).filter((x) => typeof x === "string");
  if (langs.length === 0) return ["en"];
  return langs.map((x) => x.toLowerCase());
}

type VocabWordEntry = {
  englishWord?: string;
  targetWord?: string;
  rank?: number;
};

type VocabFile = {
  words: VocabWordEntry[];
};

const vocabWordSetCache: Partial<Record<string, Set<string>>> = {};

function vocabFileFromLang(code: string): VocabFile | null {
  const normalized = code.toLowerCase();
  const base = normalized.split("-")[0];
  if (base === "en") return ptVocab as VocabFile;
  if (base === "pt") return ptVocab as VocabFile;
  if (base === "es") return esVocab as VocabFile;
  if (base === "de") return deVocab as VocabFile;
  return null;
}

function getVocabWordSet(code: string): Set<string> {
  const normalized = code.toLowerCase();
  const baseLang = normalized.split("-")[0];
  const existing = vocabWordSetCache[baseLang];
  if (existing) return existing;

  const file = vocabFileFromLang(baseLang);
  const set = new Set<string>();
  const list = Array.isArray(file?.words) ? file.words : [];

  for (const w of list) {
    const rawWord =
      baseLang === "en"
        ? typeof w.englishWord === "string"
          ? w.englishWord
          : ""
        : typeof w.targetWord === "string"
          ? w.targetWord
          : "";
    const normalizedWord = normalizeWord(rawWord);
    if (!normalizedWord) continue;
    set.add(normalizedWord);
  }

  vocabWordSetCache[baseLang] = set;
  return set;
}

export function wordExistsInVocabulary(word: string, lang: string): boolean {
  const normalizedLang = (lang || "").toLowerCase().split("-")[0] || "en";
  const normalizedWord = normalizeWord(word || "");
  if (!normalizedWord) return false;
  return getVocabWordSet(normalizedLang).has(normalizedWord);
}

function wordsFromVocabulary(code: string): LearnedWord[] {
  const langBase = code.toLowerCase().split("-")[0];
  const map: Record<string, VocabFile> = {
    pt: ptVocab as VocabFile,
    es: esVocab as VocabFile,
    de: deVocab as VocabFile,
  };
  const data = langBase === "en" ? (ptVocab as VocabFile) : map[langBase];
  if (!data || !Array.isArray(data.words)) return [];
  const result: LearnedWord[] = [];
  for (const w of data.words) {
    const rawWord =
      langBase === "en"
        ? typeof w.englishWord === "string"
          ? w.englishWord
          : ""
        : typeof w.targetWord === "string"
          ? w.targetWord
          : "";
    const normalized = normalizeWord(rawWord);
    if (!normalized) continue;
    if (!isValidLength(normalized)) continue;
    result.push({
      id: String(w.rank ?? rawWord),
      word: normalized,
      type: "item",
      lang: code,
    });
  }
  return result;
}

type BlockedEntry = { word: string; ts: number };

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
function isBlockedWord(word: string): boolean {
  const store = getBlockedStore();
  const now = Date.now();
  for (const entry of store) {
    if (entry.word === word) {
      const diff = now - entry.ts;
      if (diff < 2 * 24 * 60 * 60 * 1000) return true;
    }
  }
  return false;
}

// client-only
export function markWordPlayed(word: string) {
  const store = getBlockedStore();
  store.push({ word, ts: Date.now() });
  setBlockedStore(store);
}

export type PlayedEntry = {
  word: string;
  ts: number;
  success?: boolean;
  attempts?: number;
  lang?: string;
  length?: number;
};

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
    const e = store[i];
    if (e.word === entry.word) {
      store[i] = { ...e, ...entry };
      updated = true;
      break;
    }
  }
  if (!updated) {
    store.push(entry);
  }
  setHistoryStore(store);
}

// client-only
export async function getAvailableWords(): Promise<LearnedWord[]> {
  const blocked = getBlockedStore();
  const blockedSet = new Set<string>();
  const now = Date.now();
  for (const e of blocked) {
    if (now - e.ts < 2 * 24 * 60 * 60 * 1000) {
      blockedSet.add(e.word);
    }
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
  const combined = [...filteredLearned, ...fallbackFiltered];
  return combined;
}

export function pickTargetWord(words: LearnedWord[]): LearnedWord | null {
  if (!words.length) return null;
  const five = words.filter((w) => w.word.length === 5);
  if (!five.length && process.env.NODE_ENV !== "production") {
    console.warn(
      "[wordle] pickTargetWord fallback: no 5-letter words in pool",
      { total: words.length }
    );
  }
  const pool = five.length ? five : words;
  return pool[Math.floor(Math.random() * pool.length)];
}

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
    const defs = Array.isArray(data.definitions) ? data.definitions : [];
    const syns = Array.isArray(data.synonyms) ? data.synonyms : [];
    const exs = Array.isArray(data.examples) ? data.examples : [];
    return { definitions: defs, synonyms: syns, examples: exs };
  } catch {
    return { definitions: [], synonyms: [], examples: [] };
  }
}
