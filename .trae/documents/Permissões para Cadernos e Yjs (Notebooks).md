Vou resolver os erros de permissão do `NotebookViewer` e do Yjs.

### **Causa do Problema**
O componente `NotebookViewer` acessa a subcoleção `Notebooks` dentro de `users/{userId}`.
O provedor Yjs (`@gmcfall/yjs-firestore-provider`) tenta acessar caminhos como `users/{userId}/Notebooks/{notebookId}` e possivelmente subcoleções internas (`yjs`, `history`, `awareness`).

Como as regras do Firestore não são recursivas, a regra que definimos anteriormente para `users/{userId}` **não se aplica** automaticamente para `users/{userId}/Notebooks/...`.

### **Solução**
Vou adicionar regras explícitas no `firestore.rules` para permitir o acesso à subcoleção `Notebooks` e todas as suas subcoleções (para cobrir o Yjs).

**Regras propostas:**
1.  **Acesso ao Caderno (`users/{userId}/Notebooks/{notebookId}`):**
    *   Permitir leitura/escrita para o **Dono** (aluno).
    *   Permitir leitura/escrita para **Professores** (para corrigir/ver atividades).
    *   Permitir leitura/escrita para **Managers/Admins**.

2.  **Acesso Recursivo (Yjs/Versions):**
    *   Usar um `match /{document=**}` aninhado dentro de `Notebooks` para garantir que qualquer subcoleção criada pelo Yjs (como `history`, `updates`, `awareness`) herde essas permissões.

Deseja que eu aplique essas regras agora?