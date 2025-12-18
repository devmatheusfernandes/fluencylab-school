"use client";

import { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { franc } from "franc-min";
import { useState } from "react";
import ReactDOM from "react-dom";
import { useSession } from "next-auth/react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDown,
  Headphones,
  Wand2,
  BookOpen,
  X,
  Loader2,
  Check,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PopoversProps = {
  editor: Editor;
};

const speechSpeeds = [
  { label: "0.5x", value: 0.5 },
  { label: "0.75x", value: 0.75 },
  { label: "Normal", value: 1 },
  { label: "1.25x", value: 1.25 },
  { label: "1.5x", value: 1.5 },
  { label: "2x", value: 2 },
];

const MODEL_NAME = "gemini-1.5-pro";
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// Variantes de animação para os Dropdowns
const dropdownVariants = {
  hidden: { opacity: 0, y: -5, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -5, scale: 0.95 },
};

function Popovers({ editor }: PopoversProps) {
  const { data: session } = useSession();

  const [selectedSpeed, setSelectedSpeed] = useState<number>(1);
  const [showSpeedOptions, setShowSpeedOptions] = useState<boolean>(false);

  const [showAiOptions, setShowAiOptions] = useState<boolean>(false);
  const [customAiPrompt, setCustomAiPrompt] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Dicionário
  const [wordInfo, setWordInfo] = useState<{
    word: string;
    definition: string;
    synonyms: string[];
    phonetics: { text: string; audio: string }[];
    examples: string[];
  } | null>(null);

  // Função chamada automaticamente pelo Tippy quando o BubbleMenu fecha
  const handleBubbleHide = () => {
    setShowSpeedOptions(false);
    setShowAiOptions(false);
  };

  const closeBubble = () => {
    setShowSpeedOptions(false);
    setShowAiOptions(false);
  };

  const readAloud = () => {
    if (!editor) return;

    const { from, to, empty } = editor.state.selection;
    const selectedText = empty
      ? ""
      : editor.state.doc.textBetween(from, to, " ");

    if (selectedText) {
      const detectedLanguage = franc(selectedText);
      const languageMap: { [key: string]: string } = {
        eng: "en",
        spa: "es",
        fra: "fr",
        deu: "de",
        rus: "ru",
        jpn: "ja",
        kor: "ko",
        por: "pt",
      };

      const langCode = languageMap[detectedLanguage] || "en";
      const speech = new SpeechSynthesisUtterance(selectedText);
      speech.lang = langCode;
      speech.rate = selectedSpeed;

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(speech);
    } else {
      toast.error("Selecione um texto para ler.");
    }
  };

  const handleSpeedChange = (speed: number) => {
    setSelectedSpeed(speed);
    setShowSpeedOptions(false);
    if (window.speechSynthesis.speaking) {
      readAloud();
    }
  };

  const fetchWordInfo = async (word: string) => {
    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
      );
      if (!response.ok) throw new Error("Word not found");

      const data = await response.json();
      const meanings = data[0]?.meanings[0];
      const definition =
        meanings?.definitions[0]?.definition || "Definição não encontrada.";
      const synonyms = meanings?.synonyms.slice(0, 5) || [];
      const examples = meanings?.definitions[0]?.example
        ? [meanings.definitions[0].example]
        : [];
      const phonetics = data[0]?.phonetics || [];

      setWordInfo({ word, definition, synonyms, phonetics, examples });
    } catch (error) {
      toast.error("Definição não encontrada.");
      setWordInfo(null);
    }
  };

  const showWordDefinition = () => {
    if (!editor) return;
    const { from, to, empty } = editor.state.selection;
    const selectedText = empty
      ? ""
      : editor.state.doc.textBetween(from, to, " ");

    if (selectedText && selectedText.split(" ").length === 1) {
      fetchWordInfo(selectedText.trim().toLowerCase());
      closeBubble();
    } else {
      toast.error("Selecione apenas uma palavra.");
    }
  };

  const processTextWithAI = async (
    prompt: string,
    selectedText: string
  ): Promise<string | null> => {
    if (!API_KEY) {
      toast.error("Chave da API não configurada.");
      return null;
    }

    setIsAiLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      const fullPrompt = `${prompt}\n\nTexto: "${selectedText}"`;

      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      return response.text();
    } catch (error: any) {
      console.error("AI Error:", error);
      toast.error("Erro ao processar com IA.");
      return null;
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiAction = async (
    actionType: "simplify" | "harden" | "questions" | "custom"
  ) => {
    const { from, to, empty } = editor.state.selection;
    const selectedText = empty
      ? ""
      : editor.state.doc.textBetween(from, to, " ");

    if (empty && actionType !== "custom") {
      toast.error("Selecione um texto para modificar.");
      return;
    }

    let prompt = "";
    switch (actionType) {
      case "simplify":
        prompt =
          "Simplifique o texto abaixo, mantendo o significado original, para um nível de leitura mais fácil.";
        break;
      case "harden":
        prompt =
          "Reescreva o texto abaixo tornando-o mais sofisticado, acadêmico e utilizando vocabulário avançado.";
        break;
      case "questions":
        prompt = "Gere 3 perguntas de compreensão sobre o texto abaixo.";
        break;
      case "custom":
        if (!customAiPrompt.trim()) {
          toast.error("Digite uma instrução.");
          return;
        }
        prompt = customAiPrompt.trim();
        break;
    }

    const aiResponse = await processTextWithAI(prompt, selectedText);

    if (aiResponse) {
      if (actionType === "questions") {
        editor
          .chain()
          .focus()
          .insertContentAt(to, `\n\n**Perguntas Geradas:**\n${aiResponse}`)
          .run();
      } else if (actionType === "custom" && !empty) {
        editor
          .chain()
          .focus()
          .deleteRange({ from, to })
          .insertContent(aiResponse)
          .run();
      } else if (!empty) {
        editor
          .chain()
          .focus()
          .deleteRange({ from, to })
          .insertContent(aiResponse)
          .run();
      } else {
        editor.chain().focus().insertContent(aiResponse).run();
      }
      toast.success("Concluído!");
    }

    setShowAiOptions(false);
    setCustomAiPrompt("");
  };

  const renderDictionaryModal = () => {
    if (!wordInfo) return null;

    return ReactDOM.createPortal(
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setWordInfo(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <Card className="bg-background shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl capitalize flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  {wordInfo.word}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setWordInfo(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <Separator />
              <ScrollArea className="max-h-[60vh]">
                <CardContent className="space-y-4 pt-4">
                  {/* Definição */}
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                      Definição
                    </h4>
                    <p className="text-sm leading-relaxed">
                      {wordInfo.definition}
                    </p>
                  </div>

                  {/* Fonética */}
                  {wordInfo.phonetics.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                        Pronúncia
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {wordInfo.phonetics.map((phonetic, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full"
                          >
                            <span className="font-mono text-sm">
                              {phonetic.text}
                            </span>
                            {phonetic.audio && (
                              <button
                                onClick={() => new Audio(phonetic.audio).play()}
                                className="hover:text-primary transition-colors"
                              >
                                <Volume2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sinônimos */}
                  {wordInfo.synonyms.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                        Sinônimos
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {wordInfo.synonyms.map((syn, idx) => (
                          <Badge key={idx} variant="secondary">
                            {syn}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Exemplos */}
                  {wordInfo.examples.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                        Exemplos
                      </h4>
                      <ul className="list-disc list-inside space-y-1">
                        {wordInfo.examples.map((ex, idx) => (
                          <li
                            key={idx}
                            className="text-sm italic text-muted-foreground"
                          >
                            "{ex}"
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </ScrollArea>
            </Card>
          </motion.div>
        </motion.div>
      </AnimatePresence>,
      document.body
    );
  };

  return (
    <>
      <BubbleMenu
        className="flex items-center gap-1 p-1 rounded-lg border bg-background/95 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/60"
        // {...({
        //   tippyOptions: {
        //     duration: 150,
        //     maxWidth: "none",
        //     onHide: handleBubbleHide,
        //   },
        // } as any)}
        editor={editor}
      >
        {/* Grupo Leitura */}
        <div className="flex items-center border-r pr-1 mr-1 gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={readAloud}
            className={cn(
              "h-8 w-8 p-0",
              window.speechSynthesis.speaking && "text-red-500 animate-pulse"
            )}
            title="Ler em voz alta"
          >
            <Headphones className="w-4 h-4" />
          </Button>

          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowSpeedOptions(!showSpeedOptions);
                setShowAiOptions(false);
              }}
              className="h-8 px-2 text-xs font-normal"
            >
              {selectedSpeed}x <ArrowDown className="w-3 h-3 ml-1 opacity-50" />
            </Button>

            <AnimatePresence>
              {showSpeedOptions && (
                <motion.div
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute top-full left-0 mt-1 w-24 bg-popover border rounded-md shadow-lg py-1 z-50 overflow-hidden"
                >
                  {speechSpeeds.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => handleSpeedChange(s.value)}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground flex items-center justify-between",
                        selectedSpeed === s.value &&
                          "bg-accent/50 text-accent-foreground font-medium"
                      )}
                    >
                      {s.label}
                      {selectedSpeed === s.value && (
                        <Check className="w-3 h-3" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Dicionário */}
        <Button
          variant="ghost"
          size="sm"
          onClick={showWordDefinition}
          className="h-8 w-8 p-0"
          title="Definição (Inglês)"
        >
          <BookOpen className="w-4 h-4" />
        </Button>

        {/* Ferramentas IA (Apenas Professor) */}
        {session?.user.role === "teacher" && (
          <>
            <div className="w-px h-4 bg-border mx-1" />
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAiOptions(!showAiOptions);
                  setShowSpeedOptions(false);
                }}
                className={cn(
                  "h-8 gap-1.5 px-2",
                  isAiLoading && "opacity-70 cursor-not-allowed"
                )}
                disabled={isAiLoading}
              >
                {isAiLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4 text-purple-500" />
                )}
                <span className="text-xs font-medium hidden sm:inline">AI</span>
              </Button>

              <AnimatePresence>
                {showAiOptions && (
                  <motion.div
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute top-full left-0 mt-1 w-64 bg-popover border rounded-md shadow-lg p-2 z-50 flex flex-col gap-1"
                  >
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Reescrever
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start h-8"
                      onClick={() => handleAiAction("simplify")}
                    >
                      Simplificar Texto
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start h-8"
                      onClick={() => handleAiAction("harden")}
                    >
                      Enriquecer Vocabulário
                    </Button>

                    <Separator className="my-1" />

                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Gerar
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start h-8"
                      onClick={() => handleAiAction("questions")}
                    >
                      Criar Perguntas
                    </Button>

                    <Separator className="my-1" />

                    <div className="p-1">
                      <input
                        className="w-full bg-muted/50 border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        placeholder="Comando personalizado..."
                        value={customAiPrompt}
                        onChange={(e) => setCustomAiPrompt(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleAiAction("custom")
                        }
                      />
                      <Button
                        size="sm"
                        className="w-full mt-2 h-7 text-xs"
                        onClick={() => handleAiAction("custom")}
                      >
                        Executar
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </BubbleMenu>

      {renderDictionaryModal()}
    </>
  );
}

export default Popovers;
