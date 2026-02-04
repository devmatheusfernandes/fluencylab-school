import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export function DifficultiesStep({ formData, updateField }: StepProps) {
  const t = useTranslations("StudentProfileSurvey.questions");

  const diffs = [
    "Vergonha/medo de falar",
    "Pronúncia",
    "Compreensão oral",
    "Gramática",
    "Vocabulário",
    "Escrita",
    "Leitura",
    "Motivação",
    "Tempo",
    "Prática regular",
  ];

  const handleDiffToggle = (item: string) => {
    const current = formData.difficulties || [];
    if (current.includes(item)) {
      updateField(
        "difficulties",
        current.filter((i) => i !== item),
      );
    } else {
      updateField("difficulties", [...current, item]);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-3">
        <Label className="text-lg">{t("difficulties")}</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {diffs.map((diff) => (
            <div
              key={diff}
              className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={`diff-${diff}`}
                checked={(formData.difficulties || []).includes(diff)}
                onCheckedChange={() => handleDiffToggle(diff)}
              />
              <Label
                htmlFor={`diff-${diff}`}
                className="font-normal cursor-pointer flex-1"
              >
                {diff}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-lg">{t("pastExperiences")}</Label>
        <div className="space-y-2">
          <Input
            placeholder="O que funcionou bem?"
            value={formData.pastExperiencesGood || ""}
            onChange={(e) => updateField("pastExperiencesGood", e.target.value)}
          />
          <Input
            placeholder="O que NÃO funcionou?"
            value={formData.pastExperiencesBad || ""}
            onChange={(e) => updateField("pastExperiencesBad", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-lg">{t("specialNeeds")}</Label>
        <Input
          value={formData.specialNeeds || ""}
          onChange={(e) => updateField("specialNeeds", e.target.value)}
          placeholder="Ex: TDAH, Dislexia, etc."
          className="text-lg py-6"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-lg">{t("speakingAnxiety")}</Label>
        <Select
          value={formData.speakingAnxiety}
          onValueChange={(val) => updateField("speakingAnxiety", val)}
        >
          <SelectTrigger className="text-lg py-6">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="None">Não, me sinto confortável</SelectItem>
            <SelectItem value="Little">Um pouco, mas lido bem</SelectItem>
            <SelectItem value="Much">Sim, bastante</SelectItem>
            <SelectItem value="Very Much">
              Sim, muito (prefiro escrita primeiro)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
