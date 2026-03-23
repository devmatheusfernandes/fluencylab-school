"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  CellState,
  FinishedState,
} from "@/components/immersion/dynamics/wordle/types";
import { evaluateGuess } from "@/components/immersion/dynamics/wordle/evaluateGuess";
import {
  clearPersistedWordleState,
  loadPersistedWordleState,
  savePersistedWordleState,
  WORDLE_MAX_ATTEMPTS,
} from "@/components/immersion/dynamics/wordle/persistence";
import {
  getAvailableWords,
  getPlayedWordsHistory,
  getStudentLanguages,
  LearnedWord,
  markWordPlayed,
  pickTargetWord,
  PlayedEntry,
  recordGameResult,
  wordExistsInVocabulary,
} from "@/components/immersion/dynamics/Database";

const guessResultScore: Record<CellState, number> = {
  empty: 0,
  absent: 1,
  present: 2,
  correct: 3,
};

export function useWordleGame() {
  const initialPersisted = useMemo(() => loadPersistedWordleState(), []);
  const [loading, setLoading] = useState(() => !initialPersisted);
  const [availableLangs, setAvailableLangs] = useState<string[]>([]);
  const [selectedLang, setSelectedLang] = useState(() => {
    const persisted =
      initialPersisted?.selectedLang || initialPersisted?.target?.lang || "en";
    return persisted.toLowerCase();
  });
  const [target, setTarget] = useState<LearnedWord | null>(
    () => initialPersisted?.target ?? null,
  );
  const [guesses, setGuesses] = useState<string[]>(
    () => initialPersisted?.guesses ?? [],
  );
  const [current, setCurrent] = useState(() => initialPersisted?.current ?? "");
  const [finished, setFinished] = useState<FinishedState>(
    () => initialPersisted?.finished ?? null,
  );
  const [availableWords, setAvailableWords] = useState<LearnedWord[]>([]);
  const [shaking, setShaking] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<PlayedEntry[]>([]);

  const maxAttempts = WORDLE_MAX_ATTEMPTS;
  const length = target?.word.length || 5;
  const hydratedRef = useRef(!!initialPersisted);
  const shakeTimeoutRef = useRef<number | null>(null);

  const availableWordSet = useMemo(() => {
    const set = new Set<string>();
    for (const w of availableWords) set.add(w.word);
    return set;
  }, [availableWords]);

  const langOptions = useMemo(
    () => (availableLangs.length ? availableLangs : [selectedLang]),
    [availableLangs, selectedLang],
  );

  const evaluations = useMemo<CellState[][]>(() => {
    if (!target) return [];
    return guesses.map((g) => evaluateGuess(g, target.word));
  }, [guesses, target]);

  const liveMessage = useMemo(() => {
    if (!target) return "";
    if (guesses.length === 0) return "";

    const g = guesses[guesses.length - 1] || "";
    const ev = evaluateGuess(g, target.word);
    const counts = { correct: 0, present: 0, absent: 0 };
    for (const st of ev) {
      if (st === "correct") counts.correct += 1;
      else if (st === "present") counts.present += 1;
      else if (st === "absent") counts.absent += 1;
    }

    return `${counts.correct} letras corretas, ${counts.present} presentes, ${counts.absent} ausentes`;
  }, [guesses, target]);

  const letterStates = useMemo<Record<string, CellState>>(() => {
    const map: Record<string, CellState> = {};

    guesses.forEach((g, gi) => {
      const ev = evaluations[gi] || [];
      for (let i = 0; i < g.length; i++) {
        const ch = g[i];
        const st: CellState = ev[i] ?? "absent";
        const prev: CellState | undefined = map[ch];
        if (!prev || guessResultScore[st] > guessResultScore[prev])
          map[ch] = st;
      }
    });

    return map;
  }, [guesses, evaluations]);

  const triggerShake = useCallback(() => {
    setShaking(true);
    if (shakeTimeoutRef.current) window.clearTimeout(shakeTimeoutRef.current);
    shakeTimeoutRef.current = window.setTimeout(() => setShaking(false), 450);
  }, []);

  const openHistory = useCallback(() => {
    setHistoryEntries(getPlayedWordsHistory(30));
    setHistoryOpen(true);
  }, []);

  const startNewGame = useCallback(async (lang: string) => {
    clearPersistedWordleState();
    hydratedRef.current = false;
    setCurrent("");
    setGuesses([]);
    setFinished(null);
    setLoading(true);

    const learned = await getAvailableWords();
    setAvailableWords(learned);
    const pool = learned.filter(
      (w) => !w.lang || w.lang.toLowerCase() === lang,
    );
    const rawPick = pickTargetWord(pool.length ? pool : learned);
    const pick = rawPick && !rawPick.lang ? { ...rawPick, lang } : rawPick;
    if (pick) markWordPlayed(pick.word);
    setTarget(pick);
    setLoading(false);
    hydratedRef.current = true;
  }, []);

  const enter = useCallback(() => {
    if (finished || !target) return;

    const normalized = current.trim().toLowerCase();
    if (normalized.length !== length) {
      if (normalized.length < length) {
        toast.error("Palavra muito curta");
      }
      return;
    }

    const langForDictionary = (
      target.lang ||
      selectedLang ||
      "en"
    ).toLowerCase();
    const existsInLearnedPool = availableWordSet.has(normalized);
    const existsInVocabulary = wordExistsInVocabulary(
      normalized,
      langForDictionary,
    );

    if (!existsInLearnedPool && !existsInVocabulary) {
      triggerShake();
      toast.error("Palavra não encontrada", {
        description: "Não está no dicionário",
      });
      return;
    }

    const nextCount = guesses.length + 1;
    const win = normalized === target.word;

    setGuesses((prev) => [...prev, normalized]);

    if (win) setFinished("win");
    else if (nextCount >= maxAttempts) setFinished("lose");

    if (win || nextCount >= maxAttempts) {
      recordGameResult({
        word: target.word,
        ts: Date.now(),
        success: win,
        attempts: nextCount,
        lang: target.lang || selectedLang,
        length,
      });
    }

    setCurrent("");
  }, [
    availableWordSet,
    current,
    finished,
    guesses.length,
    length,
    maxAttempts,
    selectedLang,
    target,
    triggerShake,
  ]);

  const onLetter = useCallback(
    (ch: string) => setCurrent((p) => (p.length >= length ? p : p + ch)),
    [length],
  );

  const onBackspace = useCallback(() => setCurrent((p) => p.slice(0, -1)), []);

  // carregamento inicial
  useEffect(() => {
    let mounted = true;
    (async () => {
      const learned = await getAvailableWords();
      if (!mounted) return;
      setAvailableWords(learned);
      if (initialPersisted) return;
      const pool = learned.filter(
        (w) => !w.lang || w.lang.toLowerCase() === selectedLang,
      );
      const rawPick = pickTargetWord(pool.length ? pool : learned);
      const pick =
        rawPick && !rawPick.lang ? { ...rawPick, lang: selectedLang } : rawPick;
      if (pick) markWordPlayed(pick.word);
      setTarget(pick);
      setLoading(false);
      hydratedRef.current = true;
    })();
    return () => {
      mounted = false;
    };
  }, [initialPersisted, selectedLang]);

  // idiomas disponíveis
  useEffect(() => {
    let mounted = true;
    (async () => {
      const langs = await getStudentLanguages();
      if (!mounted) return;
      setAvailableLangs(langs);
      if (langs.length > 0 && !langs.includes(selectedLang)) {
        setSelectedLang(langs[0]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedLang]);

  // persistência
  useEffect(() => {
    if (!target || !hydratedRef.current) return;
    savePersistedWordleState({
      target,
      guesses,
      current,
      finished,
      selectedLang,
    });
  }, [current, finished, guesses, selectedLang, target]);

  // listener de teclado
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (finished || !target) return;

      if (e.key === "Enter") return enter();
      if (e.key === "Backspace") return onBackspace();

      const ch = e.key.toLowerCase();
      if (ch.length === 1 && ch >= "a" && ch <= "z") {
        onLetter(ch);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enter, finished, onBackspace, onLetter, target]);

  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current) window.clearTimeout(shakeTimeoutRef.current);
    };
  }, []);

  return {
    loading,
    target,
    guesses,
    current,
    finished,
    selectedLang,
    setSelectedLang,
    availableLangs,
    langOptions,
    maxAttempts,
    length,
    evaluations,
    letterStates,
    enter,
    startNewGame,
    onLetter,
    onBackspace,
    shaking,
    liveMessage,
    historyOpen,
    setHistoryOpen,
    historyEntries,
    openHistory,
  };
}
