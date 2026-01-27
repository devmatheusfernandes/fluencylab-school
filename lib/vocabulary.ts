// lib/vocabulary.ts
"use server"; 

export async function getRandomWord(
  language: string
): Promise<{ word: string; translation: string } | null> {
  try {
    // Importa o JSON dinamicamente
    const module = await import(`@/vocabulary/${language}.json`);
    
    // Pega o conteúdo (lidando com export default ou direto)
    const data = module.default || module;

    // VERIFICAÇÃO 1: O array 'words' existe?
    if (!data.words || !Array.isArray(data.words) || data.words.length === 0) {
      console.warn(`Formato inválido ou lista vazia para: ${language}`);
      return null;
    }

    // Sorteia um índice baseado no tamanho do array 'words'
    const randomIndex = Math.floor(Math.random() * data.words.length);
    const selectedEntry = data.words[randomIndex];

    // CORREÇÃO DO ERRO DO REACT:
    // Retornamos apenas as strings específicas, não o objeto inteiro.
    return { 
      word: selectedEntry.englishWord, 
      // Como no seu JSON o 'targetWord' está vazio (""), adicionei um fallback
      translation: selectedEntry.targetWord || "Sem tradução disponível" 
    };

  } catch (error) {
    console.warn(`Could not load vocabulary for language: ${language}`, error);
    return null;
  }
}