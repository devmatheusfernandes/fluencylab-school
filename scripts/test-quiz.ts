import { quizSchema } from '../lib/validation/schemas';
import { z } from 'zod';

console.log('--- Iniciando Testes do Quiz Schema ---');

// Test 1: Valid Quiz
const validQuiz = {
  quiz_metadata: {
    title: "Test Quiz",
    level: "B1",
    dateGenerated: new Date().toISOString()
  },
  quiz_sections: [
    {
      type: "vocabulary",
      questions: [
        {
          text: "What does 'run' mean?",
          options: ["Correr", "Andar", "Pular", "Nadar"],
          correctIndex: 0,
          explanation: "Run means correr."
        }
      ]
    },
    {
      type: "grammar",
      questions: [
        {
          text: "Choose the correct verb form: She ___ to school.",
          options: ["go", "goes", "going", "gone"],
          correctIndex: 1
        }
      ]
    }
  ]
};

try {
  quizSchema.parse(validQuiz);
  console.log('✅ Teste 1 (Quiz Válido): Passou');
} catch (error) {
  console.error('❌ Teste 1 (Quiz Válido): Falhou', error);
}

// Test 2: Invalid Quiz (Missing options)
const invalidQuiz = {
  quiz_metadata: {
    title: "Invalid Quiz",
    level: "A1",
    dateGenerated: new Date().toISOString()
  },
  quiz_sections: [
    {
      type: "vocabulary",
      questions: [
        {
          text: "Incomplete question",
          options: ["Only one"], // Error: Should be 4
          correctIndex: 0
        }
      ]
    }
  ]
};

try {
  quizSchema.parse(invalidQuiz);
  console.log('❌ Teste 2 (Quiz Inválido): Falhou (Deveria ter lançado erro)');
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('✅ Teste 2 (Quiz Inválido): Passou (Erro detectado corretamente)');
    // console.log(error.issues);
  } else {
    console.error('❌ Teste 2 (Quiz Inválido): Falhou (Erro inesperado)', error);
  }
}

// Test 3: Invalid Section Type
const invalidTypeQuiz = {
  quiz_metadata: {
    title: "Invalid Type Quiz",
    level: "C1",
    dateGenerated: new Date().toISOString()
  },
  quiz_sections: [
    {
      type: "invalid_type", // Error
      questions: []
    }
  ]
};

try {
  quizSchema.parse(invalidTypeQuiz);
  console.log('❌ Teste 3 (Tipo de Seção Inválido): Falhou (Deveria ter lançado erro)');
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('✅ Teste 3 (Tipo de Seção Inválido): Passou (Erro detectado corretamente)');
  } else {
    console.error('❌ Teste 3 (Tipo de Seção Inválido): Falhou (Erro inesperado)', error);
  }
}

console.log('--- Testes Concluídos ---');
