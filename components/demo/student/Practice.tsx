"use client";

import { useState } from "react";
import clsx from "clsx";
import { GamesScreen } from "@/components/demo/student/games";
import { ReviewScreen } from "@/components/demo/student/screens";

/** Praticar: revisão espaçada e jogos de imersão. */
export function PracticeScreen() {
  const [view, setView] = useState<"revisao" | "jogos">("revisao");
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold sm:text-3xl">Praticar</h2>
      <div className="inline-flex rounded-full border border-line bg-card p-1" role="tablist" aria-label="Tipo de prática">
        {(
          [
            ["revisao", "Revisão"],
            ["jogos", "Jogos de imersão"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={view === id} onClick={() => setView(id)} className={clsx("rounded-full px-4 py-1.5 text-sm font-bold", view === id ? "bg-brand text-brand-ink" : "hover:bg-cream")}>
            {label}
          </button>
        ))}
      </div>
      {view === "revisao" ? <ReviewScreen /> : <GamesScreen />}
    </div>
  );
}
