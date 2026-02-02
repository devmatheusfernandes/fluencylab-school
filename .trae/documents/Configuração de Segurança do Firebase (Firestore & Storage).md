Vou criar arquivos de regras seguros e personalizados para o seu projeto, cobrindo tanto o Firestore quanto o Storage.

### **1. Estratégia de Segurança (Firestore)**
As regras serão baseadas nos papéis de usuário (`UserRoles`) que identificamos (`admin`, `manager`, `teacher`, `student`, `material_manager`).

**Estrutura das Regras:**
*   **Funções Auxiliares:** Criarei funções como `isAdmin()`, `isTeacher()`, `isOwner(userId)` para reutilizar a lógica de verificação.
*   **Coleção `users`:**
    *   Leitura: O próprio usuário, Admins e Managers.
    *   Escrita: O próprio usuário (dados básicos) e Admins.
*   **Conteúdo Didático (`lessons`, `courses`, `Apostilas`, `tiptap`, etc.):**
    *   Leitura: Todos os usuários autenticados.
    *   Escrita: Apenas `admin` e `material_manager`.
*   **Agendamento (`classes`, `availabilities`):**
    *   Leitura: Professores e alunos envolvidos.
    *   Escrita: Professores (suas agendas), Alunos (agendamento próprio) e Admins.
*   **Financeiro (`subscriptions`, `payments`, etc.):**
    *   Leitura: O dono dos dados, Admins e Managers.
    *   Escrita: Bloqueada para clientes (apenas via Backend/Admin), ou restrita a Admins.
*   **Sistema (`audit_logs`, `announcements`):**
    *   Leitura: Autenticados (announcements) / Admins (logs).
    *   Escrita: Apenas Admins.

### **2. Estratégia de Segurança (Storage)**
Controlaremos o acesso aos arquivos (imagens, áudios, documentos) com base no caminho e dono.

**Estrutura das Regras:**
*   **Avatares (`avatars/{userId}/...`):**
    *   Leitura: Pública ou Autenticada.
    *   Escrita: Apenas o dono (`userId`) ou Admin.
*   **Conteúdo da Escola (`lessons/`, `courses/`, `workbookCovers/`):**
    *   Leitura: Autenticados.
    *   Escrita: `admin` e `material_manager`.
*   **Uploads de Usuários (`user-uploads/{userId}/...`):**
    *   Leitura/Escrita: Apenas o dono e Admins.

### **3. Implementação**
Vou escrever o código completo nos arquivos:
1.  `firebase/firestore.rules`
2.  `firebase/storage.rules`

Deseja que eu prossiga com a criação dessas regras?