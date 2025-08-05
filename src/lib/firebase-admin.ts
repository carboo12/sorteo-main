'use server';
import * as e from 'firebase-admin';

// Ensure you have a .env.local file with these variables defined
if (e.apps.length === 0) {
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!projectId || !clientEmail || !privateKey) {
    const message = 'Firebase Admin SDK initialization error: Missing environment variables. Ensure FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set.';
    console.error(message);
    // In a real production environment, you might want to throw an error 
    // to prevent the application from starting in a misconfigured state.
    // For this context, we will avoid throwing to prevent a hard crash loop.
  } else {
    try {
      e.initializeApp({
        credential: e.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        databaseURL: `https://${projectId}.firebaseio.com`,
      });
    } catch (error) {
      console.error('Firebase Admin SDK Initialization Error:', error);
    }
  }
}

// Helper function to get the firestore instance, ensuring app is initialized.
function getSafeFirestore() {
  if (e.apps.length === 0) {
    // This case will be hit if initialization failed above.
    // We log an error and return a dummy object or throw, to avoid crashing immediately.
    // In a real app, you might have a more robust way to handle this, like a health check endpoint.
    console.error("Firebase app not initialized, Firestore is unavailable.");
    // Returning a proxied object that throws when used, to make debugging easier.
    return new Proxy({}, {
      get() {
        throw new Error("Attempted to use Firestore, but Firebase Admin SDK is not initialized.");
      }
    }) as e.firestore.Firestore;
  }
  return e.firestore();
}


function getSafeAuth() {
    if (e.apps.length === 0) {
        console.error("Firebase app not initialized, Auth is unavailable.");
        return new Proxy({}, {
            get() {
                throw new Error("Attempted to use Auth, but Firebase Admin SDK is not initialized.");
            }
        }) as e.auth.Auth;
    }
    return e.auth();
}


const firestore = getSafeFirestore();
const auth = getSafeAuth();

export {firestore, auth};
