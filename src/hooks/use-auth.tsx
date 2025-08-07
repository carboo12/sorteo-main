
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
    // Check for a local superuser first. This is the highest priority.
    const localUser = getCurrentUser();
    if (localUser && (localUser.role === 'superuser' || localUser.uid === 'superuser_local_id')) {
      setUser(localUser);
      setLoading(false);
      return; // Stop here if superuser is found. Do not subscribe to Firebase.
    }

    // If not a superuser, proceed with Firebase auth for normal users.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const appUser = await getOrCreateUser(firebaseUser.uid, firebaseUser.email);
          if (appUser) {
            localLogin(appUser); // Sync with localStorage for consistency
            setUser(appUser);
          } else {
            await auth.signOut();
            setUser(null);
          }
        } catch (error) {
          console.error("Error getting user profile, signing out:", error);
          await auth.signOut();
          setUser(null);
        }
      } else {
        // No Firebase user is signed in.
        localSignOut();
        setUser(null);
      }
      setLoading(false);
    });
    
    // Sync across tabs for logout/login events.
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'app_user') {
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
    await auth.signOut(); // This will trigger onAuthStateChanged to clear Firebase users
    localSignOut(); // Explicitly clear local storage for superuser
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
