
import * as admin from 'firebase-admin';
import serviceAccount from './service-account.json';

// Type assertion to ensure serviceAccount has the expected structure
const typedServiceAccount = serviceAccount as {
    type: string;
    project_id: string;
    private_key_id: string;
    private_key: string;
    client_email: string;
    client_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_x509_cert_url: string;
};

// Check if we're dealing with placeholder credentials
const isPlaceholder = typedServiceAccount.project_id === 'your-project-id';

let app: admin.app.App | null = null;

if (!admin.apps.length && !isPlaceholder) {
    try {
        app = admin.initializeApp({
            credential: admin.credential.cert(typedServiceAccount),
        });
    } catch (error) {
        console.error('Failed to initialize Firebase Admin SDK:', error);
        // app remains null
    }
} else if (admin.apps.length) {
    app = admin.app();
}

export const adminInstance = app;
export const adminFirestore = app ? app.firestore() : null;
export const adminAuth = app ? app.auth() : null;
