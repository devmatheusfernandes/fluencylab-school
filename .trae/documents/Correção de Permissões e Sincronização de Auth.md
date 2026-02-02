Excelente pergunta. Não vai atrapalhar, pois o componente de sincronização (`FirebaseAuthSync`) será projetado justamente para **manter os dois estados alinhados**.

### **Como funcionará a Sincronização (Login e Logout):**

O componente `FirebaseAuthSync` observará o estado da sessão do NextAuth:

1.  **Quando o usuário faz Login (NextAuth):**
    *   O componente detecta a sessão ativa.
    *   Gera um token seguro no backend.
    *   Autentica o Firebase automaticamente (`signInWithCustomToken`).
    *   *Resultado:* O Firestore passa a aceitar as requisições.

2.  **Quando o usuário faz Logout (NextAuth):**
    *   O componente detecta que a sessão acabou (`status === 'unauthenticated'`).
    *   Executa imediatamente o `signOut(auth)` do Firebase.
    *   *Resultado:* O Firebase também desconecta, garantindo que nenhum dado antigo permaneça acessível.

### **Plano Refinado:**

1.  **Atualizar `firestore.rules`**: Adicionar regras para `placement_progress`.
2.  **Criar `firestore.indexes.json`**: Adicionar índice de `placement_results`.
3.  **Criar API de Token (`api/auth/firebase-token`)**: Para gerar tokens seguros.
4.  **Criar Componente `FirebaseAuthSync`**:
    *   Lógica inteligente que conecta **e desconecta** o Firebase baseado na sessão do NextAuth.
5.  **Integrar no `AuthProvider`**: Para rodar globalmente na aplicação.

Podemos prosseguir?