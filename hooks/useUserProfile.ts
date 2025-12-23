import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface UserProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
  role?: string;
}

export function useUserProfile(userId: string | undefined) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setUserProfile(null);
      return;
    }

    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserProfile({
            id: userSnap.id,
            name: data.name || data.nickname || 'Usuário',
            avatarUrl: data.avatarUrl || data.image || data.photoURL || null,
            role: data.role
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  return { userProfile, loading };
}
