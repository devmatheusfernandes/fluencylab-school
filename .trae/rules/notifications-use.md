# Guia de Notificações e Anúncios

Este guia estabelece o padrão arquitetural para o envio de notificações e anúncios no sistema FluencyLab School.

## 1. Princípio Fundamental

**Toda notificação deve ser persistida.**

O envio de notificações push (Web Push) é considerado apenas um *canal de entrega*. O registro da notificação deve sempre existir no banco de dados para que o usuário possa consultá-la posteriormente na central de notificações (o "sininho") do aplicativo.

Portanto:
*   ✅ **SEMPRE Use:** [`AnnouncementService`](file:///services/announcementService.ts) para disparar notificações.
*   ❌ **NUNCA Use:** [`PushService`](file:///services/pushService.ts) diretamente em regras de negócio, actions ou componentes.

## 2. Quando usar o AnnouncementService

### A. Notificações de Sistema (Trigger Automático)
Use quando o sistema precisa avisar o usuário sobre um evento específico (ex: "Nova tarefa atribuída", "Status alterado", "Aula agendada").

Utilize o método helper `createSystemAnnouncement`, que já encapsula a lógica de persistência + envio de push.

**Exemplo:**
```typescript
import { announcementService } from "@/services/announcementService";

// Em uma Server Action ou Service
await announcementService.createSystemAnnouncement(
  "Nova Tarefa Atribuída",                      // Título
  `Você foi designado para: ${task.title}`,     // Mensagem
  task.assignedToId,                            // ID do usuário (string ou string[])
  `/hub/admin/tasks?id=${task.id}`              // Link de destino (Opcional, mas recomendado)
);
```

**O que acontece:**
1.  Cria um registro na coleção `announcements` do Firestore.
2.  O serviço detecta a criação e dispara automaticamente o Push Notification.
3.  Se o usuário clicar no push, é redirecionado para o `link`.
4.  Se o usuário ignorar o push, a mensagem permanece na lista de notificações não lidas no app.

### B. Anúncios Manuais / Broadcasts
Use para comunicados gerais criados por administradores (ex: avisos de manutenção, novidades).

Utilize o método base `createAnnouncement`:

```typescript
await announcementService.createAnnouncement(
  title,
  message,
  "info",               // Tipo: 'info' | 'warning' | 'tip'
  adminUserId,          // ID de quem criou
  "role",               // 'role' (para grupos) ou 'specific' (para usuários)
  ["student", "teacher"], // Roles alvo (opcional)
  undefined,            // UserIds alvo (opcional)
  "/hub/news"           // Link (Opcional)
);
```

## 3. PushService (Uso Interno)

O `PushService` é um serviço de infraestrutura de baixo nível.

*   **Responsabilidade:** Apenas entregar a mensagem técnica via protocolo WebPush.
*   **Restrição:** Ele **não deve ser importado** em controllers, server actions ou outros services. Sua única utilização deve ser dentro do próprio `AnnouncementService`.

**Por que essa regra existe?**
Se usarmos o `PushService` diretamente:
1.  A notificação chega no dispositivo.
2.  O usuário clica ou limpa a notificação.
3.  **O histórico é perdido.** O usuário entra no app e não vê registro do que foi avisado.

## Checklist para Novas Notificações

1. [ ] Estou usando `announcementService`?
2. [ ] O título é curto e objetivo?
3. [ ] Adicionei um `link` para levar o usuário direto à ação relevante?
4. [ ] Verifiquei se removi qualquer chamada direta ao `web-push` ou `pushService`?
