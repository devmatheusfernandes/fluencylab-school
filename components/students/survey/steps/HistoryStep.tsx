import { Label } from "@/components/ui/label";
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

export function HistoryStep({ formData, updateField }: StepProps) {
  const t = useTranslations("StudentProfileSurvey.questions");
  const tOptions = useTranslations("StudentProfileSurvey.options");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <Label className="text-lg">{t("languageOfInterest")}</Label>
        <Select
          value={formData.languageOfInterest}
          onValueChange={(val) => updateField("languageOfInterest", val)}
        >
          <SelectTrigger className="text-lg py-6">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="English">Inglês</SelectItem>
            <SelectItem value="Spanish">Espanhol</SelectItem>
            <SelectItem value="Portuguese">Português</SelectItem>
            <SelectItem value="French">Francês</SelectItem>
            <SelectItem value="Italian">Italiano</SelectItem>
            <SelectItem value="German">Alemão</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label className="text-lg">{t("previousStudy")}</Label>
        <RadioGroup
          value={
            formData.previousStudy === undefined
              ? ""
              : formData.previousStudy
                ? "yes"
                : "no"
          }
          onValueChange={(val) => updateField("previousStudy", val === "yes")}
          className="flex flex-col space-y-3"
        >
          <div className="flex items-center space-x-3 space-y-0 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
            <RadioGroupItem value="no" id="ps-no" />
            <Label
              htmlFor="ps-no"
              className="font-normal text-base cursor-pointer flex-1"
            >
              {tOptions("no")}
            </Label>
          </div>
          <div className="flex items-center space-x-3 space-y-0 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
            <RadioGroupItem value="yes" id="ps-yes" />
            <Label
              htmlFor="ps-yes"
              className="font-normal text-base cursor-pointer flex-1"
            >
              {tOptions("yes")}
            </Label>
          </div>
        </RadioGroup>
      </div>

      {formData.previousStudy && (
        <div className="space-y-6 pl-4 border-l-2 border-primary/20 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-2">
            <Label className="text-base">{t("previousStudyTime")}</Label>
            <Select
              value={formData.previousStudyTime}
              onValueChange={(val) => updateField("previousStudyTime", val)}
            >
              <SelectTrigger className="text-lg py-6">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="< 6 months">Menos de 6 meses</SelectItem>
                <SelectItem value="6 months - 2 years">
                  6 meses a 2 anos
                </SelectItem>
                <SelectItem value="> 2 years">Mais de 2 anos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-base">{t("approximateLevel")}</Label>
            <Select
              value={formData.approximateLevel}
              onValueChange={(val) => updateField("approximateLevel", val)}
            >
              <SelectTrigger className="text-lg py-6">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A1">Iniciante absoluto (A1)</SelectItem>
                <SelectItem value="A2">Básico (A2)</SelectItem>
                <SelectItem value="B1">Intermediário (B1)</SelectItem>
                <SelectItem value="B2">Intermediário-avançado (B2)</SelectItem>
                <SelectItem value="C1">Avançado (C1)</SelectItem>
                <SelectItem value="C2">Proficiente (C2)</SelectItem>
                <SelectItem value="Unknown">Não sei</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
