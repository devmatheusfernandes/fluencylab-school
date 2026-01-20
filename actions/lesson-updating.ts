'use server';

import { adminDb } from "@/lib/firebase/admin";
import { LearningItem, LearningStructure, Quiz } from "@/types/lesson";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

/**
 * Utilitário para limpar campos undefined antes de enviar ao Firestore
 * O Firestore lança erro se receber { campo: undefined }
 */
function cleanData<T extends Record<string, any>>(data: T): Record<string, any> {
  // Remove metadados para evitar sobrescrita acidental
  const { metadata, ...rest } = data;

  // Truque para remover todos os 'undefined' profundamente
  // Firestore não aceita undefined
  return JSON.parse(JSON.stringify(rest));
}

/**
 * 1. Atualizar Learning Item (Vocabulário)
 */
export async function updateLearningItem(id: string, data: Partial<LearningItem>) {
  try {
    const itemRef = adminDb.collection('learningItems').doc(id);
    
    const updates = cleanData(data);
    
    // Atualiza timestamp
    updates['metadata.updatedAt'] = FieldValue.serverTimestamp();

    await itemRef.update(updates);
    
    // Revalide a rota onde a lista aparece
    revalidatePath('/hub/admin/vocabulary'); 
    revalidatePath(`/hub/admin/vocabulary/${id}`);

    return { success: true };
  } catch (error: any) {
    console.error('Error updating learning item:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 2. Atualizar Learning Structure (Gramática)
 */
export async function updateLearningStructure(id: string, data: Partial<LearningStructure>) {
  try {
    const structureRef = adminDb.collection('learningStructures').doc(id);
    
    const updates = cleanData(data);
    
    // Atualiza timestamp
    updates['metadata.updatedAt'] = FieldValue.serverTimestamp();

    await structureRef.update(updates);
    
    revalidatePath('/hub/admin/structures');
    revalidatePath(`/hub/admin/structures/${id}`);

    return { success: true };
  } catch (error: any) {
    console.error('Error updating learning structure:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 3. Atualizar Quiz (Campo dentro da Lesson)
 */
export async function updateLessonQuiz(lessonId: string, quizData: Quiz) {
  try {
    // O Quiz não é uma coleção separada, é um campo dentro de 'lessons'
    const lessonRef = adminDb.collection('lessons').doc(lessonId);
    
    // Verificamos se o documento existe antes (opcional, mas boa prática)
    const docSnap = await lessonRef.get();
    if (!docSnap.exists) {
      throw new Error("Lição não encontrada");
    }

    // Prepara o objeto de atualização
    // Aqui atualizamos o campo 'quiz' inteiro e o 'updatedAt' da lição
    const cleanQuiz = JSON.parse(JSON.stringify(quizData));

    await lessonRef.update({
      quiz: cleanQuiz,
      'metadata.updatedAt': FieldValue.serverTimestamp(),
    });

    revalidatePath('/hub/admin/lessons');
    revalidatePath(`/hub/admin/lessons/${lessonId}`);

    return { success: true };
  } catch (error: any) {
    console.error('Error updating quiz:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 4. Aprovar Lição (Reviewing -> Ready)
 */
export async function approveLesson(lessonId: string) {
  try {
    const lessonRef = adminDb.collection('lessons').doc(lessonId);
    
    await lessonRef.update({
      status: 'ready',
      'metadata.updatedAt': FieldValue.serverTimestamp()
    });

    revalidatePath('/hub/admin/lessons');
    revalidatePath(`/hub/admin/lessons/${lessonId}`);

    return { success: true };
  } catch (error: any) {
    console.error('Error approving lesson:', error);
    return { success: false, error: error.message };
  }
}
