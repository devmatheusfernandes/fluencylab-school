# Plano de Implementação: Sessão de Estudos SRS com Gamificação

## 1. Definição de Tipos e Lógica (SRS & Gamificação)

### 1.1 Atualizar Tipo de Usuário (`types/users/users.ts`)
Adicionaremos os campos necessários para suportar a gamificação diretamente no perfil do usuário.
- `currentXP`: Experiência atual.
- `level`: Nível atual (baseado em XP).
- `streak`: Objeto com `current` (dias seguidos), `lastStudyDate` (última data) e `best` (melhor sequência).
- `studyHeatmap`: Registro de atividade diária para o gráfico de contribuição.

### 1.2 Criar Tipos SRS (`types/srs.ts`)
Definiremos as interfaces para os Flashcards e os dados do algoritmo.
- `Flashcard`: Estrutura do cartão (frente, verso, dados SRS).
- `SRSData`: Dados persistentes do algoritmo (intervalo, facilidade, repetições).

### 1.3 Algoritmo SM-2 (`lib/srs/algorithm.ts`)
Implementação pura da lógica de cálculo do próximo intervalo de revisão baseada na nota do usuário (0-5).

## 2. Componentes de UI

### 2.1 `Flashcard` (Componente Visual)
- Uso de **Framer Motion** para animação 3D de "flip".
- Design frente e verso utilizando Shadcn `Card`.
- Suporte a conteúdo rico (texto, e potencialmente imagens no futuro).

### 2.2 `FlashcardSession` (Gerenciador de Sessão)
- Controle de estado da sessão (cartão atual, fila de revisão).
- Barra de progresso da sessão.
- Listeners de teclado (Espaço, 1-4).
- Feedback visual de acerto/erro.

### 2.3 `GamificationHeader`
- Exibição do Nível e Barra de XP (Shadcn `Progress`).
- Visualizador de Streak ("Foguinho").

### 2.4 `ContributionHeatmap`
- Visualização estilo GitHub da densidade de estudos nos últimos meses.

### 2.5 `SessionSummary`
- Tela final com resumo: Cartas revisadas, XP ganho, novos desbloqueios.

## 3. Integração e Lógica de Negócio (Hooks)

### 3.1 `useGamification` (Hook)
- Centraliza a lógica de adicionar XP, verificar subida de nível e atualizar o Streak.
- Simula a persistência no Firebase (preparado para conectar com `userService`).

### 3.2 `useSRS` (Hook)
- Gerencia a fila de cards e aplica o algoritmo SM-2 a cada revisão.

## 4. Página Principal (`app/[locale]/hub/student/my-practice/page.tsx`)
- Instancia o `FlashcardSession`.
- Gera dados de mock (se nenhum for fornecido) para teste imediato.
- Integração com o layout do Hub do aluno.

## 5. Estratégia de Execução
1.  **Tipos e Lib:** Criar arquivos de tipos e algoritmo.
2.  **Hooks:** Implementar a lógica de gamificação e sessão.
3.  **Componentes:** Construir os componentes visuais um a um.
4.  **Página:** Montar a página final e testar o fluxo completo.
