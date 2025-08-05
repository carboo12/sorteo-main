'use server';
import * as e from 'firebase-admin';

// Ensure you have a .env.local file with these variables defined
if (e.apps.length === 0) {
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
    console.error('Firebase Admin SDK initialization error: Missing environment variables.');
  }

  try {
    e.initializeApp({
      credential: e.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
      databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
    });
  } catch (error) {
    console.error('Firebase Admin SDK Initialization Error:', error);
  }
}

const firestore = e.firestore();
const auth = e.auth();
export {firestore, auth};
