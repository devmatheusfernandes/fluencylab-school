# Implementação de Áudio e Imagens na Prática

Vou implementar o suporte a TTS (Text-to-Speech) nos Flashcards, suporte a imagens e adaptar o Player de Áudio para segmentos (timestamps), integrando-o ao Quiz de Listening.

## 1. Atualizar Componentes de UI

### `components/practice/PracticeAudioPlayer.tsx`
- **Novas Props:** `startTime` (opcional), `endTime` (opcional).
- **Lógica de Segmento:**
  - Ao montar/abrir, se houver `startTime`, definir `currentTime` para ele.
  - Monitorar `timeUpdate`: se atingir `endTime`, pausar.
  - Adicionar prop `onComplete` para notificar quando o trecho terminar.

### `components/practice/FlashcardExercise.tsx`
- **Novas Props:** `imageUrl` (opcional) e lógica de TTS.
- **Renderização de Imagem:** Se `imageUrl` existir, exibir acima do texto no "Front" do card.
- **TTS (SpeechSynthesis):**
  - Adicionar botão de "Ouvir" (ícone de alto-falante) no canto dos cards (frente e verso).
  - Usar `window.speechSynthesis` para ler o texto (`lang="en-US"`).
  - Parar qualquer áudio em execução ao virar o card.

### `components/practice/QuizExercise.tsx`
- **Novas Props:** `audioSegment` (opcional).
- **Fluxo de Listening:**
  - Se houver áudio, iniciar com as opções ocultas (estado `showOptions = false`).
  - Exibir `PracticeAudioPlayer` configurado com o segmento.
  - Ao terminar o áudio (via `onComplete` do player) ou ao clicar em um botão "Pular/Mostrar Opções", revelar as alternativas.

## 2. Atualizar Tipos e Lógica

### `types/practice.ts`
- Atualizar interface `Quiz` dentro de `PracticeItem` para incluir `audioSegment?: { start: number; end: number; url: string }`.

### `components/practice/PracticeSession.tsx`
- Passar a prop `imageUrl` para o `FlashcardExercise`.
- Passar a prop `audioSegment` para o `QuizExercise` (se disponível no item).

## 3. Verificação (Já realizada)
- O gerador de payload (`lib/practice-logic.ts`) já preenche `imageUrl` para flashcards do Dia 1.
- A estrutura de dados já suporta a passagem dessas informações, falta apenas o "wiring" nos componentes.
