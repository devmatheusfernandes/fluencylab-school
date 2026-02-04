"use client";

import { useState } from "react";
import { StudentProfile } from "@/types/students/studentProfile";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { Plus, Search, UserPlus, Pencil, Trash2, User } from "lucide-react";
import { AssociateStudentModal } from "./AssociateStudentModal";
import { deleteStudentProfile } from "@/actions/studentProfile";
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
  ModalClose
} from "@/components/ui/modal";
import Link from "next/link";

interface StudentProfileListProps {
  initialProfiles: StudentProfile[];
}

export function StudentProfileList({ initialProfiles }: StudentProfileListProps) {
  const t = useTranslations("StudentProfileList");
  const router = useRouter();
  const [profiles, setProfiles] = useState(initialProfiles);
  const [search, setSearch] = useState("");
  const [associateId, setAssociateId] = useState<string | null>(null);

  const filtered = profiles.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.languageOfInterest?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    const result = await deleteStudentProfile(id);
    if (result.success) {
      toast.success("Perfil excluído.");
      setProfiles(prev => prev.filter(p => p.id !== id));
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
                  <CardTitle className="text-lg font-semibold truncate pr-2">
                    {profile.name}
                  </CardTitle>
                  <Badge variant={profile.studentId ? "default" : "secondary"}>
                    {profile.studentId ? t("associated") : t("loose")}
                  </Badge>
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
                  <Link href={`/hub/manager/student-profiles/${profile.id}`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>

                <Modal>
                  <ModalTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
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
                      <ModalClose asChild>
                        <ModalSecondaryButton>Cancelar</ModalSecondaryButton>
                      </ModalClose>
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
    </div>
  );
}
