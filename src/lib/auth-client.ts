
'use client';

import { 
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from './firebase';

export async function signInWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string; }> {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function signInWithEmailAndGetToken(email: string, password: string): Promise<{ success: boolean; token?: string; error?: string; }> {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        return { success: true, token };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


export async function signOutUser() {
    try {
        await signOut(auth);
        document.cookie = 'firebaseIdToken=; path=/; max-age=-1'; // Clear cookie on sign out
    } catch (error: any) {
        console.error("Error signing out: ", error);
    }
}
