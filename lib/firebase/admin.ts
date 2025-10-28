import admin from 'firebase-admin';
import { getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { getEnv } from '@/lib/env/validation';

// As credenciais são lidas das variáveis de ambiente validadas
const serviceAccount = {
  projectId: getEnv('FIREBASE_ADMIN_PROJECT_ID'),
  clientEmail: getEnv('FIREBASE_ADMIN_CLIENT_EMAIL'),
  privateKey: getEnv('FIREBASE_ADMIN_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
};

let app: App;

if (!getApps().length) {
  // Prepare initialization options
  const appOptions: admin.AppOptions = {
    credential: admin.credential.cert(serviceAccount),
  };
  
  // Add storage bucket if available
  const storageBucket = getEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  if (storageBucket) {
    appOptions.storageBucket = storageBucket;
  }
  
  app = admin.initializeApp(appOptions);
} else {
  app = getApps()[0];
}

const adminDb = admin.firestore();
const adminAuth = getAuth(app);
const adminStorage = getStorage(app);

// Exporta o banco de dados e a autenticação com privilégios de administrador
export { adminDb, adminAuth, adminStorage };