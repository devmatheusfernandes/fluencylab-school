import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

export function AvailabilityStep({ formData, updateField }: StepProps) {
  const t = useTranslations("StudentProfileSurvey.questions");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-3">
        <Label className="text-lg">{t("classFrequency")}</Label>
        <RadioGroup
          value={formData.classFrequency || ""}
          onValueChange={(val) => updateField("classFrequency", val)}
          className="grid grid-cols-2 gap-3"
        >
          {["1", "2", "3", "4+"].map((freq) => (
            <div
              key={freq}
              className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <RadioGroupItem value={freq} id={`freq-${freq}`} />
              <Label
                htmlFor={`freq-${freq}`}
                className="font-normal text-base cursor-pointer flex-1"
              >
                {freq} aula{freq !== "1" ? "s" : ""}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label className="text-lg">{t("bestTimes")}</Label>
        <Textarea
          value={formData.bestTimes || ""}
          onChange={(e) => updateField("bestTimes", e.target.value)}
          placeholder="Ex: Segundas e Quartas à noite..."
          className="min-h-[100px] text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-lg">{t("studyTimePerDay")}</Label>
        <Select
          value={formData.studyTimePerDay}
          onValueChange={(val) => updateField("studyTimePerDay", val)}
        >
          <SelectTrigger className="text-lg py-6">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="None">Nenhum (só as aulas)</SelectItem>
            <SelectItem value="5-30m">5-30 minutos por dia</SelectItem>
            <SelectItem value="30-60m">30-60 minutos por dia</SelectItem>
            <SelectItem value="1h+">Mais de 1 hora por dia</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
