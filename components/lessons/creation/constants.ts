export interface Step {
  id: number;
  label: string;
  description: string;
}

export const STEPS: Step[] = [
  { id: 1, label: "Conteúdo", description: "Escreva ou cole a aula" },
  { id: 2, label: "Análise", description: "Verificação de qualidade" },
  { id: 3, label: "Processamento", description: "Extração de itens" },
  { id: 4, label: "Componentes", description: "Revisão de vocabulário" },
  { id: 5, label: "Áudio", description: "Podcast e Transcrição" },
  { id: 6, label: "Transcrição", description: "Revisão do texto" },
  { id: 7, label: "Quiz", description: "Geração automática" },
  { id: 8, label: "Revisão Quiz", description: "Ajuste as perguntas" },
  { id: 9, label: "Publicação", description: "Finalize a aula" },
];
