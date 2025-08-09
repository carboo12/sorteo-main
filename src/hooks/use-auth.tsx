
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
    // 1. Check for a local user first (covers superuser and persisted sessions)
    const localUser = getCurrentUser();
    if (localUser) {
        setUser(localUser);
        // If it's a superuser, we don't need to check Firebase Auth at all.
        if (localUser.role === 'superuser') {
            setLoading(false);
            // We still need the listeners below for multi-tab sync, so we don't return early.
        }
    }

    // 2. Set up Firebase Auth listener for normal users
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      // Don't interfere if a superuser is already logged in.
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
            localLogin(appUser); // This will store the user in localStorage
            setUser(appUser);
          } else {
            // This case handles when a user is disabled or their business is inactive.
            await auth.signOut();
            localSignOut();
            setUser(null);
          }
        } catch (error) {
          console.error("Error getting user profile, signing out:", error);
          await auth.signOut();
          localSignOut();
          setUser(null);
        }
      } else {
        // No Firebase user, so clear local state
        localSignOut();
        setUser(null);
      }
      setLoading(false);
    });
    
    // 3. Set up listener for multi-tab synchronization
    const handleStorageChange = (event: StorageEvent) => {
        // If the user logs in/out on another tab, reload this tab to sync state.
        if (event.key === 'app_user') {
            window.location.reload();
        }
    };
    window.addEventListener('storage', handleStorageChange);

    // 4. Cleanup listeners on component unmount
    return () => {
        unsubscribe();
        window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const signOut = async () => {
    await auth.signOut().catch(console.error); 
    localSignOut(); // Clears localStorage
    setUser(null);
    // Redirecting is cleaner than reloading and avoids potential loops.
    window.location.href = '/login';
  };

  const value = { user, loading, signOut };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
