import { useState } from "react";
import { toast } from "sonner";
import { Section } from "../../types/quiz/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModalPrimaryButton, ModalSecondaryButton } from "@/components/ui/modal";

const SectionForm = ({ 
  initialData, 
  onSave, 
  onCancel 
}: { 
  initialData: Section | null; 
  onSave: (data: { title: string }) => void; 
  onCancel: () => void 
}) => {
  const [title, setTitle] = useState(initialData?.title || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("O título da seção não pode estar vazio.");
      return;
    }
    onSave({ title });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="sectionTitle">Título da Seção</Label>
        <Input
          id="sectionTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Introdução ao Curso"
        />
      </div>

      <div className="pt-6 border-t border-fluency-gray-200 dark:border-fluency-gray-700 flex flex-col-reverse sm:flex-row justify-end gap-3">
        <ModalSecondaryButton
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          Cancelar
        </ModalSecondaryButton>
        <ModalPrimaryButton
          type="submit"
          className="w-full sm:w-auto"
        >
          Salvar Seção
        </ModalPrimaryButton>
      </div>
    </form>
  );
};

export default SectionForm;
