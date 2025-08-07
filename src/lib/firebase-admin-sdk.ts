import * as admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;
let initError: Error | null = null;

const hasEnvVars =
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY;

if (hasEnvVars && !admin.apps.length) {
    try {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n');

        adminApp = admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
    } catch (e: any) {
        console.error('Firebase Admin SDK Initialization Error:', e);
        initError = e;
    }
} else if (admin.apps.length) {
    adminApp = admin.app();
}

export const adminInstance = adminApp;
export const adminFirestore = adminApp ? adminApp.firestore() : null;
export const adminAuth = adminApp ? adminApp.auth() : null;


export function isAdminReady(): { ready: boolean; message: string } {
    if (!hasEnvVars) {
        return {
            ready: false,
            message: 'Las variables de entorno de Firebase Admin no están configuradas. Por favor, revisa tu archivo .env.local.'
        };
    }
    if (initError) {
        return {
            ready: false,
            message: `Error en credenciales del servidor: ${initError.message}. Verifica las variables de entorno.`
        };
    }
    if (!adminApp || !adminFirestore) {
        return {
            ready: false,
            message: 'El SDK de Admin no se pudo inicializar. Contacta al soporte.'
        };
    }
    return { ready: true, message: 'SDK de Admin listo.' };
}