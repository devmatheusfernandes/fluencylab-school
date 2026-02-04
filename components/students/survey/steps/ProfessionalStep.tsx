import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StudentProfile } from "@/types/students/studentProfile";
import { useTranslations } from "next-intl";

interface StepProps {
  formData: Partial<StudentProfile>;
  updateField: (field: keyof StudentProfile, value: any) => void;
  updateNestedField: (parent: keyof StudentProfile, field: string, value: any) => void;
}

export function ProfessionalStep({ formData, updateField }: StepProps) {
  const t = useTranslations("StudentProfileSurvey.questions");
  const tOptions = useTranslations("StudentProfileSurvey.options");

  const sectors = [
    "Tecnologia/TI", "Saúde/Medicina", "Educação", "Engenharia", 
    "Negócios/Administração", "Marketing/Comunicação", "Vendas/Comercial",
    "Turismo/Hospitalidade", "Artes/Design", "Direito/Jurídico", 
    "Finanças/Contabilidade", "Construção Civil", "Outro"
  ];

  const usages = [
    "Reuniões presenciais", "Reuniões online", "Emails profissionais",
    "Relatórios e documentos", "Apresentações", "Atendimento a clientes",
    "Leitura técnica", "Negociações", "Networking"
  ];

  const handleUsageToggle = (usage: string) => {
    const current = formData.professionalUsage || [];
    if (current.includes(usage)) {
      updateField("professionalUsage", current.filter(u => u !== usage));
    } else {
      updateField("professionalUsage", [...current, usage]);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-3">
        <Label className="text-lg">{t("employmentStatus")}</Label>
        <RadioGroup
          value={formData.employmentStatus || ""}
          onValueChange={(val) => updateField("employmentStatus", val)}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {["employed", "student", "unemployed", "retired", "other"].map((status) => (
            <div key={status} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <RadioGroupItem value={status} id={`status-${status}`} />
              <Label htmlFor={`status-${status}`} className="font-normal text-base cursor-pointer flex-1">
                {tOptions(status as any)}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {formData.employmentStatus === "employed" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-2">
            <Label className="text-lg">{t("professionalArea")}</Label>
            <Input 
              value={formData.professionalArea || ""}
              onChange={(e) => updateField("professionalArea", e.target.value)}
              placeholder="Ex: Desenvolvedor Frontend"
              className="text-lg py-6"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-lg">{t("professionalSector")}</Label>
            <Select 
              value={formData.professionalSector} 
              onValueChange={(val) => updateField("professionalSector", val)}
            >
              <SelectTrigger className="text-lg py-6">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {sectors.map(sector => (
                  <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-lg">{t("professionalUsage")}</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {usages.map((usage) => (
                <div key={usage} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Checkbox 
                    id={`usage-${usage}`} 
                    checked={(formData.professionalUsage || []).includes(usage)}
                    onCheckedChange={() => handleUsageToggle(usage)}
                  />
                  <Label htmlFor={`usage-${usage}`} className="font-normal cursor-pointer flex-1">{usage}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-lg">{t("professionalUsageType")}</Label>
            <RadioGroup
              value={formData.professionalUsageType || ""}
              onValueChange={(val) => updateField("professionalUsageType", val)}
              className="flex flex-col space-y-2"
            >
              {["written", "spoken", "balanced"].map((type) => (
                <div key={type} className="flex items-center space-x-3">
                  <RadioGroupItem value={type} id={`type-${type}`} />
                  <Label htmlFor={`type-${type}`} className="font-normal text-base cursor-pointer">
                    {tOptions(type as any)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="text-lg">{t("technicalVocabulary")}</Label>
            <Input 
              value={formData.technicalVocabulary || ""}
              onChange={(e) => updateField("technicalVocabulary", e.target.value)}
              placeholder="Sim, ex: termos jurídicos..."
              className="text-lg py-6"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-lg">{t("currentProfessionalUsage")}</Label>
            <Select 
              value={formData.currentProfessionalUsage} 
              onValueChange={(val) => updateField("currentProfessionalUsage", val)}
            >
              <SelectTrigger className="text-lg py-6">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">{tOptions("never")}</SelectItem>
                <SelectItem value="rarely">{tOptions("rarely")}</SelectItem>
                <SelectItem value="sometimes">{tOptions("sometimes")}</SelectItem>
                <SelectItem value="frequently">{tOptions("frequently")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
