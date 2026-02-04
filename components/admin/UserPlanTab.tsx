"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Plan } from "@/types/learning/plan";
import { PlanViewer } from "@/components/plans/PlanViewer";
import { PlanEditor } from "@/components/plans/PlanEditor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createPlan, archivePlan, updatePlan } from "@/actions/planActions";
import { Plus, AlertTriangle, Pencil, Archive } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalPrimaryButton,
  ModalSecondaryButton,
  ModalIcon,
} from "@/components/ui/modal";

interface UserPlanTabProps {
  studentId: string;
  activePlan: Plan | null;
  templates: Plan[];
  hasClasses: boolean;
  totalScheduledClasses: number;
}

export default function UserPlanTab({
  studentId,
  activePlan,
  templates,
  hasClasses,
  totalScheduledClasses,
}: UserPlanTabProps) {
  const t = useTranslations("UserDetails.plan");
  const router = useRouter();
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<
    "template" | "custom" | "edit" | null
  >(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Plan | null>(null);

  const handleAssignCustom = () => {
    setEditorMode("custom");
    setSelectedTemplate(null);
  };

  const handleAssignTemplate = (template: Plan) => {
    setEditorMode("template");
    setSelectedTemplate(template);
  };

  const handleEditPlan = () => {
    setEditorMode("edit");
    setIsAssignOpen(true);
  };

  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isSyncConfirmOpen, setIsSyncConfirmOpen] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<Partial<Plan> | null>(
    null,
  );

  const handleArchivePlan = async () => {
    if (!activePlan) return;
    try {
      await archivePlan(activePlan.id, studentId);
      toast.success(t("planArchived"));
      setIsArchiveModalOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(t("errorArchiving"));
      console.error(error);
    }
  };

  const processSave = async (planData: Partial<Plan>) => {
    try {
      if (editorMode === "edit" && activePlan) {
        const result = await updatePlan(activePlan.id, planData);
        if (!result.success) throw new Error(result.error || t("errorSaving"));
        toast.success(t("planUpdated"));
      } else {
        const result = await createPlan({
          ...planData,
          type: "student",
          studentId,
          status: "active",
        });
        if (!result.success) throw new Error(result.error || t("errorSaving"));
        toast.success(t("planCreated"));
      }
      setIsAssignOpen(false);
      setEditorMode(null);
      setPendingSaveData(null);
      setIsSyncConfirmOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || t("errorSaving"));
      // Don't re-throw here to avoid unhandled promise rejection in the UI
    }
  };

  const onSave = async (planData: Partial<Plan>) => {
    // Intercept edit mode for student plans to confirm sync
    if (editorMode === "edit" && activePlan && activePlan.type === "student") {
      setPendingSaveData(planData);
      setIsSyncConfirmOpen(true);
      return;
    }
    await processSave(planData);
  };

  if (activePlan) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">{t("currentPlan")}</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleEditPlan}>
              <Pencil className="w-4 h-4 mr-2" />
              {t("edit")}
            </Button>

            <Modal
              open={isArchiveModalOpen}
              onOpenChange={setIsArchiveModalOpen}
            >
              <ModalTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Archive className="w-4 h-4 mr-2" />
                  {t("archive")}
                </Button>
              </ModalTrigger>
              <ModalContent>
                <ModalIcon type="warning" />
                <ModalHeader>
                  <ModalTitle>{t("archiveConfirmTitle")}</ModalTitle>
                  <ModalDescription>{t("archiveConfirmDesc")}</ModalDescription>
                </ModalHeader>
                <ModalFooter>
                  <ModalSecondaryButton
                    onClick={() => setIsArchiveModalOpen(false)}
                  >
                    {t("cancel")}
                  </ModalSecondaryButton>
                  <ModalPrimaryButton
                    variant="destructive"
                    onClick={handleArchivePlan}
                  >
                    {t("confirmArchive")}
                  </ModalPrimaryButton>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </div>
        </div>
        <PlanViewer
          plan={activePlan}
          totalScheduledClasses={totalScheduledClasses}
        />

        {/* Sync Confirmation Modal */}
        <Modal open={isSyncConfirmOpen} onOpenChange={setIsSyncConfirmOpen}>
          <ModalContent>
            <ModalIcon type="warning" />
            <ModalHeader>
              <ModalTitle>{t("syncConfirmTitle")}</ModalTitle>
              <ModalDescription>{t("syncConfirmDesc")}</ModalDescription>
            </ModalHeader>
            <ModalFooter>
              <ModalSecondaryButton onClick={() => setIsSyncConfirmOpen(false)}>
                {t("cancel")}
              </ModalSecondaryButton>
              <ModalPrimaryButton
                onClick={() => pendingSaveData && processSave(pendingSaveData)}
              >
                {t("syncConfirmButton")}
              </ModalPrimaryButton>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Edit Dialog - Reusing the assign dialog logic but simpler */}
        <Dialog
          open={isAssignOpen && editorMode === "edit"}
          onOpenChange={(open) => !open && setIsAssignOpen(false)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("editPlanTitle")}</DialogTitle>
            </DialogHeader>
            <PlanEditor
              mode="edit"
              type="student"
              studentId={studentId}
              initialPlan={activePlan}
              onSave={onSave}
              onCancel={() => {
                setIsAssignOpen(false);
                setEditorMode(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!hasClasses && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t("noClassesWarning")}</AlertTitle>
          <AlertDescription>{t("noClassesWarningDesc")}</AlertDescription>
        </Alert>
      )}

      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <h3 className="text-lg font-medium mb-2">{t("noActivePlan")}</h3>
        <p className="text-muted-foreground mb-6">{t("noActivePlanDesc")}</p>
        <Button onClick={() => setIsAssignOpen(true)} disabled={!hasClasses}>
          <Plus className="w-4 h-4 mr-2" />
          {t("assignNew")}
        </Button>
      </div>

      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("assignTitle")}</DialogTitle>
          </DialogHeader>

          {!editorMode ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-4">
                <h4 className="font-medium text-center">{t("createCustom")}</h4>
                <div
                  className="border rounded-lg p-6 text-center hover:bg-accent cursor-pointer transition-colors h-48 flex flex-col items-center justify-center"
                  onClick={handleAssignCustom}
                >
                  <Plus className="w-8 h-8 mb-2" />
                  <span className="font-semibold">
                    {t("createCustomTitle")}
                  </span>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t("createCustomDesc")}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-center">{t("useTemplate")}</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      className="p-4 cursor-pointer hover:border-primary transition-colors"
                      onClick={() => handleAssignTemplate(template)}
                    >
                      <div className="font-semibold">{template.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {template.level} •{" "}
                        {t("lessonsCount", { count: template.lessons.length })}
                      </div>
                    </Card>
                  ))}
                  {templates.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t("noTemplates")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <PlanEditor
              mode="create"
              type="student"
              studentId={studentId}
              initialPlan={selectedTemplate || {}} // Pre-fill if template selected
              onSave={onSave}
              onCancel={() => setEditorMode(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
