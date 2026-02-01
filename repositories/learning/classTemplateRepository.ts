import { adminDb } from "@/lib/firebase/admin";
import { ClassTemplate } from "@/types/classes/class";

const templatesCollection = adminDb.collection("class_templates");

export class ClassTemplateRepository {
  /**
   * Busca o template de horário de um aluno específico.
   * @param studentId - O ID do aluno.
   * @returns O objeto do template ou null se não encontrado.
   */
  async get(studentId: string): Promise<ClassTemplate | null> {
    const docRef = templatesCollection.doc(studentId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.log(`Nenhum template encontrado para o aluno: ${studentId}`);
      return null;
    }

    return docSnap.data() as ClassTemplate;
  }

  /**
   * Cria ou atualiza o template de horário de um aluno.
   * @param studentId - O ID do aluno.
   * @param templateData - O objeto completo do template de horário.
   */
  async upsert(studentId: string, templateData: ClassTemplate): Promise<void> {
    const docRef = templatesCollection.doc(studentId);
    await docRef.set(templateData, { merge: true });
    // console.log(`Template para o aluno ${studentId} foi salvo com sucesso.`);
  }

  /**
   * Deleta o template de horário de um aluno.
   * @param studentId - O ID do aluno.
   */
  async delete(studentId: string): Promise<void> {
    const docRef = templatesCollection.doc(studentId);
    await docRef.delete();
    console.log(`Template para o aluno ${studentId} foi deletado.`);
  }
}
