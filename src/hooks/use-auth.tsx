
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
  const [user, setUser] = useState<AppUser | null>(() => getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const localUser = getCurrentUser();
    if (localUser) {
        setUser(localUser);
    }
    setLoading(false); // Initial check done, no longer loading.

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
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
                    if (!currentLocalUser || JSON.stringify(appUser) !== JSON.stringify(currentLocalUser)) {
                        localLogin(appUser);
                        setUser(appUser);
                    }
                } else {
                    await auth.signOut();
                }
            } catch (error) {
                console.error("Error getting user profile, signing out:", error);
                await auth.signOut();
            }
        } else {
             // If no firebase user, but we have a non-superuser local user, sign out.
            if (currentLocalUser && currentLocalUser.role !== 'superuser') {
                localSignOut();
                setUser(null);
            }
        }
        setLoading(false);
    });

    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === USER_KEY) {
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
    setLoading(true);
    await auth.signOut().catch(console.error); 
    localSignOut();
    setUser(null);
    window.location.href = '/login';
    setLoading(false);
  };

  const value = { user, loading, signOut };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
