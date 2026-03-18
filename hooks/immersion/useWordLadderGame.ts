"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { CellState } from "@/components/immersion/dynamics/wordle/types";
import { evaluateGuess } from "@/components/immersion/dynamics/wordle/evaluateGuess";
import {
  getStudentLanguages,
  getVocabularyWords,
  wordExistsInVocabulary,
} from "@/components/immersion/dynamics/Database";
import {
  clearPersistedWordLadderState,
  loadPersistedWordLadderState,
  savePersistedWordLadderState,
  WORD_LADDER_MAX_ROWS,
} from "@/components/immersion/dynamics/word-ladder/persistence";

const DEFAULT_LENGTH = 5 as const;
const MAX_GENERATION_ATTEMPTS = 30;
const MAX_PATH_LENGTH = WORD_LADDER_MAX_ROWS;

const guessResultScore: Record<CellState, number> = {
  empty: 0,
  absent: 1,
  present: 2,
  correct: 3,
};

function differsByOne(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) diff += 1;
    if (diff > 1) return false;
  }
  return diff === 1;
}

function buildPatternIndex(words: string[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const w of words) {
    for (let i = 0; i < w.length; i++) {
      const key = `${w.slice(0, i)}*${w.slice(i + 1)}`;
      const arr = map.get(key);
      if (arr) arr.push(w);
      else map.set(key, [w]);
    }
  }
  return map;
}

function neighbors(word: string, index: Map<string, string[]>): string[] {
  const out = new Set<string>();
  for (let i = 0; i < word.length; i++) {
    const key = `${word.slice(0, i)}*${word.slice(i + 1)}`;
    const arr = index.get(key) || [];
    for (const w of arr) {
      if (w !== word) out.add(w);
    }
  }
  return Array.from(out);
}

function shortestPath(
  start: string,
  goal: string,
  index: Map<string, string[]>
): string[] | null {
  if (start === goal) return [start];
  const q: string[] = [start];
  const prev = new Map<string, string | null>();
  prev.set(start, null);

  for (let qi = 0; qi < q.length; qi++) {
    const cur = q[qi];
    const ns = neighbors(cur, index);
    for (const n of ns) {
      if (prev.has(n)) continue;
      prev.set(n, cur);
      if (n === goal) {
        const path: string[] = [];
        let p: string | null = n;
        while (p) {
          path.push(p);
          p = prev.get(p) ?? null;
        }
        return path.reverse();
      }
      q.push(n);
    }
  }
  return null;
}

function pickPuzzle(words: string[], index: Map<string, string[]>) {
  if (words.length < 2) return null;
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const start = words[Math.floor(Math.random() * words.length)];
    const goal = words[Math.floor(Math.random() * words.length)];
    if (start === goal) continue;
    const path = shortestPath(start, goal, index);
    if (!path) continue;
    if (path.length <= 2) continue;
    if (path.length > MAX_PATH_LENGTH) continue;
    return { start, goal, solution: path };
  }
  return null;
}

export function useWordLadderGame() {
  const [loading, setLoading] = useState(true);
  const [availableLangs, setAvailableLangs] = useState<string[]>([]);
  const [selectedLang, setSelectedLang] = useState("en");
  const length = DEFAULT_LENGTH;

  const [startWord, setStartWord] = useState<string>("");
  const [goalWord, setGoalWord] = useState<string>("");
  const [solution, setSolution] = useState<string[] | null>(null);

  const [steps, setSteps] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [finished, setFinished] = useState(false);
  const [learningMode, setLearningMode] = useState(true);

  const [shaking, setShaking] = useState(false);
  const shakeTimeoutRef = useRef<number | null>(null);

  const langOptions = useMemo(
    () => (availableLangs.length ? availableLangs : [selectedLang]),
    [availableLangs, selectedLang]
  );

  const evaluations = useMemo(() => {
    if (!goalWord) return [] as CellState[][];
    return steps.map((w) => evaluateGuess(w, goalWord));
  }, [goalWord, steps]);

  const letterStates = useMemo<Record<string, CellState>>(() => {
    const map: Record<string, CellState> = {};

    steps.forEach((w, wi) => {
      const ev = evaluations[wi] || [];
      for (let i = 0; i < w.length; i++) {
        const ch = w[i];
        const st: CellState = ev[i] ?? "absent";
        const prev: CellState | undefined = map[ch];
        if (!prev || guessResultScore[st] > guessResultScore[prev])
          map[ch] = st;
      }
    });

    return map;
  }, [evaluations, steps]);

  const triggerShake = useCallback(() => {
    setShaking(true);
    if (shakeTimeoutRef.current) window.clearTimeout(shakeTimeoutRef.current);
    shakeTimeoutRef.current = window.setTimeout(() => setShaking(false), 450);
  }, []);

  const startNewGame = useCallback(
    async (lang: string) => {
      clearPersistedWordLadderState();
      setLoading(true);
      setFinished(false);
      setCurrent("");
      setSolution(null);

      const normalizedLang = (lang || "en").toLowerCase();
      const words = getVocabularyWords(normalizedLang).filter(
        (w) => w.length === length
      );

      if (words.length < 2) {
        setStartWord("");
        setGoalWord("");
        setSteps([]);
        setLoading(false);
        return;
      }

      const idx = buildPatternIndex(words);
      const puzzle = pickPuzzle(words, idx);
      if (!puzzle) {
        setStartWord(words[0]);
        setGoalWord(words[1]);
        setSolution(null);
        setSteps([words[0]]);
        setLoading(false);
        return;
      }

      setStartWord(puzzle.start);
      setGoalWord(puzzle.goal);
      setSolution(puzzle.solution);
      setSteps([puzzle.start]);
      setLoading(false);
    },
    [length]
  );

  const enter = useCallback(() => {
    if (loading || finished) return;
    if (!goalWord) return;

    const normalized = current.trim().toLowerCase();
    if (normalized.length !== length) {
      if (normalized.length < length) toast.error("Palavra muito curta");
      return;
    }

    if (!wordExistsInVocabulary(normalized, selectedLang)) {
      triggerShake();
      toast.error("Palavra não encontrada", {
        description: "Não está no dicionário",
      });
      return;
    }

    const prev = steps[steps.length - 1] || "";
    if (!differsByOne(prev, normalized)) {
      triggerShake();
      toast.error("Mude apenas 1 letra");
      return;
    }

    if (steps.includes(normalized)) {
      triggerShake();
      toast.error("Palavra já usada");
      return;
    }

    const next = [...steps, normalized];
    setSteps(next);
    setCurrent("");

    if (normalized === goalWord) {
      setFinished(true);
      return;
    }

    if (next.length >= MAX_PATH_LENGTH) {
      setFinished(true);
      return;
    }
  }, [
    current,
    finished,
    goalWord,
    length,
    loading,
    selectedLang,
    steps,
    triggerShake,
  ]);

  const onLetter = useCallback(
    (ch: string) => setCurrent((p) => (p.length >= length ? p : p + ch)),
    [length]
  );

  const onBackspace = useCallback(() => setCurrent((p) => p.slice(0, -1)), []);

  const hint = useCallback(() => {
    if (loading || finished) return;
    if (!solution || !solution.length) return;
    const next = solution[steps.length];
    if (!next) return;
    setCurrent(next);
    toast.message("Dica aplicada");
  }, [finished, loading, solution, steps.length]);

  const revealSolution = useCallback(() => {
    if (!solution) return;
    setSteps(solution);
    setCurrent("");
    setFinished(true);
  }, [solution]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const langs = await getStudentLanguages();
      if (!mounted) return;
      const normalized = langs.map((l) => l.toLowerCase());
      setAvailableLangs(normalized);
      const persisted = loadPersistedWordLadderState();
      if (persisted) {
        const initialLang = normalized.includes(persisted.selectedLang)
          ? persisted.selectedLang
          : normalized[0] || "en";
        setSelectedLang(initialLang);
        const okStart = wordExistsInVocabulary(
          persisted.startWord,
          initialLang
        );
        const okGoal = wordExistsInVocabulary(persisted.goalWord, initialLang);
        const okSteps = persisted.steps.every((w) =>
          wordExistsInVocabulary(w, initialLang)
        );
        if (okStart && okGoal && okSteps) {
          setStartWord(persisted.startWord);
          setGoalWord(persisted.goalWord);
          setSolution(persisted.solution ?? null);
          setSteps(
            persisted.steps.length ? persisted.steps : [persisted.startWord]
          );
          setCurrent(persisted.current);
          setFinished(
            persisted.finished ||
              (persisted.steps.length >= MAX_PATH_LENGTH &&
                persisted.steps[persisted.steps.length - 1] !==
                  persisted.goalWord)
          );
          setLearningMode(persisted.learningMode);
          setLoading(false);
          return;
        }
        clearPersistedWordLadderState();
      }

      const initial = normalized[0] || "en";
      setSelectedLang(initial);
      await startNewGame(initial);
    })();
    return () => {
      mounted = false;
    };
  }, [startNewGame]);

  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current) window.clearTimeout(shakeTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!startWord || !goalWord) return;
    if (finished) return;
    if (steps.length < MAX_PATH_LENGTH) return;
    if (steps[steps.length - 1] === goalWord) return;
    queueMicrotask(() => setFinished(true));
  }, [finished, goalWord, loading, startWord, steps]);

  useEffect(() => {
    if (loading) return;
    if (!startWord || !goalWord) return;
    savePersistedWordLadderState({
      selectedLang: selectedLang.toLowerCase(),
      length,
      startWord,
      goalWord,
      steps,
      current,
      finished,
      learningMode,
      solution,
    });
  }, [
    current,
    finished,
    goalWord,
    learningMode,
    length,
    loading,
    selectedLang,
    solution,
    startWord,
    steps,
  ]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (loading) return;
      if (e.key === "Enter") return enter();
      if (e.key === "Backspace") return onBackspace();
      const ch = e.key.toLowerCase();
      if (ch.length === 1 && ch >= "a" && ch <= "z") onLetter(ch);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enter, loading, onBackspace, onLetter]);

  const status = useMemo(() => {
    if (loading) return "loading";
    if (!startWord || !goalWord) return "empty";
    if (!finished) return "playing";
    const won = steps[steps.length - 1] === goalWord;
    return won ? "win" : "end";
  }, [finished, goalWord, loading, startWord, steps]);

  const learningWord = steps[steps.length - 1] || "";

  return {
    loading,
    status,
    selectedLang,
    setSelectedLang,
    langOptions,
    length,
    startWord,
    goalWord,
    steps,
    current,
    setCurrent,
    evaluations,
    letterStates,
    enter,
    onLetter,
    onBackspace,
    startNewGame,
    hint,
    revealSolution,
    hasSolution: !!solution,
    learningMode,
    setLearningMode,
    learningWord,
    shaking,
  };
}
