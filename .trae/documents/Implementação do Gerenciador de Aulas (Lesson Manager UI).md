# Plano de Implementação da Interface de Gerenciamento de Aulas

Vou criar uma interface completa para criar, editar e processar aulas, integrando as Server Actions existentes com uma UI moderna e funcional.

## 1. Atualização do Backend (`actions/lesson-processing.ts`)
*   **Ajuste em `createLesson`**: Tornar o `contentHtml` opcional (inicializando como vazio) para permitir a criação rápida apenas com Título e Idioma.

## 2. Página de Listagem de Aulas (`.../lessons/page.tsx`)
*   **Listagem**: Exibir todas as aulas da coleção `lessons` do Firestore.
*   **Criação Rápida**: Adicionar um botão "Nova Aula" que abre um **Modal**.
    *   Campos: Título (Obrigatório) e Idioma (Obrigatório - EN/PT).
    *   Ao criar, redirecionar imediatamente para a página de edição da nova aula.

## 3. Página de Detalhes e Edição (`.../lessons/[lessonId]/page.tsx`)
Criarei uma página com layout dividido (Split View):

### A. Painel Esquerdo: Operações (`LessonOperations.tsx`)
Este painel controlará o fluxo de processamento da aula:
1.  **Status**: Visualização do estado atual (Rascunho, Analisando, Processando, Pronto).
2.  **Análise**: Botão para disparar `analyzeLessonContent`.
3.  **Processamento**: Botão para `processLessonBatch` (com feedback visual de progresso).
4.  **Quiz**: Botão para `generateLessonQuiz`.
5.  **Áudio & Transcrição**:
    *   Upload de arquivo (integração com `/api/lesson/upload-audio`).
    *   Player de áudio se existir.
    *   Botão para `generateLessonTranscript`.
    *   Botão para excluir áudio (com confirmação via Modal).

### B. Painel Direito: Editor de Conteúdo (`LessonEditor.tsx`)
*   Reutilizarei o componente `TipTapWorkbooks` através de um wrapper.
*   Permitirá edição livre do conteúdo da aula.
*   Salvamento automático ou manual no Firestore (documento `lessons/{lessonId}`).

## 4. Componentes Novos
*   `components/lessons/LessonOperations.tsx`: Lógica de botões e chamadas de Server Actions.
*   `components/lessons/LessonEditor.tsx`: Wrapper do editor conectado ao documento da aula.
*   `components/lessons/LessonCard.tsx`: Card para a lista de aulas.

## Detalhes Técnicos
*   **Tempo Real**: Uso de `onSnapshot` do Firebase para que o Painel de Operações reaja instantaneamente às mudanças de status (ex: quando a análise termina).
*   **Feedback**: Uso de `sonner` (Toasts) para notificações de sucesso/erro.
*   **Confirmações**: Uso do `components/ui/modal.tsx` para ações destrutivas.
