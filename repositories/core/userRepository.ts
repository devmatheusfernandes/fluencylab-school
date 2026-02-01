import { adminDb } from '@/lib/firebase/admin';
import { User } from '@/types/users/users';

const usersCollection = adminDb.collection('users');

export class UserRepository {

  async findById(id: string): Promise<User | null> {
    const docRef = usersCollection.doc(id);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data() } as User;
    }
    return null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const q = usersCollection.where("email", "==", email);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) return null;

    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() } as User;
  }

  /**
   * Atualiza os dados de um usuário específico no Firestore.
   * Este é o método que usaremos nos serviços.
   * @param userId - O ID do usuário a ser atualizado.
   * @param data - Um objeto contendo os campos a serem atualizados.
   */
  async update(userId: string, data: Partial<User>): Promise<void> {
    const userRef = usersCollection.doc(userId);

    const dataToUpdate = {
      ...data,
      updatedAt: new Date(),
    };

    await userRef.update(dataToUpdate);
    console.log(`Usuário ${userId} atualizado com sucesso.`);
  }
}