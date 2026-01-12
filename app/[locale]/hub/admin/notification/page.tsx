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
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Esta área é restrita apenas para administradores.
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
        toast.warning("Campos obrigatórios", {
            description: "Por favor, preencha o título e a mensagem do anúncio."
        });
        return;
    }

    if (recipientTab === "role" && selectedRoles.length === 0) {
        toast.warning("Destinatário inválido", {
            description: "Selecione pelo menos um papel de usuário."
        });
        return;
    }
     if (recipientTab === "specific" && !userIdsText.trim()) {
        toast.warning("Destinatário inválido", {
            description: "Informe os IDs dos usuários específicos."
        });
        return;
    }


    setLoading(true);
    const loadingToast = toast.loading("Enviando anúncio...");

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

      toast.success("Anúncio enviado!", {
        id: loadingToast,
        description: "A notificação foi disparada para os destinatários."
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
      toast.error("Falha ao enviar", {
        id: loadingToast,
        description: e.message || "Ocorreu um erro inesperado. Tente novamente."
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
        heading="Gerenciar Anúncios"
        subheading="Envie notificações e avisos para grupos de usuários ou indivíduos específicos."
        icon={<Megaphone className="h-8 w-8 text-primary" />}
      />

      <Card className="shadow-md">

        <CardContent className="space-y-6">
          {/* Título e Mensagem */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Anúncio</Label>
              <Input
                id="title"
                placeholder="Ex: Manutenção Programada"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                className="font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Digite o conteúdo da notificação..."
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
            <Label htmlFor="type">Tipo de Alerta</Label>
            <Select value={type} onValueChange={setType} disabled={loading}>
              <SelectTrigger id="type" className="h-11">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Info className="h-4 w-4" />
                    <span>Informativo</span>
                  </div>
                </SelectItem>
                <SelectItem value="warning">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Aviso Importante</span>
                  </div>
                </SelectItem>
                <SelectItem value="tip">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <Lightbulb className="h-4 w-4" />
                    <span>Dica Útil</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-4">
             {/* Destinatários (Tabs) */}
            <div className="space-y-4">
              <Label>Destinatários</Label>
              <Tabs value={recipientTab} onValueChange={setRecipientTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-11">
                  <TabsTrigger value="role" className="flex items-center gap-2" disabled={loading}>
                    <Users className="h-4 w-4" />
                    Por Papel (Grupo)
                  </TabsTrigger>
                  <TabsTrigger value="specific" className="flex items-center gap-2" disabled={loading}>
                    <User className="h-4 w-4" />
                    Usuários Específicos
                  </TabsTrigger>
                </TabsList>

                <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                    {/* Conteúdo da Aba: Papéis */}
                    <TabsContent value="role" className="mt-0 space-y-3">
                    <Label className="text-xs text-muted-foreground">Selecione um ou mais grupos para receber o alerta:</Label>
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
                        * Nenhum papel selecionado.
                        </p>
                    )}
                    </TabsContent>

                    {/* Conteúdo da Aba: Específicos */}
                    <TabsContent value="specific" className="mt-0 space-y-3">
                        <div className="space-y-2">
                            <Label htmlFor="userIds" className="text-xs text-muted-foreground">
                                Cole os IDs dos usuários separados por vírgula:
                            </Label>
                            <Textarea
                                id="userIds"
                                placeholder="Ex: user_123, user_987, user_xyz..."
                                value={userIdsText}
                                onChange={(e) => setUserIdsText(e.target.value)}
                                disabled={loading}
                                className="font-mono text-sm min-h-[80px]"
                            />
                             <p className="text-xs text-muted-foreground">
                                Dica: Útil para enviar avisos de cobrança ou suporte individual.
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
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                Enviar Anúncio
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}