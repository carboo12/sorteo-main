
'use client';

import { 
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { getAuth } from './firebase-client';

export async function signInWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string; }> {
    try {
        const auth = getAuth();
        await signInWithEmailAndPassword(auth, email, password);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function signOutUser() {
    try {
        const auth = getAuth();
        await signOut(auth);
    } catch (error: any) {
        console.error("Error signing out: ", error);
    }
}
