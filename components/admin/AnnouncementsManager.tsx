// components/admin/AnnouncementsManager.tsx
"use client";

import { useState, useEffect } from "react";
import { UserRoles } from "@/types/users/userRoles";
import { Announcement, AnnouncementType } from "@/types/announcements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useUsers } from "@/hooks/useUsers";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import { FileWarning, Info, InfoIcon, Lightbulb } from "lucide-react";
import { useTranslations } from "next-intl";

export function AnnouncementsManager() {
  const t = useTranslations("Roles");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<AnnouncementType>("info");
  const [recipientType, setRecipientType] = useState<"role" | "specific">(
    "role"
  );
  const [selectedRoles, setSelectedRoles] = useState<UserRoles[]>([
    UserRoles.STUDENT,
  ]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { users, isLoading: usersLoading } = useUsers();

  // Fetch existing announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/admin/announcements");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              `Failed to fetch announcements: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        setAnnouncements(data);
      } catch (error: any) {
        console.error("Error fetching announcements:", error);
        setError(error.message || "Failed to fetch announcements");
        toast.error(
          "Failed to fetch announcements: " + (error.message || "Unknown error")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const handleCreateAnnouncement = async () => {
    if (!title || !message) {
      toast.error("Title and message are required");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          message,
          type,
          recipientType,
          roles: recipientType === "role" ? selectedRoles : undefined,
          userIds: recipientType === "specific" ? selectedUserIds : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Failed to create announcement: ${response.status} ${response.statusText}`
        );
      }

      const newAnnouncement = await response.json();
      setAnnouncements((prev) => [newAnnouncement, ...prev]);
      // Reset form
      setTitle("");
      setMessage("");
      setType("info");
      setSelectedRoles([UserRoles.STUDENT]);
      setSelectedUserIds([]);
      toast.success("Announcement created successfully");
    } catch (error: any) {
      console.error("Error creating announcement:", error);
      setError(error.message || "Failed to create announcement");
      toast.error(
        "Failed to create announcement: " + (error.message || "Unknown error")
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Failed to delete announcement: ${response.status} ${response.statusText}`
        );
      }

      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      toast.success("Announcement deleted successfully");
    } catch (error: any) {
      console.error("Error deleting announcement:", error);
      setError(error.message || "Failed to delete announcement");
      toast.error(
        "Failed to delete announcement: " + (error.message || "Unknown error")
      );
    }
  };

  const getTypeIcon = (type: AnnouncementType) => {
    switch (type) {
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />;
      case "warning":
        return <FileWarning className="w-5 h-5 text-yellow-500" />;
      case "tip":
        return <Lightbulb className="w-5 h-5 text-purple-500" />;
      default:
        return <InfoIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTypeLabel = (type: AnnouncementType) => {
    switch (type) {
      case "info":
        return "Informação";
      case "warning":
        return "Aviso";
      case "tip":
        return "Dica";
      default:
        return "Informação";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Criar Novo Aviso</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do aviso"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mensagem</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Conteúdo do aviso"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as AnnouncementType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Informação</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                  <SelectItem value="tip">Dica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Destinatários
              </label>
              <Select
                value={recipientType}
                onValueChange={(value) =>
                  setRecipientType(value as "role" | "specific")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de destinatário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="role">Por Função</SelectItem>
                  <SelectItem value="specific">
                    Usuários Específicos
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {recipientType === "role" ? (
            <div>
              <label className="block text-sm font-medium mb-1">Funções</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(UserRoles).map((role) => (
                  <label key={role} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRoles((prev) => [...prev, role]);
                        } else {
                          setSelectedRoles((prev) =>
                            prev.filter((r) => r !== role)
                          );
                        }
                      }}
                      className="rounded"
                    />
                    <span>{[role]}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1">Usuários</label>
              {usersLoading ? (
                <p>Carregando usuários...</p>
              ) : (
                <div className="max-h-40 overflow-y-auto border rounded p-2">
                  {users.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center space-x-2 py-1"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUserIds((prev) => [...prev, user.id]);
                          } else {
                            setSelectedUserIds((prev) =>
                              prev.filter((id) => id !== user.id)
                            );
                          }
                        }}
                        className="rounded"
                      />
                      <span>
                        {user.name} ({[user.role]})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button
            onClick={handleCreateAnnouncement}
            disabled={!title || !message || isCreating}
            className="w-full"
          >
            {isCreating ? "Criando..." : "Criar Aviso"}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Avisos Existentes</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {error}
          </div>
        )}

        {loading ? (
          <p>Carregando avisos...</p>
        ) : announcements.length === 0 ? (
          <p className="text-center py-4 text-paragraph/60">
            Nenhum aviso criado ainda
          </p>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="border rounded-lg p-4 hover:bg-surface-hover transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    {getTypeIcon(announcement.type)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{announcement.title}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-surface-2">
                          {getTypeLabel(announcement.type)}
                        </span>
                      </div>
                      <p className="text-sm text-paragraph mt-1">
                        {announcement.message}
                      </p>
                      <div className="mt-2 text-xs text-paragraph/60">
                        Criado em {formatDate(announcement.createdAt)}
                      </div>
                      <div className="mt-1 text-xs text-paragraph/60">
                        {announcement.recipients.type === "role" ? (
                          <span>
                            Destinado a:{" "}
                            {announcement.recipients.roles
                              ?.map((r) => t(r))
                              .join(", ")}
                          </span>
                        ) : (
                          <span>
                            Destinado a{" "}
                            {announcement.recipients.userIds?.length || 0}{" "}
                            usuário(s) específico(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleDeleteAnnouncement(announcement.id)}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
