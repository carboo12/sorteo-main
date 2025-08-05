
'use server';

import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, firestore } from './firebase';


export async function signInWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string; }> {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function signOutUser() {
    try {
        await signOut(auth);
    } catch (error: any) {
        console.error("Error signing out: ", error);
    }
}

export async function signUpWithEmail(email: string, password: string, role: 'admin' | 'seller', businessId: string): Promise<{ success: boolean; error?: string; }> {
    try {
        // We might need to handle this differently if we want superuser to create users without them signing up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(firestore, "users", user.uid), {
            email: user.email,
            role: role,
            businessId: businessId,
            createdAt: new Date(),
        });
        
        return { success: true };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
