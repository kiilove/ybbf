import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBnh5EXHjV-ZnO8u3CJ5hhcmhsfNBiMJSc';
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'bdbdgmain';
const databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://bdbdgmain-default-rtdb.asia-southeast1.firebasedatabase.app';

const firebaseConfig = {
  apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'bdbdgmain.firebaseapp.com',
  databaseURL,
  projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'bdbdgmain.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '193967452980',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:193967452980:web:c98e06d5312714483a6b61',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-JXECRGC3L2'
};

let app: FirebaseApp;
let db: Firestore;

try {
  app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (err) {
  console.warn('[Firebase Admin] Initialized with fallback dummy mock:', err);
  app = {} as FirebaseApp;
  db = {} as Firestore;
}

export { app, db };
export default app;
