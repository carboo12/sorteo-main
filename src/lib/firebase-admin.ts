
'use server';

import * as admin from 'firebase-admin';
import serviceAccount from '../../service-account.json';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
}

const adminFirestore = admin.firestore();
const adminAuth = admin.auth();

export { admin, adminFirestore, adminAuth };
