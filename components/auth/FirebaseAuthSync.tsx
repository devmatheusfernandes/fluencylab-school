"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { signInWithCustomToken, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

export default function FirebaseAuthSync() {
  const { data: session, status } = useSession();
  const isSigningIn = useRef(false);

  useEffect(() => {
    const syncAuth = async () => {
      if (status === "authenticated" && session?.user?.id) {
        // Evita chamadas duplicadas se já estiver logado com o mesmo usuário
        if (auth.currentUser?.uid === session.user.id) return;
        
        if (isSigningIn.current) return;
        isSigningIn.current = true;

        try {
          const res = await fetch("/api/auth/firebase-token");
          if (!res.ok) throw new Error("Failed to fetch token");
          
          const data = await res.json();
          if (data.token) {
            await signInWithCustomToken(auth, data.token);
            // console.log("Firebase Auth Synced");
          }
        } catch (err) {
          console.error("Error syncing Firebase Auth:", err);
        } finally {
          isSigningIn.current = false;
        }
      } else if (status === "unauthenticated") {
        if (auth.currentUser) {
          await signOut(auth);
          // console.log("Firebase Auth Signed Out");
        }
      }
    };

    syncAuth();
  }, [session, status]);

  return null;
}
