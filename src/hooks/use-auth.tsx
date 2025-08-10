
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
    const userToLogOut = user;

    if (isTimeout && userToLogOut) {
        toast({
            title: 'Sesión Expirada',
            description: 'Tu sesión ha expirado por inactividad. Por favor, inicia sesión de nuevo.',
            variant: 'destructive'
        });
    }
    
    if (userToLogOut && !isTimeout) {
        await logEvent(userToLogOut, 'logout', 'user', 'User logged out.');
    }
    try {
        await auth.signOut();
    } catch (error) {
        console.error("Error signing out:", error);
    } finally {
        setUser(null);
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    }
  }, [user, toast]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
            try {
                const appUser = await getOrCreateUser(firebaseUser.uid, firebaseUser.email);

                if (appUser) {
                    if (appUser.uid !== user?.uid) { // Check if it's a new login
                         await logEvent(appUser, 'login', 'user', 'User logged in successfully.');
                    }
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
            setUser(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs only once

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
