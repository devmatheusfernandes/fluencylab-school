Vou corrigir os erros de permissão e o problema de carregamento do vocabulário.

### **1. Correção dos Erros de Permissão (Firestore)**

Os erros `Missing or insufficient permissions` em `useUserProfile.ts` e `useChatContacts.ts` ocorrem porque as regras atuais de segurança (`firestore.rules`) são muito restritivas.

**O Problema:**
*   **Alunos** tentam ver os perfis de seus professores, mas a regra atual só permite que eles vejam *seu próprio* perfil.
*   **Professores** tentam listar seus alunos, mas a regra de listagem não está explicitamente permitida.

**A Solução:**
Atualizarei o arquivo `firebase/firestore.rules` para permitir relacionamentos legítimos:
1.  Permitir que **Alunos** leiam documentos de usuários cujos IDs estejam na lista `teachersIds` do próprio aluno (ou seja, seus professores).
2.  Permitir que **Professores** leiam documentos de alunos que tenham o ID do professor em sua lista `teachersIds`.
3.  Permitir que usuários leiam documentos se o ID do usuário estiver na lista `teachersIds` do documento alvo (caso inverso).

### **2. Correção do Erro de Vocabulário (Inglês.json)**

O erro `Cannot find module '@/vocabulary/Inglês.json'` acontece porque o nome do idioma no perfil do usuário está salvo como "Inglês" (ou "Português"), mas os arquivos JSON usam códigos como `en.json` ou `pt.json`.

**A Solução:**
Atualizarei o arquivo `lib/learning/vocabulary.ts` para converter o nome do idioma para o código correto antes de tentar importar o arquivo.

**Plano de Execução:**
1.  **Atualizar `firestore.rules`**: Implementar lógica de leitura baseada em relacionamento (`teachersIds`).
2.  **Atualizar `lib/learning/vocabulary.ts`**: Adicionar mapa de tradução (`Inglês` -> `en`, `Português` -> `pt`).
3.  **Verificar índices**: Se a query de professores (`array-contains`) precisar de índice, criarei a entrada no `firestore.indexes.json`. (Geralmente `array-contains` simples não precisa, mas validarei).

Podemos prosseguir com essas correções?