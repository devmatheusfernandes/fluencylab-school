"use client";

import { useState } from "react";
import { StudentProfile } from "@/types/students/studentProfile";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { Plus, Search, UserPlus, Pencil, Trash2, User } from "lucide-react";
import { AssociateStudentModal } from "./AssociateStudentModal";
import { deleteStudentProfile } from "@/actions/studentProfile";
import { generatePromptPlanAction } from "@/actions/generatePromptPlan";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalIcon,
  ModalPrimaryButton,
  ModalSecondaryButton,
} from "@/components/ui/modal";
import Link from "next/link";
import { Sparkles, Copy, Check, Eye } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface StudentProfileListProps {
  initialProfiles: StudentProfile[];
}

export function StudentProfileList({
  initialProfiles,
}: StudentProfileListProps) {
  const t = useTranslations("StudentProfileList");
  const router = useRouter();
  const [profiles, setProfiles] = useState(initialProfiles);
  const [search, setSearch] = useState("");
  const [associateId, setAssociateId] = useState<string | null>(null);

  // Prompt Plan State
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Warning Modal State
  const [warningProfileId, setWarningProfileId] = useState<string | null>(null);

  const filtered = profiles.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.languageOfInterest?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleGeneratePrompt = async (profileId: string) => {
    // Check if profile already has a prompt
    const profile = profiles.find((p) => p.id === profileId);
    if (profile?.generatedPromptPlan) {
      setWarningProfileId(profileId);
      return;
    }

    await confirmGeneratePrompt(profileId);
  };

  const confirmGeneratePrompt = async (profileId: string) => {
    setWarningProfileId(null);
    setIsGenerating(true);
    const result = await generatePromptPlanAction(profileId);
    setIsGenerating(false);

    if (result.success && result.prompt) {
      setGeneratedPrompt(result.prompt);

      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profileId ? { ...p, generatedPromptPlan: result.prompt } : p,
        ),
      );

      setIsPromptModalOpen(true);
      toast.success(t("promptGeneratedSuccess"));
      router.refresh();
    } else {
      toast.error(result.error || t("promptGeneratedError"));
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    toast.success(t("copiedToClipboard"));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteStudentProfile(id);
    if (result.success) {
      toast.success("Perfil excluído.");
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    } else {
      toast.error("Erro ao excluir: " + result.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button asChild>
          <Link href="/hub/manager/student-profiles/create">
            <Plus className="mr-2 h-4 w-4" />
            {t("newProfile")}
          </Link>
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {t("noProfiles")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((profile) => (
            <Card key={profile.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold truncate pr-2 hover:underline">
                    <Link href={`/hub/manager/student-profiles/${profile.id}`}>
                      {profile.name}
                    </Link>
                  </CardTitle>
                  <div className="flex flex-col gap-1 items-end">
                    <Badge
                      variant={profile.studentId ? "default" : "secondary"}
                    >
                      {profile.studentId ? t("associated") : t("loose")}
                    </Badge>
                    {profile.generatedPromptPlan && (
                      <Badge
                        variant="outline"
                        className="border-indigo-500 text-indigo-600 bg-indigo-50"
                      >
                        {t("promptReady")}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">Idioma:</span>
                  {profile.languageOfInterest || "N/A"}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">Nível:</span>
                  {profile.approximateLevel || "N/A"}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">Objetivo:</span>
                  <span className="truncate">
                    {profile.mainGoals?.[0] || "N/A"}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="pt-2 border-t flex justify-between gap-2">
                {!profile.studentId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-primary hover:text-primary/80"
                    onClick={() => setAssociateId(profile.id!)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t("associate")}
                  </Button>
                )}

                <Button variant="ghost" size="icon" asChild>
                  <Link
                    href={`/hub/manager/student-profiles/${profile.id}/edit`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                  onClick={() => profile.id && handleGeneratePrompt(profile.id)}
                  disabled={isGenerating}
                  title={t("generatePromptTooltip")}
                >
                  <Sparkles className="h-4 w-4" />
                </Button>

                {profile.generatedPromptPlan && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    onClick={() => {
                      setGeneratedPrompt(profile.generatedPromptPlan!);
                      setIsPromptModalOpen(true);
                    }}
                    title={t("viewPromptTooltip")}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}

                <Modal>
                  <ModalTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </ModalTrigger>
                  <ModalContent>
                    <ModalIcon type="delete" />
                    <ModalHeader>
                      <ModalTitle>{t("confirmDeleteTitle")}</ModalTitle>
                      <ModalDescription>
                        {t("confirmDeleteDesc")}
                      </ModalDescription>
                    </ModalHeader>
                    <ModalFooter>
                      <ModalSecondaryButton>Cancelar</ModalSecondaryButton>
                      <ModalPrimaryButton
                        variant="destructive"
                        onClick={() => profile.id && handleDelete(profile.id)}
                      >
                        Excluir
                      </ModalPrimaryButton>
                    </ModalFooter>
                  </ModalContent>
                </Modal>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AssociateStudentModal
        profileId={associateId}
        isOpen={!!associateId}
        onClose={() => {
          setAssociateId(null);
          router.refresh();
        }}
      />

      <Modal
        open={!!warningProfileId}
        onOpenChange={(open) => !open && setWarningProfileId(null)}
      >
        <ModalContent>
          <ModalIcon type="warning" />
          <ModalHeader>
            <ModalTitle>{t("promptWarningTitle")}</ModalTitle>
            <ModalDescription>{t("promptWarningDesc")}</ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalPrimaryButton
              onClick={() =>
                warningProfileId && confirmGeneratePrompt(warningProfileId)
              }
            >
              {t("generateNew")}
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal open={isPromptModalOpen} onOpenChange={setIsPromptModalOpen}>
        <ModalContent className="sm:max-w-2xl">
          <ModalIcon />
          <ModalHeader>
            <ModalTitle>{t("promptPlanTitle")}</ModalTitle>
            <ModalDescription>{t("promptPlanDesc")}</ModalDescription>
          </ModalHeader>

          <div className="p-4 bg-muted/50 rounded-md relative group">
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 top-2 h-8 w-8 bg-background/50 hover:bg-background"
              onClick={copyToClipboard}
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Textarea
              readOnly
              value={generatedPrompt}
              className="min-h-[300px] font-mono text-sm resize-none bg-transparent border-0 focus-visible:ring-0 p-0"
            />
          </div>

          <ModalFooter>
            <ModalPrimaryButton onClick={copyToClipboard}>
              {copied ? t("copied") : t("copyPrompt")}
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
