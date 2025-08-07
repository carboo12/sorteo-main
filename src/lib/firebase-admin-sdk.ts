
import * as admin from 'firebase-admin';
import serviceAccount from './service-account.json';

// --- Type and Credential Check ---
const typedServiceAccount = serviceAccount as {
    project_id: string;
    private_key: string;
    client_email: string;
};

const isPlaceholder = typedServiceAccount.project_id === 'your-project-id';
let adminApp: admin.app.App | null = null;
let initError: Error | null = null;

// --- Initialization ---
if (!admin.apps.length && !isPlaceholder) {
    try {
        // Replace escaped newlines with actual newlines for the SDK
        const privateKey = typedServiceAccount.private_key.replace(/\\n/g, '\n');

        adminApp = admin.initializeApp({
            credential: admin.credential.cert({
                projectId: typedServiceAccount.project_id,
                clientEmail: typedServiceAccount.client_email,
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
export const adminFirestore = adminApp ? adminApp.firestore() : null!;
export const adminAuth = adminApp ? adminApp.auth() : null!;


/**
 * Checks if the Firebase Admin SDK is initialized and ready to use.
 * @returns An object with ready status and a message.
 */
export function isAdminReady(): { ready: boolean; message: string } {
    if (isPlaceholder) {
        return {
            ready: false,
            message: 'Las credenciales del servidor son de ejemplo. Por favor, actualiza service-account.json.'
        };
    }
    if (initError) {
        return {
            ready: false,
            message: `Error en credenciales del servidor: ${initError.message}. Verifica service-account.json.`
        };
    }
    if (!adminApp) {
        return {
            ready: false,
            message: 'El SDK de Admin no se pudo inicializar. Contacta al soporte.'
        };
    }
    return { ready: true, message: 'SDK de Admin listo.' };
}
