import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getDatabase, type Database } from 'firebase/database';

const defaultKey = typeof atob !== 'undefined' ? atob('QUl6YVN5Qm5oNUVYSGpWLVpuTzh1M0NKNWhoY21oc2ZOQmlNSlNj') : '';
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || defaultKey;
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
let rtdb: Database;

try {
  app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  db = getFirestore(app);
  rtdb = getDatabase(app);
} catch (err) {
  console.warn('[Firebase] Initialized with fallback dummy mock:', err);
  app = {} as FirebaseApp;
  db = {} as Firestore;
  rtdb = {} as Database;
}

export { app, db, rtdb };
export default app;
