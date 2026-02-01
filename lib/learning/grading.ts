import { ReviewGrade } from "@/types/financial/plan";

/**
 * Calcula nota 0-5 baseada na proximidade da escrita (Levenshtein)
 */
export function calculateWritingGrade(userInput: string, correct: string): ReviewGrade {
  const cleanInput = userInput.trim().toLowerCase();
  const cleanCorrect = correct.trim().toLowerCase();

  if (cleanInput === cleanCorrect) return 5; // Perfect

  const distance = levenshteinDistance(cleanInput, cleanCorrect);
  const length = cleanCorrect.length;
  
  // Evitar divisão por zero se a resposta correta for vazia (não deveria acontecer)
  if (length === 0) return 0;

  const errorRatio = distance / length;

  if (errorRatio <= 0.2) return 4; // Pequeno erro de digitação (ex: "runing" vs "running")
  if (errorRatio <= 0.4) return 3; // Erro moderado, mas entendeu o conceito
  if (errorRatio <= 0.6) return 2; // Errou bastante
  return 1; // Erro total
}

// Implementação simples de Levenshtein
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Calcula nota 0-5 baseada em quantos movimentos o usuário fez
 * vs o mínimo necessário.
 */
export function calculateOrderingGrade(movesMade: number, minMovesPossible: number): ReviewGrade {
  // Se o usuário resolveu na quantidade perfeita ou muito perto
  if (movesMade <= minMovesPossible) return 5;
  if (movesMade <= minMovesPossible + 1) return 4;
  if (movesMade <= minMovesPossible + 3) return 3;
  
  // Se ele ficou tentando aleatoriamente muitas vezes
  if (movesMade > minMovesPossible * 2) return 1;
  
  return 2;
}
