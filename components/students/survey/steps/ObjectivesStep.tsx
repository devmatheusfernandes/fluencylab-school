import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { StudentProfile } from "@/types/students/studentProfile";
import { useTranslations } from "next-intl";

interface StepProps {
  formData: Partial<StudentProfile>;
  updateField: (field: keyof StudentProfile, value: any) => void;
  updateNestedField: (
    parent: keyof StudentProfile,
    field: string,
    value: any,
  ) => void;
}

export function ObjectivesStep({ formData, updateField }: StepProps) {
  const t = useTranslations("StudentProfileSurvey.questions");

  const goals = [
    "Viajar / Turismo",
    "Trabalho / Carreira profissional",
    "Morar/estudar no exterior",
    "Certificação / Exame específico",
    "Desenvolvimento pessoal / Prazer",
    "Comunicação com família/amigos",
    "Melhorar na escola",
    "Outro",
  ];

  const handleGoalToggle = (goal: string) => {
    const current = formData.mainGoals || [];
    if (current.includes(goal)) {
      updateField(
        "mainGoals",
        current.filter((g) => g !== goal),
      );
    } else {
      updateField("mainGoals", [...current, goal]);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-3">
        <Label className="text-lg">{t("mainGoals")}</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {goals.map((goal) => (
            <div
              key={goal}
              className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={`goal-${goal}`}
                checked={(formData.mainGoals || []).includes(goal)}
                onCheckedChange={() => handleGoalToggle(goal)}
              />
              <Label
                htmlFor={`goal-${goal}`}
                className="font-normal cursor-pointer flex-1"
              >
                {goal}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-lg">{t("deadline")}</Label>
        <Select
          value={formData.deadline}
          onValueChange={(val) => updateField("deadline", val)}
        >
          <SelectTrigger className="text-lg py-6">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3 months">3 meses</SelectItem>
            <SelectItem value="6 months">6 meses</SelectItem>
            <SelectItem value="1 year">1 ano</SelectItem>
            <SelectItem value="2 years">2 anos</SelectItem>
            <SelectItem value="No deadline">Sem prazo específico</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-lg">{t("deadlineReason")}</Label>
        <Input
          value={formData.deadlineReason || ""}
          onChange={(e) => updateField("deadlineReason", e.target.value)}
          placeholder="Ex: Viagem em Dezembro"
          className="text-lg py-6"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-lg">{t("specificMotivation")}</Label>
        <Textarea
          value={formData.specificMotivation || ""}
          onChange={(e) => updateField("specificMotivation", e.target.value)}
          placeholder="Conte mais sobre o porquê..."
          className="min-h-[100px] text-lg"
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-lg">{t("commitmentLevel")}</Label>
          <span className="text-xl font-bold text-primary">
            {formData.commitmentLevel || 5}/10
          </span>
        </div>
        <Slider
          value={[formData.commitmentLevel || 5]}
          onValueChange={(vals) => updateField("commitmentLevel", vals[0])}
          min={1}
          max={10}
          step={1}
          className="py-4"
        />
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span>Baixo</span>
          <span>Muito Alto</span>
        </div>
      </div>
    </div>
  );
}
