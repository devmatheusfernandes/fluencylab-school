"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { UserRoles } from "@/types/users/userRoles";

export default function AdminAnnouncementsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === UserRoles.ADMIN;

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "warning" | "tip">("info");
  const [recipientType, setRecipientType] = useState<"role" | "specific">("role");
  const [selectedRoles, setSelectedRoles] = useState<UserRoles[]>([]);
  const [userIdsText, setUserIdsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Sem permissão</h1>
        <p className="text-sm text-muted-foreground">Restrito a administradores.</p>
      </div>
    );
  }

  const toggleRole = (role: UserRoles) => {
    setSelectedRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  async function submit() {
    setLoading(true);
    setFeedback(null);
    try {
      const payload: any = { title, message, type, recipientType };
      if (recipientType === "role") payload.roles = selectedRoles;
      else payload.userIds = userIdsText.split(",").map((s) => s.trim()).filter(Boolean);

      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${res.status}`);
      }
      setFeedback("Anúncio enviado.");
      setTitle("");
      setMessage("");
      setSelectedRoles([]);
      setUserIdsText("");
    } catch (e: any) {
      setFeedback(e.message || "Falha ao enviar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Anúncios</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Título</label>
          <input className="w-full rounded border px-3 py-2 bg-background" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Mensagem</label>
          <textarea className="w-full rounded border px-3 py-2 bg-background" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tipo</label>
          <select className="w-full rounded border px-3 py-2 bg-background" value={type} onChange={(e) => setType(e.target.value as any)}>
            <option value="info">Info</option>
            <option value="warning">Aviso</option>
            <option value="tip">Dica</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Destinatários</label>
          <div className="flex gap-4 mb-2">
            <label className="flex items-center gap-2">
              <input type="radio" checked={recipientType === "role"} onChange={() => setRecipientType("role")} />
              Por papel
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={recipientType === "specific"} onChange={() => setRecipientType("specific")} />
              Usuários específicos
            </label>
          </div>

          {recipientType === "role" ? (
            <div className="grid grid-cols-2 gap-2">
              {[UserRoles.MANAGER, UserRoles.STUDENT, UserRoles.TEACHER, UserRoles.GUARDED_STUDENT, UserRoles.MATERIAL_MANAGER].map((r) => (
                <label key={r} className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedRoles.includes(r)} onChange={() => toggleRole(r)} />
                  {r}
                </label>
              ))}
            </div>
          ) : (
            <div>
              <label className="block text-xs text-muted-foreground mb-1">IDs separados por vírgula</label>
              <input className="w-full rounded border px-3 py-2 bg-background" value={userIdsText} onChange={(e) => setUserIdsText(e.target.value)} />
            </div>
          )}
        </div>

        <button onClick={submit} disabled={loading || !title || !message} className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {loading ? "Enviando..." : "Enviar anúncio"}
        </button>

        {feedback && <p className="text-sm text-muted-foreground">{feedback}</p>}
      </div>
    </div>
  );
}
