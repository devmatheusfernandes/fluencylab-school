"use client";

import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { WordLookup } from "@/components/shared/Hub/WordLookup";
import { ImmersionButton } from "../ImmersionButton";

type WordleDetailsModalProps = {
  word: string;
  lang: string;
  onPlayAgain: () => void;
};

export function WordleDetailsModal({
  word,
  lang,
  onPlayAgain,
}: WordleDetailsModalProps) {
  return (
    <WordLookup word={word} lang={lang}>
      {({ detailsLoading, details, imageLoading, image, retry }) => (
        <div className="w-full max-w-lg rounded-2xl border border-border/50 bg-background/90 backdrop-blur-md p-4 sm:p-5 shadow-xl ring-1 ring-black/5 dark:ring-white/5 flex flex-col">
          {/* Cabeçalho */}
          <div className="flex flex-col items-center justify-center pb-3 border-b border-border/50">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5 rounded-full mb-1">
              Palavra do Jogo
            </span>
            <h2 className="text-2xl font-black tracking-widest text-foreground uppercase drop-shadow-sm">
              {word}
            </h2>
          </div>

          {/* Área de Scroll */}
          <div className="mt-3 overflow-y-auto max-h-[48vh] pr-1 custom-scrollbar">
            {detailsLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Spinner className="w-6 h-6 text-primary animate-spin-slow" />
                <span className="text-sm text-muted-foreground font-medium animate-pulse">
                  Buscando...
                </span>
              </div>
            ) : !details ? (
              <div className="flex flex-col items-center justify-center gap-3 py-8 text-center bg-muted/20 rounded-xl border border-dashed border-border/60">
                <div className="text-3xl opacity-50">📚</div>
                <div className="text-muted-foreground text-xs max-w-[200px]">
                  Não conseguimos encontrar os detalhes.
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full mt-1"
                  onClick={retry}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pb-1">
                {/* Imagem */}
                <div className="bg-muted/20 p-3 rounded-xl border border-border/40 space-y-2">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase opacity-80">
                    <span className="text-primary">🖼️</span> Imagem
                  </h3>
                  {imageLoading ? (
                    <div className="flex justify-center py-6">
                      <Spinner className="w-5 h-5 text-primary animate-spin-slow" />
                    </div>
                  ) : !image ? (
                    <p className="text-xs italic text-muted-foreground">
                      Sem imagem.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="relative w-full h-28 sm:h-36 overflow-hidden rounded-lg border border-border/40 bg-muted/40">
                        <Image
                          src={image.urls.regular || image.urls.small}
                          alt={image.altDescription || `Imagem de ${word}`}
                          fill
                          sizes="(max-width: 640px) 100vw, 512px"
                          className="object-cover"
                        />
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        Por{" "}
                        <a
                          className="underline hover:text-foreground"
                          href={`https://unsplash.com/@${encodeURIComponent(image.author.username)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {image.author.name}
                        </a>{" "}
                        no{" "}
                        <a
                          className="underline hover:text-foreground"
                          href={image.links.html}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Unsplash
                        </a>
                        .
                      </div>
                    </div>
                  )}
                </div>

                {/* Significados */}
                <div className="bg-muted/20 p-3 rounded-xl border border-border/40 space-y-2">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase opacity-80">
                    <span className="text-primary">📖</span> Significados
                  </h3>
                  {details.definitions.length === 0 ? (
                    <p className="text-xs italic text-muted-foreground">
                      Nenhuma definição.
                    </p>
                  ) : (
                    <ul className="space-y-1.5 text-sm text-foreground/90">
                      {details.definitions.slice(0, 3).map((d, idx) => (
                        <li
                          key={`def-${idx}`}
                          className="flex items-start gap-2 leading-tight"
                        >
                          <span className="text-primary/60 font-bold text-xs mt-0.5">
                            {idx + 1}.
                          </span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Sinônimos */}
                <div className="bg-muted/20 p-3 rounded-xl border border-border/40 space-y-2">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase opacity-80">
                    <span className="text-primary">✨</span> Sinônimos
                  </h3>
                  {details.synonyms.length === 0 ? (
                    <p className="text-xs italic text-muted-foreground">
                      Nenhum sinônimo.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {details.synonyms.slice(0, 4).map((s, idx) => (
                        <span
                          key={`syn-${idx}`}
                          className="text-[11px] px-2.5 py-0.5 rounded-full border border-border bg-background text-foreground shadow-sm font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Exemplos */}
                <div className="bg-muted/20 p-3 rounded-xl border border-border/40 space-y-2">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase opacity-80">
                    <span className="text-primary">💬</span> Exemplos
                  </h3>
                  {details.examples.length === 0 ? (
                    <p className="text-xs italic text-muted-foreground">
                      Nenhum exemplo.
                    </p>
                  ) : (
                    <div className="space-y-2 text-sm">
                      {details.examples.slice(0, 2).map((ex, idx) => (
                        <blockquote
                          key={`ex-${idx}`}
                          className="border-l-2 border-primary/40 pl-3 py-0.5 text-muted-foreground italic bg-gradient-to-r from-primary/5 to-transparent rounded-r-md leading-tight"
                        >
                          &ldquo;{ex}&rdquo;
                        </blockquote>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Botão Final */}
          <div className="mt-4 pt-3 border-t border-border/50 shrink-0">
            <ImmersionButton
              className="w-full rounded-xl font-bold text-sm h-12 shadow-md transition-transform active:scale-[0.98]"
              onClick={onPlayAgain}
            >
              Jogar Nova Palavra
            </ImmersionButton>
          </div>
        </div>
      )}
    </WordLookup>
  );
}
