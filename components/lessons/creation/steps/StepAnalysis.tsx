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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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

  if (!analysis) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Análise de Qualidade (IA)</CardTitle>
          <CardDescription>
            Vamos verificar se sua aula segue os padrões pedagógicos da
            FluencyLab. Isso inclui verificação de estrutura, nível e pilares de
            ensino.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 space-y-6">
          <div className="p-4 bg-muted rounded-full">
            <RefreshCw className="w-12 h-12 text-muted-foreground" />
          </div>
          <Button size="lg" onClick={handleAnalyze} disabled={isAnalyzing}>
            {isAnalyzing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isAnalyzing ? "Analisando..." : "Iniciar Análise"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "partial":
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "fail":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pass":
        return "text-green-700 bg-green-50 border-green-200";
      case "partial":
        return "text-amber-700 bg-amber-50 border-amber-200";
      case "fail":
        return "text-red-700 bg-red-50 border-red-200";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Resultado da Análise</h2>
        <Button onClick={onComplete} className="gap-2">
          Continuar <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Pontuação Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.score}/100</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analysis.isCompliant ? "Aprovado" : "Requer Atenção"}
            </p>
          </CardContent>
        </Card>

        {/* Editable Level */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Nível Sugerido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={analysis.suggestedLevel}
              onValueChange={(val) => handleUpdateParams("level", val)}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-full text-xl font-bold h-12 border-none shadow-none px-0 hover:bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Baseado no vocabulário
            </p>
          </CardContent>
        </Card>

        {/* Editable Languages */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Idiomas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground uppercase font-bold">
                Target (Alvo)
              </label>
              <Select
                value={analysis.targetLanguage}
                onValueChange={(val) => handleUpdateParams("target", val)}
                disabled={isUpdating}
              >
                <SelectTrigger className="h-8 text-sm font-semibold border-none shadow-none px-0 hover:bg-muted/50">
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
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground uppercase font-bold">
                Base (Instrução)
              </label>
              <Select
                value={analysis.baseLanguage}
                onValueChange={(val) => handleUpdateParams("base", val)}
                disabled={isUpdating}
              >
                <SelectTrigger className="h-8 text-sm font-semibold border-none shadow-none px-0 hover:bg-muted/50">
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
          </CardContent>
        </Card>
      </div>

      {/* General Feedback */}
      <Alert>
        <AlertTitle>Feedback Geral</AlertTitle>
        <AlertDescription className="mt-2">
          {analysis.generalFeedback}
        </AlertDescription>
      </Alert>

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 gap-4">
        {Object.entries(analysis.sections).map(
          ([key, section]: [string, any]) => (
            <Card
              key={key}
              className={`border ${getStatusColor(section.status)}`}
            >
              <CardHeader className="py-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(section.status)}
                  <CardTitle className="text-base capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="py-3 pt-0 text-sm">
                {section.feedback}
              </CardContent>
            </Card>
          ),
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          variant="outline"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refazer Análise
        </Button>
        <Button onClick={onComplete}>Aceitar e Continuar</Button>
      </div>
    </div>
  );
}
