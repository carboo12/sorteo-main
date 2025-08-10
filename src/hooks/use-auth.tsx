
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getOrCreateUser, logEvent } from '@/lib/actions';
import type { AppUser } from '@/lib/types';
import { useToast } from './use-toast';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, signOut: () => {} });

const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const signOut = useCallback(async (isTimeout = false) => {
    const userToLogOut = auth.currentUser ? user : null;

    if (isTimeout && userToLogOut) {
        toast({
            title: 'Sesión Expirada',
            description: 'Tu sesión ha expirado por inactividad. Por favor, inicia sesión de nuevo.',
            variant: 'destructive'
        });
    }
    
    if (userToLogOut && !isTimeout) {
        try {
            await logEvent(userToLogOut, 'logout', 'user', 'User logged out.');
        } catch (e) {
            console.error("Error logging logout event:", e);
        }
    }
    try {
        await auth.signOut();
    } catch (error) {
        console.error("Error signing out:", error);
    } finally {
        setUser(null);
    }
  }, [user, toast]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
            try {
                const appUser = await getOrCreateUser(firebaseUser.uid, firebaseUser.email, async (newUser, isFirstLogin) => {
                    if (isFirstLogin) {
                        await logEvent(newUser, 'login', 'user', 'User logged in successfully.');
                    }
                });

                if (appUser) {
                    if (!appUser.disabled) {
                        setUser(appUser);
                    } else {
                        toast({ variant: 'destructive', title: 'Cuenta Inhabilitada', description: 'Tu cuenta ha sido inhabilitada. Contacta al administrador.'});
                        await auth.signOut();
                        setUser(null);
                    }
                } else {
                    await auth.signOut(); 
                    setUser(null);
                }
            } catch (error: any) {
                console.error("Error getting user profile, signing out:", error);
                if (error.message.includes("inhabilitada")){
                     toast({ variant: 'destructive', title: 'Cuenta Inhabilitada', description: error.message});
                }
                await auth.signOut();
                setUser(null);
            }
        } else {
            setUser(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

   useEffect(() => {
    if (typeof window === 'undefined' || !user) {
        return;
    }

    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            signOut(true);
        }, INACTIVITY_TIMEOUT_MS);
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    
    activityEvents.forEach(event => {
        window.addEventListener(event, resetTimer);
    });
    
    resetTimer();

    return () => {
        clearTimeout(inactivityTimer);
        activityEvents.forEach(event => {
            window.removeEventListener(event, resetTimer);
        });
    };
  }, [user, signOut]);


  const value = { user, loading, signOut: () => signOut(false) };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
