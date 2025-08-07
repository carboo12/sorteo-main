
'use client';

import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDjebs_A0o3ULi4JzfW0_PMc4u7vx2ClZ0",
  authDomain: "sorteo-xpress.firebaseapp.com",
  projectId: "sorteo-xpress",
  storageBucket: "sorteo-xpress.appspot.com",
  messagingSenderId: "350907987718",
  appId: "1:350907987718:web:2000b622e02b5544945087"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
