import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setLogLevel } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
// Safely load local config if present in the workspace (kept in .gitignore to avoid committing secrets to GitHub)
const localConfigs = import.meta.glob('../firebase-applet-config.json', { eager: true });
const localConfigModule = (localConfigs['../firebase-applet-config.json'] as any) || {};
const localConfig = localConfigModule.default || localConfigModule || {};

// Read Vite environment variables (standard for production deployments: Vercel, Netlify, Cloud Run, GitHub Pages)
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : ({} as any);

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || localConfig.apiKey || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || localConfig.authDomain || 'kaka-b8837.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || localConfig.projectId || 'kaka-b8837',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || localConfig.storageBucket || 'kaka-b8837.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId || '77980414963',
  appId: env.VITE_FIREBASE_APP_ID || localConfig.appId || '1:77980414963:web:5ed6578ea22b7bb4b7d886',
  firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID || localConfig.firestoreDatabaseId || 'ai-studio-kethwadi-dfdfe6e3-3612-4864-b1cf-f4cb827ab15c',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || localConfig.measurementId || '',
};

// Suppress internal Firestore connection retry noise in sandboxed/offline environments
setLogLevel('error');

export const app = initializeApp(firebaseConfig);

// Initialize Firebase Analytics safely for supported environments
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

// CRITICAL: Connect to designated Firestore database ID
const dbId =
  firebaseConfig.firestoreDatabaseId &&
  firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined;

export const db = dbId ? getFirestore(app, dbId) : getFirestore(app);
export const auth = getAuth(app);

// Test Firestore connection on boot as mandated by skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code;

  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };

  // If transient offline/unavailable, report diagnostic without crashing application loop
  if (
    errCode === 'unavailable' ||
    errMessage.includes('the client is offline') ||
    errMessage.includes('Could not reach Cloud Firestore backend')
  ) {
    console.warn('Firestore offline notice:', JSON.stringify(errInfo));
    return;
  }

  // If permission denied or missing permissions occurs during logout, unauthenticated state, or background snapshot teardown
  if (
    !auth.currentUser ||
    errCode === 'permission-denied' ||
    errMessage.includes('Missing or insufficient permissions')
  ) {
    console.warn('Firestore permission notice (unauthenticated or transition):', JSON.stringify(errInfo));
    return;
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
