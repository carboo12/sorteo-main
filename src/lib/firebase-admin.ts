
'use server';

import * as admin from 'firebase-admin';
import serviceAccount from '../../service-account.json';

// Esta función se asegura de que el Admin SDK esté inicializado.
function initializeAdminApp() {
    // Si ya hay una app inicializada, no hacemos nada.
    if (admin.apps.length > 0) {
        return;
    }

    try {
        // La configuración de la cuenta de servicio se importa directamente del archivo JSON.
        // Esto evita problemas de formato con las variables de entorno.
        const serviceAccountInfo = serviceAccount as admin.ServiceAccount;

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccountInfo),
        });
        console.log("Firebase Admin SDK inicializado correctamente.");
    } catch (error: any) {
        console.error('Error al inicializar Firebase Admin SDK:', error.message);
        // El error se muestra en los logs del servidor para facilitar la depuración.
    }
}

// Llama a la inicialización al cargar el módulo.
initializeAdminApp();

// Exportamos una instancia segura de Firestore.
// La función lanzará un error claro si la inicialización falló por alguna razón.
function getSafeFirestore(): admin.firestore.Firestore {
    if (!admin.apps.length) {
        throw new Error("Intento de usar Firestore, pero Firebase Admin SDK no se pudo inicializar. Revisa los logs de tu servidor para ver el error original.");
    }
    return admin.firestore();
}

// Exportamos una instancia segura de Auth.
function getSafeAuth(): admin.auth.Auth {
    if (!admin.apps.length) {
        throw new Error("Intento de usar Auth, pero Firebase Admin SDK no se pudo inicializar. Revisa los logs de tu servidor para ver el error original.");
    }
    return admin.auth();
}

// Exportamos las instancias para ser usadas en otras partes del backend.
const adminFirestore = getSafeFirestore();
const adminAuth = getSafeAuth();

export { admin, adminFirestore, adminAuth };
