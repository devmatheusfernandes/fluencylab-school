"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Eye, Edit } from "lucide-react";
import { Plan } from "@/types/learning/plan";
import { PlanEditor } from "@/components/plans/PlanEditor";
import { PlanViewer } from "@/components/plans/PlanViewer";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Header } from "@/components/ui/header";
import { createPlan, updatePlan } from "@/actions/planActions"; // We need to add these

interface PlanTemplatesClientProps {
  initialTemplates: Plan[];
}

export function PlanTemplatesClient({
  initialTemplates,
}: PlanTemplatesClientProps) {
  const t = useTranslations("PlanTemplates");
  const [templates, setTemplates] = useState<Plan[]>(initialTemplates);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");

  const handleCreate = () => {
    setSelectedPlan(null);
    setEditorMode("create");
    setIsEditorOpen(true);
  };

  const handleEdit = (plan: Plan) => {
    setSelectedPlan(plan);
    setEditorMode("edit");
    setIsEditorOpen(true);
  };

  const handleView = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsViewerOpen(true);
  };

  const onSave = async (planData: Partial<Plan>) => {
    try {
      if (editorMode === "create") {
        // Call server action to create
        const result = await createPlan(planData);
        if (result.success && result.plan) {
          setTemplates([...templates, result.plan]);
        }
      } else {
        // Call server action to update
        if (!selectedPlan?.id) return;
        const result = await updatePlan(selectedPlan.id, planData);
        if (result.success) {
          setTemplates(
            templates.map((p) =>
              p.id === selectedPlan.id ? ({ ...p, ...planData } as Plan) : p,
            ),
          );
        }
      }
      setIsEditorOpen(false);
    } catch (error) {
      console.error(error);
      throw error; // Let the editor handle the toast
    }
  };

  return (
    <div className="container-padding">
      <Header
        heading={t("title")}
        subheading={t("description")}
        icon={
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            {t("createButton")}
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card
            key={template.id}
            className="p-6 space-y-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{template.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {template.level}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {template.goal || "Sem objetivo definido"}
            </p>
            <div className="pt-2 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleView(template)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {t("view")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleEdit(template)}
              >
                <Edit className="w-4 h-4 mr-2" />
                {t("edit")}
              </Button>
            </div>
          </Card>
        ))}
        {templates.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            {t("noTemplates")}
          </div>
        )}
      </div>

      {/* Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editorMode === "create" ? t("createTitle") : t("editTitle")}
            </DialogTitle>
          </DialogHeader>
          <PlanEditor
            mode={editorMode}
            type="template"
            initialPlan={selectedPlan || {}}
            onSave={onSave}
            onCancel={() => setIsEditorOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Viewer Dialog */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("viewTitle")}</DialogTitle>
          </DialogHeader>
          {selectedPlan && <PlanViewer plan={selectedPlan} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
