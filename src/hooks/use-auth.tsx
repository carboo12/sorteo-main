
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

  // This function handles changes from Firebase Auth, but it will NOT log out a superuser.
  const handleAuthStateChange = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      // A normal user is signed in via Firebase. Get their profile.
      try {
        const appUser = await getOrCreateUser(firebaseUser.uid, firebaseUser.email);
        if (appUser) {
            localLogin(appUser); // Sync with localStorage
            setUser(appUser);
        } else {
            await auth.signOut(); // Log out if profile doesn't exist to prevent errors
        }
      } catch (error) {
        console.error("Error syncing user profile:", error);
        await auth.signOut(); // Log out on error
      }
    } else {
      // Firebase says no user is signed in.
      // We only clear the user IF it's NOT a superuser.
      setUser(currentUser => {
        if (currentUser?.role === 'superuser') {
          return currentUser; // Keep the superuser session active.
        }
        localSignOut(); // Clear localStorage for normal users.
        return null;
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // 1. Initial sync from localStorage. This is crucial for the superuser.
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(true);

    // 2. Subscribe to Firebase auth state changes for normal users.
    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChange);

    // 3. Sync across tabs.
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
    // This will sign out both Firebase users and the local superuser.
    await auth.signOut(); // Triggers onAuthStateChanged which will clear normal users.
    localSignOut(); // Explicitly clear localStorage for the superuser.
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
