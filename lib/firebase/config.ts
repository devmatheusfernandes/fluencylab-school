// lib/firebase/config.ts

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getEnv } from "@/lib/env/validation";

// Suas chaves de configuração do Firebase, armazenadas de forma segura em variáveis de ambiente validadas.
const firebaseConfig = {
  apiKey: getEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: getEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: getEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
};

// Padrão Singleton: Inicializa o Firebase apenas uma vez.
// Isso evita erros e múltiplas instâncias durante o desenvolvimento com o Next.js (Hot Reload).
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exporta as instâncias dos serviços que você usará no projeto.
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
