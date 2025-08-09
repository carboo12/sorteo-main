
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

const USER_KEY = 'app_user';

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, signOut: () => {} });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This is the master listener. It determines the auth state.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        // Check if a local user (especially superuser) exists.
        const localUser = getCurrentUser();

        // If firebase user exists, they are the source of truth (unless a superuser is logged in).
        if (firebaseUser) {
             if (localUser?.role === 'superuser') {
                setUser(localUser);
            } else {
                try {
                    const appUser = await getOrCreateUser(firebaseUser.uid, firebaseUser.email);
                    if (appUser) {
                        localLogin(appUser); // Sync local storage
                        setUser(appUser);
                    } else {
                        // User exists in Firebase but not in our DB or is disabled. Sign them out.
                        await auth.signOut(); 
                        setUser(null);
                        localSignOut();
                    }
                } catch (error) {
                    console.error("Error getting user profile, signing out:", error);
                    await auth.signOut();
                    setUser(null);
                    localSignOut();
                }
            }
        } else {
            // No firebase user. Is there a local superuser?
             if (localUser?.role === 'superuser') {
                setUser(localUser);
            } else {
                // No firebase user and no superuser. Clear everything.
                setUser(null);
                localSignOut();
            }
        }
        setLoading(false);
    });

    // Also handle changes from other tabs
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
    localSignOut();
    await auth.signOut().catch(console.error); 
    setUser(null);
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
