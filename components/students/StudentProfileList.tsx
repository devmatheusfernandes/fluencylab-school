"use client";

import { useState } from "react";
import { StudentProfile } from "@/types/students/studentProfile";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import {
  Plus,
  Search,
  UserPlus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Target,
} from "lucide-react";
import { AssociateStudentModal } from "./AssociateStudentModal";
import { deleteStudentProfile } from "@/actions/studentProfile";
import { generatePromptPlanAction } from "@/actions/generatePromptPlan";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Modal,
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
import AddUserModal from "../admin/AddUserModal";
import { useAdmin } from "@/hooks/admin/useAdmin";
import { UserRoles } from "@/types/users/userRoles";

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
  const [deleteProfileId, setDeleteProfileId] = useState<string | null>(null);
  const { createUser, isLoading: isAdminLoading } = useAdmin();

  // Prompt Plan State
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  const handleUserCreated = async (userData: {
    name: string;
    email: string;
    role: UserRoles;
    birthDate?: Date;
    contractStartDate?: Date;
    languages?: string[];
    guardian?: {
      name: string;
      email: string;
      phoneNumber?: string;
      relationship?: string;
    };
  }) => {
    const success = await createUser(userData);
    if (success) {
      setIsAddModalOpen(false);
    }
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
        <div className="flex flex-row items-center gap-2">
          <Button asChild>
            <Link href="/hub/manager/students/create">
              <Plus className="mr-2 h-4 w-4" />
              {t("newProfile")}
            </Link>
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} variant="glass">
            <UserPlus className="w-4 h-4 text-primary" />
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {t("noProfiles")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((profile) => (
            <Card
              key={profile.id}
              className="group hover:shadow-md transition-all duration-200 border-muted/60"
            >
              <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/hub/manager/students/${profile.id}`}
                      className="font-semibold text-lg hover:underline decoration-primary/30 underline-offset-4 transition-all"
                    >
                      {profile.name}
                    </Link>
                    {profile.studentId && (
                      <div
                        className="h-2 w-2 rounded-full bg-emerald-500"
                        title={t("associated")}
                      />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {profile.languageOfInterest || "N/A"} •{" "}
                    {profile.approximateLevel || "N/A"}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 -mt-1 -mr-2 text-muted-foreground hover:text-foreground"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href={`/hub/manager/students/${profile.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> Ver Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/hub/manager/students/${profile.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                      </Link>
                    </DropdownMenuItem>

                    {!profile.studentId && (
                      <DropdownMenuItem
                        onClick={() => setAssociateId(profile.id!)}
                      >
                        <UserPlus className="mr-2 h-4 w-4" /> Associar Aluno
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={() =>
                        profile.id && handleGeneratePrompt(profile.id)
                      }
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {profile.generatedPromptPlan
                        ? "Regerar Prompt"
                        : "Gerar Prompt"}
                    </DropdownMenuItem>

                    {profile.generatedPromptPlan && (
                      <DropdownMenuItem
                        onClick={() => {
                          setGeneratedPrompt(profile.generatedPromptPlan!);
                          setIsPromptModalOpen(true);
                        }}
                      >
                        <Copy className="mr-2 h-4 w-4" /> Copiar Prompt
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteProfileId(profile.id!)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>

              <CardContent className="px-5 pb-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground/80">
                  <Target className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {profile.mainGoals?.[0] || "Sem objetivo definido"}
                  </span>
                </div>

                {profile.generatedPromptPlan && (
                  <div className="mt-4 flex">
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-5 px-2 font-normal bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100"
                    >
                      <Sparkles className="h-3 w-3 mr-1" /> Prompt Criado
                    </Badge>
                  </div>
                )}
              </CardContent>
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

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUserCreated={handleUserCreated}
        isLoading={isAdminLoading}
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

          <div className="bg-muted/50 rounded-md relative group">
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
              className="max-h-[55vh] font-mono text-sm resize-none"
            />
          </div>
        </ModalContent>
      </Modal>

      <Modal
        open={!!deleteProfileId}
        onOpenChange={(open) => !open && setDeleteProfileId(null)}
      >
        <ModalContent>
          <ModalIcon type="delete" />
          <ModalHeader>
            <ModalTitle>Excluir Perfil</ModalTitle>
            <ModalDescription>
              Tem certeza que deseja excluir este perfil? Esta ação não pode ser
              desfeita.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalSecondaryButton onClick={() => setDeleteProfileId(null)}>
              Cancelar
            </ModalSecondaryButton>
            <ModalPrimaryButton
              variant="destructive"
              onClick={() => {
                if (deleteProfileId) {
                  handleDelete(deleteProfileId);
                  setDeleteProfileId(null);
                }
              }}
            >
              Excluir
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
