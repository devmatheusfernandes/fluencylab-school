import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StudentProfile } from "@/types/students/studentProfile";
import { useTranslations } from "next-intl";

interface StepProps {
  formData: Partial<StudentProfile>;
  updateField: (field: keyof StudentProfile, value: any) => void;
  updateNestedField: (parent: keyof StudentProfile, field: string, value: any) => void;
}

export function InterestsStep({ formData, updateField }: StepProps) {
  const t = useTranslations("StudentProfileSurvey.questions");
  const tOptions = useTranslations("StudentProfileSurvey.options");

  const hobbiesList = [
    "Esportes", "Música", "Filmes/Séries", "Leitura", "Jogos",
    "Culinária", "Viagens", "Tecnologia", "Arte", "Natureza", "Política"
  ];

  const contentList = [
    "Músicas", "Filmes/Séries", "YouTube", "Podcasts", "Livros", "Redes Sociais", "Blogs"
  ];

  const handleListToggle = (field: "hobbies" | "contentTypes", item: string) => {
    const current = formData[field] || [];
    if (current.includes(item)) {
      updateField(field, current.filter(i => i !== item));
    } else {
      updateField(field, [...current, item]);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-3">
        <Label className="text-lg">{t("hobbies")}</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {hobbiesList.map((hobby) => (
            <div key={hobby} className="flex items-center space-x-2">
              <Checkbox 
                id={`hobby-${hobby}`} 
                checked={(formData.hobbies || []).includes(hobby)}
                onCheckedChange={() => handleListToggle("hobbies", hobby)}
              />
              <Label htmlFor={`hobby-${hobby}`} className="font-normal cursor-pointer">{hobby}</Label>
            </div>
          ))}
        </div>
        <Input 
          placeholder="Detalhes (ex: Gosto de Rock, Futebol...)"
          value={formData.hobbiesDetails || ""}
          onChange={(e) => updateField("hobbiesDetails", e.target.value)}
          className="mt-2"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-lg">{t("contentConsumption")}</Label>
        <RadioGroup
          value={formData.contentConsumption || ""}
          onValueChange={(val) => updateField("contentConsumption", val)}
          className="flex flex-wrap gap-4"
        >
          {["never", "rarely", "sometimes", "frequently"].map((opt) => (
            <div key={opt} className="flex items-center space-x-2">
              <RadioGroupItem value={opt} id={`cons-${opt}`} />
              <Label htmlFor={`cons-${opt}`} className="font-normal cursor-pointer">
                {tOptions(opt as any)}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label className="text-lg">{t("contentTypes")}</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {contentList.map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox 
                id={`ctype-${type}`} 
                checked={(formData.contentTypes || []).includes(type)}
                onCheckedChange={() => handleListToggle("contentTypes", type)}
              />
              <Label htmlFor={`ctype-${type}`} className="font-normal cursor-pointer">{type}</Label>
            </div>
          ))}
        </div>
        <Input 
          placeholder="Detalhes (ex: Bandas favoritas...)"
          value={formData.contentDetails || ""}
          onChange={(e) => updateField("contentDetails", e.target.value)}
          className="mt-2"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-lg">{t("interestTopics")}</Label>
        <Textarea 
          value={formData.interestTopics || ""}
          onChange={(e) => updateField("interestTopics", e.target.value)}
          placeholder="Assuntos para conversar em aula..."
          className="min-h-[80px]"
        />
      </div>
    </div>
  );
}
