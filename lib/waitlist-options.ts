/** Opções do formulário. Compartilhado entre o formulário (cliente) e a API (servidor). */

export const LANGUAGES = [
  "Inglês",
  "Espanhol",
  "Francês",
  "Alemão",
  "Italiano",
  "Japonês",
  "Português para estrangeiros",
  "Outro",
] as const;

export const STUDENTS_RANGES = [
  { value: "0", label: "Ainda não tenho alunos" },
  { value: "1-5", label: "1 a 5" },
  { value: "6-15", label: "6 a 15" },
  { value: "16-40", label: "16 a 40" },
  { value: "40+", label: "Mais de 40" },
] as const;

export const BILLING_METHODS = [
  { value: "whatsapp_pix", label: "PIX combinado no WhatsApp" },
  { value: "planilha", label: "Planilha ou caderno" },
  { value: "gateway", label: "Plataforma de pagamento (Asaas, Hotmart etc.)" },
  { value: "escola", label: "Uma escola ou empresa paga por mim" },
  { value: "outro", label: "Outro" },
] as const;

export const PRICE_INTENTS = [
  { value: "ate_50", label: "Até R$ 50", midpoint: 35 },
  { value: "50_100", label: "R$ 50 a 100", midpoint: 75 },
  { value: "100_200", label: "R$ 100 a 200", midpoint: 150 },
  { value: "200_400", label: "R$ 200 a 400", midpoint: 300 },
  { value: "acima_400", label: "Acima de R$ 400", midpoint: 500 },
  { value: "nao_pagaria", label: "Não pagaria", midpoint: 0 },
] as const;

export const MAIN_PAINS = [
  { value: "cobrar", label: "Cobrar e lidar com atrasos" },
  { value: "contratos", label: "Contratos e renovações" },
  { value: "material", label: "Material e conteúdo das aulas" },
  { value: "acompanhamento", label: "Acompanhar a evolução do aluno" },
  { value: "agenda", label: "Agenda e reposição de aulas" },
  { value: "captar", label: "Conseguir mais alunos" },
  { value: "outro", label: "Outro" },
] as const;

export const BILLING_VALUES = BILLING_METHODS.map((o) => o.value) as [
  (typeof BILLING_METHODS)[number]["value"],
  ...(typeof BILLING_METHODS)[number]["value"][],
];
export const STUDENTS_VALUES = STUDENTS_RANGES.map((o) => o.value) as [
  (typeof STUDENTS_RANGES)[number]["value"],
  ...(typeof STUDENTS_RANGES)[number]["value"][],
];
export const PRICE_VALUES = PRICE_INTENTS.map((o) => o.value) as [
  (typeof PRICE_INTENTS)[number]["value"],
  ...(typeof PRICE_INTENTS)[number]["value"][],
];
export const PAIN_VALUES = MAIN_PAINS.map((o) => o.value) as [
  (typeof MAIN_PAINS)[number]["value"],
  ...(typeof MAIN_PAINS)[number]["value"][],
];
