
'use server';
import *e from 'firebase-admin';

if (e.apps.length === 0) {
  e.initializeApp({
    credential: e.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
}

const firestore = e.firestore();
const auth = e.auth();
export {firestore, auth};
