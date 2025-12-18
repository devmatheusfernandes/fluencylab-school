import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, doc, getDoc, documentId } from 'firebase/firestore';
import { useSession } from 'next-auth/react';

export interface ChatContact {
  id: string;
  name: string;
  image?: string;
  role: string;
}

export function useChatContacts() {
  const { data: session } = useSession();
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContacts() {
      if (!session?.user?.id || !session?.user?.role) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const usersRef = collection(db, 'users');
        let fetchedContacts: ChatContact[] = [];

        if (session.user.role === 'teacher') {
          // Teacher: fetch students where teachersIds contains teacher's ID
          try {
            const q = query(
              usersRef,
              where('role', '==', 'student'),
              where('teachersIds', 'array-contains', session.user.id)
            );
            const querySnapshot = await getDocs(q);
            
            fetchedContacts = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name || data.nickname || 'Unknown',
                    image: data.avatarUrl || data.image || data.photoURL,
                    role: data.role
                };
            });
          } catch (e) {
             console.error("Error querying students:", e);
             throw e;
          }
        } else if (session.user.role === 'student') {
          // Student: read own document, get teachersIds, fetch those users
          const userDocRef = doc(db, 'users', session.user.id);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const teachersIds = userData.teachersIds || [];

            if (teachersIds.length > 0) {
              // Fetch teachers. 
              // We can use 'in' query if <= 10, otherwise split. 
              // For simplicity assuming <= 10 or using chunks is better practice.
              // Given "teachersIds" is likely small, 'in' is efficient.
              // But 'in' requires exact matches on documentId which is special field.
              
              const chunks = [];
              const chunkSize = 10;
              for (let i = 0; i < teachersIds.length; i += chunkSize) {
                chunks.push(teachersIds.slice(i, i + chunkSize));
              }

              const allTeachersDocs: any[] = [];
              
              for (const chunk of chunks) {
                 const q = query(usersRef, where(documentId(), 'in', chunk));
                 const snap = await getDocs(q);
                 allTeachersDocs.push(...snap.docs);
              }

              fetchedContacts = allTeachersDocs.map(doc => {
                  const data = doc.data();
                  return {
                    id: doc.id,
                    name: data.name || data.nickname || 'Unknown',
                    image: data.avatarUrl || data.image || data.photoURL,
                    role: data.role
                  };
              });
            }
          }
        }

        setContacts(fetchedContacts);
      } catch (err: any) {
        console.error('Error fetching chat contacts:', err);
        setError('Failed to load contacts');
      } finally {
        setLoading(false);
      }
    }

    fetchContacts();
  }, [session?.user?.id, session?.user?.role]);

  return { contacts, loading, error };
}
