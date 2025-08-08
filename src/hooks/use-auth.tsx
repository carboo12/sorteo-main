
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

  useEffect(() => {
    // Check for a local user first. This is the highest priority.
    const localUser = getCurrentUser();
    if (localUser) {
      setUser(localUser);
      setLoading(false);
      // If it's a superuser, we don't need to check firebase auth.
      if (localUser.role === 'superuser') {
        return;
      }
    }

    // If not a superuser or no local user, proceed with Firebase auth.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      // Avoid overwriting a logged-in superuser with a null firebase user.
      const currentLocalUser = getCurrentUser();
      if (currentLocalUser && currentLocalUser.role === 'superuser') {
         setUser(currentLocalUser);
         setLoading(false);
         return;
      }

      if (firebaseUser) {
        try {
          const appUser = await getOrCreateUser(firebaseUser.uid, firebaseUser.email);
          if (appUser) {
            localLogin(appUser); // Sync with localStorage for consistency
            setUser(appUser);
          } else {
            // User exists in Firebase Auth but not in our system or is disabled
            await auth.signOut(); // Sign out from firebase
            localSignOut(); // Sign out from local
            setUser(null);
          }
        } catch (error) {
          console.error("Error getting user profile, signing out:", error);
          await auth.signOut();
          localSignOut();
          setUser(null);
        }
      } else {
        // No Firebase user is signed in, ensure local is also cleared.
        localSignOut();
        setUser(null);
      }
      setLoading(false);
    });
    
    // Sync across tabs for logout/login events.
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'app_user' || event.key === null) { // key is null on clear
            window.location.reload();
        }
    };
    window.addEventListener('storage', handleStorageChange);


    return () => {
        unsubscribe();
        window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const signOut = async () => {
    // We must sign out from both, just in case
    await auth.signOut(); 
    localSignOut(); 
    setUser(null);
    window.location.href = '/login'; // Force reload to ensure clean state
  };

  const value = { user, loading, signOut };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
