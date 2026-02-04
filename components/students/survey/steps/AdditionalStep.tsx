import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StudentProfile } from "@/types/students/studentProfile";
import { useTranslations } from "next-intl";

interface StepProps {
  formData: Partial<StudentProfile>;
  updateField: (field: keyof StudentProfile, value: any) => void;
  updateNestedField: (parent: keyof StudentProfile, field: string, value: any) => void;
}

export function AdditionalStep({ formData, updateField }: StepProps) {
  const t = useTranslations("StudentProfileSurvey.questions");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <Label className="text-lg">{t("otherLanguages")}</Label>
        <Input 
          value={formData.otherLanguages || ""}
          onChange={(e) => updateField("otherLanguages", e.target.value)}
          placeholder="Ex: Falo Português (nativo) e um pouco de Francês"
          className="text-lg py-6"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-lg">{t("observations")}</Label>
        <Textarea 
          value={formData.observations || ""}
          onChange={(e) => updateField("observations", e.target.value)}
          placeholder="Outras observações importantes..."
          className="min-h-[100px] text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-lg">{t("restrictions")}</Label>
        <Textarea 
          value={formData.restrictions || ""}
          onChange={(e) => updateField("restrictions", e.target.value)}
          placeholder="Algo que você NÃO quer nas aulas..."
          className="min-h-[80px] text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-lg">{t("questions")}</Label>
        <Textarea 
          value={formData.questions || ""}
          onChange={(e) => updateField("questions", e.target.value)}
          placeholder="Dúvidas sobre o curso ou metodologia..."
          className="min-h-[80px] text-lg"
        />
      </div>
    </div>
  );
}
