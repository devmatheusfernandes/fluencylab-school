import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { StudentProfile } from "@/types/students/studentProfile";
import { useTranslations } from "next-intl";

interface StepProps {
  formData: Partial<StudentProfile>;
  updateField: (field: keyof StudentProfile, value: any) => void;
  updateNestedField: (parent: keyof StudentProfile, field: string, value: any) => void;
}

export function PreferencesStep({ formData, updateField }: StepProps) {
  const t = useTranslations("StudentProfileSurvey.questions");
  const tOptions = useTranslations("StudentProfileSurvey.options");

  const expectations = [
    "Conversação prática", "Explicações gramaticais", "Vocabulário novo",
    "Correção de erros", "Atividades divertidas", "Materiais de interesse",
    "Situações reais", "Pronúncia", "Fixação"
  ];

  const handleExpectationToggle = (item: string) => {
    const current = formData.classExpectations || [];
    if (current.includes(item)) {
      updateField("classExpectations", current.filter(i => i !== item));
    } else {
      if (current.length >= 3) return;
      updateField("classExpectations", [...current, item]);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-3">
        <Label className="text-lg">{t("languageVariant")}</Label>
        <Input 
          value={formData.languageVariant || ""}
          onChange={(e) => updateField("languageVariant", e.target.value)}
          placeholder="Ex: Inglês Americano, Espanhol da Espanha..."
          className="text-lg py-6"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-lg">{t("accentGoal")}</Label>
        <RadioGroup
          value={formData.accentGoal || ""}
          onValueChange={(val) => updateField("accentGoal", val)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Comprehension" id="acc-comp" />
            <Label htmlFor="acc-comp">Não, só quero ser compreendido</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Natural" id="acc-nat" />
            <Label htmlFor="acc-nat">Sim, o mais natural possível</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Specific" id="acc-spec" />
            <Label htmlFor="acc-spec">Sim, específico (detalhe nas obs)</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label className="text-lg">{t("classExpectations")}</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {expectations.map((exp) => (
            <div key={exp} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <Checkbox 
                id={`exp-${exp}`} 
                checked={(formData.classExpectations || []).includes(exp)}
                onCheckedChange={() => handleExpectationToggle(exp)}
                disabled={!(formData.classExpectations || []).includes(exp) && (formData.classExpectations || []).length >= 3}
              />
              <Label htmlFor={`exp-${exp}`} className="font-normal cursor-pointer flex-1">{exp}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-lg">{t("learningPace")}</Label>
        <RadioGroup
          value={formData.learningPace || ""}
          onValueChange={(val) => updateField("learningPace", val)}
          className="grid grid-cols-2 gap-3"
        >
          {["intense", "moderate", "relaxed", "flexible"].map((pace) => (
            <div key={pace} className="flex items-center space-x-2 p-2 border rounded">
              <RadioGroupItem value={pace} id={`pace-${pace}`} />
              <Label htmlFor={`pace-${pace}`}>{tOptions(pace as any)}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label className="text-lg">{t("correctionStyle")}</Label>
        <RadioGroup
          value={formData.correctionStyle || ""}
          onValueChange={(val) => updateField("correctionStyle", val)}
        >
           <div className="flex items-center space-x-2">
            <RadioGroupItem value="Immediate" id="corr-imm" />
            <Label htmlFor="corr-imm">Imediata (tudo)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Important" id="corr-imp" />
            <Label htmlFor="corr-imp">Erros importantes apenas</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="End" id="corr-end" />
            <Label htmlFor="corr-end">No final da atividade</Label>
          </div>
           <div className="flex items-center space-x-2">
            <RadioGroupItem value="Gentle" id="corr-gen" />
            <Label htmlFor="corr-gen">Gentil (tenho receio)</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}
