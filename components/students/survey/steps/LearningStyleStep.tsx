import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { StudentProfile } from "@/types/students/studentProfile";
import { useTranslations } from "next-intl";

interface StepProps {
  formData: Partial<StudentProfile>;
  updateField: (field: keyof StudentProfile, value: any) => void;
  updateNestedField: (parent: keyof StudentProfile, field: string, value: any) => void;
}

export function LearningStyleStep({ formData, updateNestedField, updateField }: StepProps) {
  const t = useTranslations("StudentProfileSurvey.questions");

  const methods = [
    "Repetição e prática oral", "Anotações escritas", "Flashcards/Apps",
    "Conversação", "Vídeos/Filmes", "Músicas/Podcasts",
    "Leitura", "Exercícios escritos", "Jogos", "Imersão"
  ];

  const activities = [
    { key: "reading", label: "Ler textos longos" },
    { key: "writing", label: "Escrever (redações)" },
    { key: "speaking", label: "Falar/Conversar" },
    { key: "listening", label: "Ouvir áudios" },
    { key: "videos", label: "Assistir vídeos" },
    { key: "grammar", label: "Gramática" },
    { key: "games", label: "Jogos" },
    { key: "presentation", label: "Apresentações" },
    { key: "apps", label: "Apps" },
  ];

  const handleMethodToggle = (method: string) => {
    const current = formData.learningMethods || [];
    if (current.includes(method)) {
      updateField("learningMethods", current.filter(m => m !== method));
    } else {
      if (current.length >= 3) return;
      updateField("learningMethods", [...current, method]);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-3">
        <Label className="text-lg">{t("learningMethods")}</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {methods.map((method) => (
            <div key={method} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <Checkbox 
                id={`method-${method}`} 
                checked={(formData.learningMethods || []).includes(method)}
                onCheckedChange={() => handleMethodToggle(method)}
                disabled={!(formData.learningMethods || []).includes(method) && (formData.learningMethods || []).length >= 3}
              />
              <Label htmlFor={`method-${method}`} className="font-normal cursor-pointer flex-1">{method}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <Label className="text-lg">{t("activityPreferences")}</Label>
        <div className="space-y-4">
          {activities.map((act) => (
            <div key={act.key} className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">{act.label}</span>
                <span className="text-sm text-muted-foreground">
                  {(formData.activityPreferences as any)?.[act.key] || 3}/5
                </span>
              </div>
              <Slider 
                value={[(formData.activityPreferences as any)?.[act.key] || 3]} 
                onValueChange={(vals) => updateNestedField("activityPreferences", act.key, vals[0])}
                min={1} 
                max={5} 
                step={1}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
