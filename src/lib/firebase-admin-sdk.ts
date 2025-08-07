import * as admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;
let initError: Error | null = null;

// The 'firebase-admin' package automatically detects the service account credentials
// via the GOOGLE_APPLICATION_CREDENTIALS environment variable when deployed.
// For local development, this variable should be set in the .env.local file or shell.
// This simplifies initialization and avoids parsing issues with the private key.

if (!admin.apps.length) {
    try {
        adminApp = admin.initializeApp();
    } catch (e: any) {
        console.error('Firebase Admin SDK Initialization Error:', e);
        initError = e;
    }
} else {
    adminApp = admin.app();
}

export const adminInstance = adminApp;
export const adminFirestore = adminApp ? adminApp.firestore() : null;
export const adminAuth = adminApp ? adminApp.auth() : null;

/**
 * Checks if the Firebase Admin SDK is initialized and ready to use.
 * @returns An object with ready status and a message.
 */
export function isAdminReady(): { ready: boolean; message: string } {
    if (initError) {
        return {
            ready: false,
            message: `Error en credenciales del servidor: ${initError.message}. Verifica las variables de entorno.`
        };
    }
    if (!adminApp || !adminFirestore) {
        return {
            ready: false,
            message: 'El SDK de Admin no se pudo inicializar. Asegúrate de que las credenciales de la aplicación (GOOGLE_APPLICATION_CREDENTIALS) estén configuradas.'
        };
    }
    return { ready: true, message: 'SDK de Admin listo.' };
}