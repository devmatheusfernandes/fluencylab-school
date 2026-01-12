"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { UserRoles } from "@/types/users/userRoles";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Info,
  Lightbulb,
  Loader2,
  Megaphone,
  Send,
  ShieldAlert,
  Users,
  User,
} from "lucide-react";
import { toast } from "sonner"; // Assumindo uso do Sonner (padrão shadcn atual)

// Imports dos componentes Shadcn
import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTranslations } from "next-intl";

// Lista de papéis disponíveis para seleção
const AVAILABLE_ROLES = [
  UserRoles.MANAGER,
  UserRoles.STUDENT,
  UserRoles.TEACHER,
  UserRoles.GUARDED_STUDENT,
  UserRoles.MATERIAL_MANAGER,
];

export default function AdminAnnouncementsPage() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === UserRoles.ADMIN;

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  // Usando string literais diretamente para facilitar o binding com o Select do shadcn
  const [type, setType] = useState<string>("info");
  // Usando string literais para as Tabs
  const [recipientTab, setRecipientTab] = useState<string>("role");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [userIdsText, setUserIdsText] = useState("");
  const [loading, setLoading] = useState(false);
  const tRoles = useTranslations("UserRoles");
  const t = useTranslations("AdminNotifications");
 
  // --- ESTADO DE CARREGAMENTO (SKELETON) ---
  if (status === "loading") {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-24 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-20 w-full" /></div>
          </CardContent>
          <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
        </Card>
      </div>
    );
  }

  // --- ESTADO SEM PERMISSÃO ---
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto p-6 mt-10">
        <Card className="border-destructive/50 bg-destructive/5 text-center">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <ShieldAlert className="h-10 w-10 text-destructive" />
            </div>
            <CardTitle>{t("accessDenied.title")}</CardTitle>
            <CardDescription>
              {t("accessDenied.description")}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // --- FUNÇÃO DE SUBMISSÃO ---
  async function submit() {
    // Validação básica antes de enviar
    if (!title.trim() || !message.trim()) {
        toast.warning(t("toasts.requiredFields"), {
            description: t("toasts.fillTitleMessage")
        });
        return;
    }

    if (recipientTab === "role" && selectedRoles.length === 0) {
        toast.warning(t("toasts.invalidRecipient"), {
            description: t("toasts.selectRole")
        });
        return;
    }
     if (recipientTab === "specific" && !userIdsText.trim()) {
        toast.warning(t("toasts.invalidRecipient"), {
            description: t("toasts.provideIds")
        });
        return;
    }


    setLoading(true);
    const loadingToast = toast.loading(t("toasts.sending"));

    try {
      const payload: any = {
        title,
        message,
        type: type as "info" | "warning" | "tip",
        recipientType: recipientTab,
      };

      if (recipientTab === "role") {
        payload.roles = selectedRoles;
      } else {
        payload.userIds = userIdsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${res.status}`);
      }

      toast.success(t("toasts.success"), {
        id: loadingToast,
        description: t("toasts.successDesc")
      });

      // Limpar formulário
      setTitle("");
      setMessage("");
      setSelectedRoles([]);
      setUserIdsText("");
      // Opcional: resetar tipo e aba se desejar
      // setType("info");
      // setRecipientTab("role");

    } catch (e: any) {
      toast.error(t("toasts.error"), {
        id: loadingToast,
        description: e.message || t("toasts.unexpectedError")
      });
    } finally {
      setLoading(false);
    }
  }

  // --- RENDERIZAÇÃO PRINCIPAL ---
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="p-4 md:p-8 space-y-8"
    >
      <Header
        heading={t("title")}
        subheading={t("subtitle")}
        icon={<Megaphone className="h-8 w-8 text-primary" />}
      />

      <Card className="shadow-md">

        <CardContent className="space-y-6">
          {/* Título e Mensagem */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t("form.titleLabel")}</Label>
              <Input
                id="title"
                placeholder={t("form.titlePlaceholder")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                className="font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">{t("form.messageLabel")}</Label>
              <Textarea
                id="message"
                placeholder={t("form.messagePlaceholder")}
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
                className="resize-y min-h-[100px]"
              />
            </div>
          </div>

          {/* Tipo de Anúncio (Select Customizado) */}
          <div className="space-y-2">
            <Label htmlFor="type">{t("form.typeLabel")}</Label>
            <Select value={type} onValueChange={setType} disabled={loading}>
              <SelectTrigger id="type" className="h-11">
                <SelectValue placeholder={t("form.typePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Info className="h-4 w-4" />
                    <span>{t("form.types.info")}</span>
                  </div>
                </SelectItem>
                <SelectItem value="warning">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{t("form.types.warning")}</span>
                  </div>
                </SelectItem>
                <SelectItem value="tip">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <Lightbulb className="h-4 w-4" />
                    <span>{t("form.types.tip")}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-4">
             {/* Destinatários (Tabs) */}
            <div className="space-y-4">
              <Label>{t("form.recipientsLabel")}</Label>
              <Tabs value={recipientTab} onValueChange={setRecipientTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-11">
                  <TabsTrigger value="role" className="flex items-center gap-2" disabled={loading}>
                    <Users className="h-4 w-4" />
                    {t("form.tabs.role")}
                  </TabsTrigger>
                  <TabsTrigger value="specific" className="flex items-center gap-2" disabled={loading}>
                    <User className="h-4 w-4" />
                    {t("form.tabs.specific")}
                  </TabsTrigger>
                </TabsList>

                <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                    {/* Conteúdo da Aba: Papéis */}
                    <TabsContent value="role" className="mt-0 space-y-3">
                    <Label className="text-xs text-muted-foreground">{t("form.roleSelectLabel")}</Label>
                    {/* Uso do ToggleGroup para seleção múltipla estilo "chips" */}
                    <ToggleGroup
                        type="multiple"
                        variant="outline"
                        value={selectedRoles}
                        onValueChange={(vals) => setSelectedRoles(vals as string[])}
                        disabled={loading}
                        className="flex flex-wrap justify-start"
                    >
                        {AVAILABLE_ROLES.map((role) => (
                        <ToggleGroupItem
                            key={role}
                            value={role}
                            className="h-9 px-3 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground transition-all"
                            aria-label={`Toggle ${role}`}
                        >
                            {tRoles(role)}
                        </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                    {selectedRoles.length === 0 && recipientTab === "role" && (
                        <p className="text-xs text-amber-500 font-medium animate-pulse">
                        {t("form.noRoleSelected")}
                        </p>
                    )}
                    </TabsContent>

                    {/* Conteúdo da Aba: Específicos */}
                    <TabsContent value="specific" className="mt-0 space-y-3">
                        <div className="space-y-2">
                            <Label htmlFor="userIds" className="text-xs text-muted-foreground">
                                {t("form.specificIdsLabel")}
                            </Label>
                            <Textarea
                                id="userIds"
                                placeholder={t("form.specificIdsPlaceholder")}
                                value={userIdsText}
                                onChange={(e) => setUserIdsText(e.target.value)}
                                disabled={loading}
                                className="font-mono text-sm min-h-[80px]"
                            />
                             <p className="text-xs text-muted-foreground">
                                {t("form.specificIdsTip")}
                            </p>
                        </div>
                    </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>

        </CardContent>

        <CardFooter className="mt-2">
          <Button
            onClick={submit}
            disabled={loading}
            className="text-base group"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t("form.sendingButton")}
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                {t("form.submitButton")}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
