
'use client';

import { 
  signOut,
} from 'firebase/auth';
import { auth } from './firebase';


export async function signOutUser() {
    try {
        await signOut(auth);
        document.cookie = 'firebaseIdToken=; path=/; max-age=-1'; // Clear cookie on sign out
    } catch (error: any) {
        console.error("Error signing out: ", error);
    }
}
