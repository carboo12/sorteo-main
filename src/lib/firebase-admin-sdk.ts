
import * as admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;
let initError: Error | null = null;

const serviceAccount = {
    projectId: "sorteo-xpress",
    clientEmail: "firebase-adminsdk-pwsd3@sorteo-xpress.iam.gserviceaccount.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCmG5o6S0pP01VL\niOQdYg/Q5tvc2lM13iQc1V1Xf7cHDQ5M3//z5eZk2v9S09u+B9iS3+M/nJT/09PZ\nZ0g8a1Q2M0M8F08X6A9j1Y5E7O4X5Q3L8N6H9v3b8bV4Z2s7D5F7C5h3e4i1p4j8\nn6T8e9f5b6+Z9g8i4V0f0E9a6p4Z2s7D5F7C5h3e4i1p4j8n6T8e9f5b6+Z9g8i\n4V0f0E9a6p+c2lM13iQc1V1Xf7cHDQ5M3//z5eZk2v9S09u+B9iS3+M/nJT/09PZ\nZ0g8a1Q2M0M8F08X6A9j1Y5E7O4X5Q3L8N6H9v3b8bV4Z2s7D5F7C5h3e4i1p4j8\nn6T8e9f5b6+Z9g8i4V0f0E9a6p+c2lM13iQc1V1Xf7cHDQ5M3//z5eZk2v9S09u+\nB9iS3+M/nJT/09PZZ0g8a1Q2M0M8F08X6A9j1Y5E7O4X5Q3L8N6H9v3b8bV4Z2s7\nD5F7C5h3e4i1p4j8n6T8e9f5b6+Z9g8i4V0f0E9a6p+c2lM13iQc1V1Xf7cHDQ5M\n3//z5eZk2v9S09u+B9iS3+M/nJT/09PZZ0g8a1Q2M0M8F08X6A9j1Y5E7O4X5Q3L\n8N6H9v3b8bV4Z2s7D5F7C5h3e4i1p4j8n6T8e9f5b6+Z9g8i4V0f0E9a6p+c2lM1\n3iQc1V1Xf7cHDQ5M3//z5eZk2v9S09u+B9iS3+M/nJT/09PZZ0g8a1Q2M0M8F08X\n6A9j1Y5E7O4X5Q3L8N6H9v3b8bV4Z2s7D5F7C5h3e4i1p4j8n6T8e9f5b6+Z9g8i\n4V0f0E9a6pAgMBAAECggEBAKj1o5d7g8x7k5v4z4f7h9h7g8x7k5v4z4f7h9h7g8x7\nk5v4z4f7h9h7g8x7k5v4z4f7h9h7g8x7k5v4z4f7h9h7g8x7k5v4z4f7h9h7g8x7\nk5v4z4f7h9h7g8x7k5v4z4f7h9h7g8x7k5v4z4f7h9h7g8x7k5v4z4f7h9h7g8x7\nk5v4z4f7h9h7g8x7k5v4z4f7h9h7g8x7k5v4z4f7h9h7g8x7k5v4z4f7h9h7g8x7\nk5v4z4f7h9h7g8x7k5v4z4f7h9h7g8x7k5v4z4f7h9h7g8x7k5v4z4f7h9h7g8x7\nk5v4z4f7h9h7g8x7k5v4z4f7h9h7g8x7k5v4z4f7h9h7g8x7k5v4z4f7h9h7g8x7\nk5v4z4f7h9h7g8x7k5v4z4f7h9h7g8x7k5v4z4f7h9h7g8x7k5v4z4f7h9h7g8x7\nk5v4z4f7h9h7g8x7k5v4z4f7h9h7g8x7k5v4z4f7h9h7g8x7k5v4z4f7h9j7QKBg\nQDf5\n-----END PRIVATE KEY-----\n",
};

if (!admin.apps.length) {
    try {
        adminApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
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


export function isAdminReady(): { ready: boolean; message: string } {
    if (initError) {
        return {
            ready: false,
            message: `Error en credenciales del servidor: ${initError.message}.`
        };
    }
    if (!adminApp || !adminFirestore) {
        return {
            ready: false,
            message: 'El SDK de Admin no se pudo inicializar. Las credenciales no son válidas.'
        };
    }
    return { ready: true, message: 'SDK de Admin listo.' };
}
