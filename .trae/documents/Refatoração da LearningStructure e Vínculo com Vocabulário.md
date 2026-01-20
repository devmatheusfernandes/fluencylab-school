# Plano Refinado: Vínculo de Vocabulário em Estruturas

Você propôs substituir o texto da palavra (`word`) diretamente pelo ID e criar itens para *todas* as palavras.

**Minha Avaliação Técnica:**
1.  **Substituir Texto por ID (`word: "ID"`)**: **Não recomendado.**
    *   **Motivo:** Isso cria um problema de "N+1 Queries". Para exibir uma frase simples como "She is at home", o frontend teria que buscar 4 documentos diferentes no banco só para descobrir que o primeiro ID significa "She". Isso deixará o app lento.
    *   **Solução Ideal:** Manter o texto (`word: "She"`) para exibição rápida E adicionar um campo `learningItemId` para o clique/vínculo.

2.  **Criar LearningItem para TODAS as palavras**:
    *   **Alerta:** Isso vai gerar itens para "a", "the", "of", "in". Geralmente não queremos flashcards para essas palavras funcionais, pois polui o deck de estudo do aluno.
    *   **Recomendação:** Vamos focar em vincular as palavras que *realmente* são vocabulário da aula. Se a palavra não tiver ID, ela aparece como texto simples (não clicável), o que é o comportamento padrão esperado em apps como Duolingo/Busuu.

---

## O Plano de Execução

### 1. Tipagem (`types/lesson.ts`)
Vamos adotar o modelo híbrido (Performance + Funcionalidade):

```typescript
// types/lesson.ts
export interface LearningStructure {
  // ...
  sentences: Array<{
    words: string; // "She is at home" (Frase completa)
    // (whole_sentence será removido)
    order: Array<{
      word: string;        // "She" (Texto visual)
      learningItemId?: string; // "id_do_firestore" (Vínculo opcional)
      slug?: string;       // "she_pronoun" (Auxiliar para criação)
      order: number;
      role: GrammaticalRole;
    }>
  }>
}
```

### 2. Prompt e Processamento (`actions/lesson-processing.ts`)
*   **Prompt:** Instruir a IA a incluir o `slug` (identificador único) no objeto da estrutura *apenas se* a palavra corresponder a um item de vocabulário gerado na mesma análise.
*   **Batch:**
    1.  Salvar Vocabulário -> Gerar IDs.
    2.  Salvar Estruturas -> Usar o `slug` para encontrar o ID do vocabulário recém-criado e preencher `learningItemId`.
    3.  *Resultado:* As palavras importantes ficarão azuis/clicáveis. As estruturais ("the", "is") ficarão como texto comum.

### 3. Edição e UI (`LessonComponentsManager.tsx`)
*   Atualizar para usar `words` em vez de `whole_sentence`.
*   Mostrar visualmente quais palavras têm vínculo (ex: ícone de link ou cor diferente) no modal de detalhes.

Se concordar com essa abordagem híbrida (que resolve o problema de performance e mantém a inteligência), posso prosseguir.
