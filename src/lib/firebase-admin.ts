
import * as e from 'firebase-admin';

// Helper function to initialize the admin app, ensuring it's only done once.
function initializeAdminApp() {
  if (e.apps.length > 0) {
    return e.app();
  }

  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (projectId && clientEmail && privateKey) {
    try {
      return e.initializeApp({
        credential: e.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        databaseURL: `https://${projectId}.firebaseio.com`,
      });
    } catch (error: any) {
      console.error('Firebase Admin SDK Initialization Error:', error.message);
      // We don't throw here, so getSafeFirestore/getSafeAuth will throw a clearer error.
      return null;
    }
  } else {
    console.warn('Firebase Admin SDK credentials are not set in .env.local. Admin features will not be available.');
    return null;
  }
}

// Helper to get Firestore instance safely.
function getSafeFirestore(): e.firestore.Firestore {
  initializeAdminApp(); // Ensure app is initialized
  if (!e.apps.length) {
    throw new Error("Attempted to use Firestore, but Firebase Admin SDK is not initialized. Check your server logs for the original initialization error.");
  }
  return e.firestore();
}

// Helper to get Auth instance safely.
function getSafeAuth(): e.auth.Auth {
    initializeAdminApp(); // Ensure app is initialized
    if (!e.apps.length) {
        throw new Error("Attempted to use Auth, but Firebase Admin SDK is not initialized. Check your server logs for the original initialization error.");
    }
    return e.auth();
}

const firestore = getSafeFirestore();
const auth = getSafeAuth();

export {firestore, auth};
