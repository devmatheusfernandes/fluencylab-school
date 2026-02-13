"use client";

import { useState } from "react";
import { Lesson, CEFRLevel } from "@/types/learning/lesson";
import {
  analyzeLessonQuality,
  updateLessonAnalysisParams,
} from "@/actions/lessonAnalysis";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ArrowRight,
  Gauge,
  Languages,
  BookOpen,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface StepAnalysisProps {
  lesson: Lesson;
  onComplete: () => void;
}

const LANGUAGES = [
  { name: "Inglês", code: "en" },
  { name: "Português Brasileiro", code: "pt" },
  { name: "Espanhol", code: "es" },
  { name: "Francês", code: "fr" },
  { name: "Alemão", code: "de" },
  { name: "Italiano", code: "it" },
];

const LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export function StepAnalysis({ lesson, onComplete }: StepAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true);
      const result = await analyzeLessonQuality(lesson.id);

      if (result.success) {
        toast.success("Análise concluída com sucesso!");
        router.refresh();
      } else {
        toast.error("Erro ao analisar a aula: " + result.error);
      }
    } catch (error) {
      toast.error("Erro desconhecido ao analisar.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analysis = lesson.qualityAnalysis;

  const handleUpdateParams = async (
    field: "level" | "target" | "base",
    value: string,
  ) => {
    if (!analysis) return;

    setIsUpdating(true);

    let newData = {
      suggestedLevel: analysis.suggestedLevel,
      targetLanguage: analysis.targetLanguage,
      baseLanguage: analysis.baseLanguage,
      languageCode: undefined as string | undefined,
    };

    if (field === "level") newData.suggestedLevel = value as CEFRLevel;
    if (field === "target") {
      newData.targetLanguage = value;
      const langObj = LANGUAGES.find((l) => l.name === value);
      if (langObj) newData.languageCode = langObj.code;
    }
    if (field === "base") newData.baseLanguage = value;

    try {
      await updateLessonAnalysisParams(lesson.id, newData);
      toast.success("Atualizado!");
      router.refresh();
    } catch (e) {
      toast.error("Erro ao atualizar.");
    } finally {
      setIsUpdating(false);
    }
  };

  // --- Empty State ---
  if (!analysis) {
    return (
      <Card className="w-full border-2 border-dashed shadow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Gauge className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Análise de Qualidade (IA)</CardTitle>
          <CardDescription className="max-w-lg mx-auto mt-2 text-base">
            Vamos verificar se sua aula segue os padrões pedagógicos, incluindo
            estrutura, nível de proficiência e pilares de ensino.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center pb-12 pt-4">
          <Button
            size="lg"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="px-8 shadow-md"
          >
            {isAnalyzing && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            {isAnalyzing
              ? "Analisando Conteúdo..."
              : "Iniciar Análise Automática"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // --- Helpers ---
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "partial":
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "fail":
        return <XCircle className="w-5 h-5 text-rose-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pass":
        return "border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20";
      case "partial":
        return "border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20";
      case "fail":
        return "border-l-4 border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/20";
      default:
        return "";
    }
  };

  const scoreColor =
    analysis.score >= 80
      ? "text-emerald-600"
      : analysis.score >= 50
        ? "text-amber-600"
        : "text-rose-600";
  const scoreRing =
    analysis.score >= 80
      ? "ring-emerald-500/20"
      : analysis.score >= 50
        ? "ring-amber-500/20"
        : "ring-rose-500/20";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Resultado da Análise
          </h2>
          <p className="text-muted-foreground">
            Revise os parâmetros pedagógicos detectados.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="gap-2"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refazer
          </Button>
          <Button onClick={onComplete} className="gap-2 shadow-sm">
            Aceitar e Continuar <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Score & Params */}
        <div className="lg:col-span-4 space-y-6">
          {/* Score Card */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                <Gauge className="w-4 h-4" /> Qualidade Geral
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div
                className={cn(
                  "relative flex items-center justify-center w-32 h-32 rounded-full ring-8 mb-4 bg-background",
                  scoreRing,
                )}
              >
                <span
                  className={cn(
                    "text-5xl font-black tracking-tighter",
                    scoreColor,
                  )}
                >
                  {analysis.score}
                </span>
                <span className="absolute text-xs font-medium text-muted-foreground -bottom-6">
                  de 100
                </span>
              </div>
              <Badge
                variant={analysis.isCompliant ? "default" : "destructive"}
                className="px-3 py-1 text-sm mt-3"
              >
                {analysis.isCompliant ? "Aprovado" : "Requer Atenção"}
              </Badge>
            </CardContent>
          </Card>

          {/* Parameters Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Parâmetros Detectados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 py-6">
              {/* Level */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">
                  Nível Sugerido (CEFR)
                </label>
                <Select
                  value={analysis.suggestedLevel}
                  onValueChange={(val) => handleUpdateParams("level", val)}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="h-12 text-lg font-bold bg-muted/20 border-muted-foreground/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => (
                      <SelectItem key={l} value={l} className="font-medium">
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Languages */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Languages className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">Idiomas</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      Alvo (Target)
                    </span>
                    <Select
                      value={analysis.targetLanguage}
                      onValueChange={(val) => handleUpdateParams("target", val)}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="bg-muted/20 border-muted-foreground/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((l) => (
                          <SelectItem key={l.code} value={l.name}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      Base (Instrução)
                    </span>
                    <Select
                      value={analysis.baseLanguage}
                      onValueChange={(val) => handleUpdateParams("base", val)}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="bg-muted/20 border-muted-foreground/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((l) => (
                          <SelectItem key={l.code} value={l.name}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Feedback Details */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-primary/5 border-primary/20 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Info className="w-5 h-5" /> Feedback Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground/90">
                {analysis.generalFeedback}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-2">
              Detalhamento por Seção
            </h3>
            {Object.entries(analysis.sections).map(
              ([key, section]: [string, any]) => (
                <div
                  key={key}
                  className={cn(
                    "group rounded-lg border p-4 shadow-sm transition-all hover:shadow-md bg-card",
                    getStatusColor(section.status),
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex-shrink-0 bg-background rounded-full p-1 shadow-sm">
                      {getStatusIcon(section.status)}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-base capitalize flex items-center gap-2">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {section.feedback}
                      </p>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
