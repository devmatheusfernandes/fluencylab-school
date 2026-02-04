import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DatePicker from "@/components/ui/date-picker";
import { StudentProfile } from "@/types/students/studentProfile";
import { useTranslations } from "next-intl";

interface StepProps {
  formData: Partial<StudentProfile>;
  updateField: (field: keyof StudentProfile, value: any) => void;
  updateNestedField: (parent: keyof StudentProfile, field: string, value: any) => void;
}

export function BasicInfoStep({ formData, updateField }: StepProps) {
  const t = useTranslations("StudentProfileSurvey.questions");

  const isMinor = formData.birthDate
    ? new Date().getFullYear() - new Date(formData.birthDate).getFullYear() < 18
    : false;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <Label htmlFor="name">{t("name")} *</Label>
        <Input
          id="name"
          value={formData.name || ""}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="Ex: João Silva"
          className="text-lg py-6"
        />
      </div>

      <div className="space-y-2">
        <Label>{t("birthDate")}</Label>
        <DatePicker
          value={formData.birthDate ? new Date(formData.birthDate) : undefined}
          onChange={(date) => updateField("birthDate", date.toISOString())}
          size="lg"
        />
      </div>

      {isMinor && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-2">
            <Label htmlFor="guardianName">{t("guardianName")} *</Label>
            <Input
              id="guardianName"
              value={formData.guardianName || ""}
              onChange={(e) => updateField("guardianName", e.target.value)}
              placeholder="Ex: Maria Silva"
              className="text-lg py-6"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardianContact">{t("guardianContact")} *</Label>
            <Input
              id="guardianContact"
              value={formData.guardianContact || ""}
              onChange={(e) => updateField("guardianContact", e.target.value)}
              placeholder="(11) 99999-9999"
              className="text-lg py-6"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="profession">{t("profession")}</Label>
        <Input
          id="profession"
          value={formData.profession || ""}
          onChange={(e) => updateField("profession", e.target.value)}
          placeholder="Ex: Engenheiro de Software / 3º Ano do Ensino Médio"
          className="text-lg py-6"
        />
      </div>
    </div>
  );
}
