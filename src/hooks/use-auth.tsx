
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getCurrentUser, login as localLogin, signOutUser as localSignOut } from '@/lib/auth-client';
import { getOrCreateUser } from '@/lib/actions';
import type { AppUser } from '@/lib/types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, signOut: () => {} });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const handleAuthStateChange = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      // User is signed in with Firebase.
      // Now, get or create their profile from our backend (Firestore) using a server action.
      try {
        const appUser = await getOrCreateUser(firebaseUser.uid, firebaseUser.email);
        
        if (appUser) {
            const token = await firebaseUser.getIdToken();
            // Set cookie for server-side authentication if needed
            document.cookie = `firebaseIdToken=${token}; path=/; max-age=3600`;
            localLogin(appUser); // Sync with localStorage for client-side state
            setUser(appUser);
        } else {
            // This case might happen if getOrCreateUser fails
            await auth.signOut(); // Log out the user to prevent an inconsistent state
        }
      } catch (error) {
        console.error("Error syncing user profile with server action:", error);
        await auth.signOut(); // Log out on error
      }
    } else {
      // User is signed out.
      document.cookie = 'firebaseIdToken=; path=/; max-age=-1';
      localSignOut(); // Clear localStorage
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Initial sync from localStorage for fast UI rendering
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(true); // Set loading to true until auth state is confirmed

    // Subscribe to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChange);

    // Sync across tabs
    const handleStorageChange = () => {
        const updatedUser = getCurrentUser();
        setUser(updatedUser);
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
        unsubscribe();
        window.removeEventListener('storage', handleStorageChange);
    };
  }, [handleAuthStateChange]);

  const signOut = async () => {
    await auth.signOut(); // This will trigger onAuthStateChanged and clear everything.
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
