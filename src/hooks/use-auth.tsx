
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
            try {
                // Fetch the full user profile from our database
                const appUser = await getOrCreateUser(firebaseUser.uid, firebaseUser.email);

                if (appUser) {
                    // If user is found and not disabled, set them as the current user
                    setUser(appUser);
                } else {
                    // User might be disabled or not exist in our DB. Sign them out from Firebase.
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
            setUser(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
        await auth.signOut();
    } catch (error) {
        console.error("Error signing out:", error);
    } finally {
        setUser(null);
        // Redirect to login to ensure clean state
        window.location.href = '/login';
    }
  };

  const value = { user, loading, signOut };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
