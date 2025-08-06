
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import { getCurrentUser, login as localLogin, signOutUser as localSignOut } from '@/lib/auth-client';
import type { AppUser } from '@/lib/types';

const SUPERUSER_EMAIL = 'carboo12@gmail.com';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, signOut: () => {} });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUser = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        document.cookie = `firebaseIdToken=${token}; path=/; max-age=3600`;

        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        const isSuperuser = firebaseUser.email === SUPERUSER_EMAIL;
        let role: AppUser['role'] = isSuperuser ? 'superuser' : 'unknown';
        let businessId: string | undefined = undefined;
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          if (!isSuperuser) {
            role = userData.role || 'unknown';
          }
          businessId = userData.businessId;

          if (userData.role !== role) {
             await setDoc(userDocRef, { role: role }, { merge: true });
          }
        } else {
           await setDoc(userDocRef, {
             uid: firebaseUser.uid,
             email: firebaseUser.email,
             role: role,
             createdAt: new Date(),
           });
        }
        
        const appUser: AppUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: role,
            businessId: businessId,
        };
        
        localLogin(appUser); // Sincroniza con localStorage
        setUser(appUser);
    } else {
        localSignOut(); // Limpia localStorage
        setUser(null);
        document.cookie = 'firebaseIdToken=; path=/; max-age=-1';
    }
    setLoading(false);
  }, []);


  useEffect(() => {
    // Sincronización inicial desde localStorage para renderizado rápido
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false); // Dejar de cargar rápido para evitar pantalla en blanco

    // Firebase onAuthStateChanged para validación y actualización en segundo plano
    const unsubscribe = onAuthStateChanged(auth, syncUser);

    // Escuchar cambios en localStorage para sincronizar entre pestañas
    const handleStorageChange = () => {
        const updatedUser = getCurrentUser();
        setUser(updatedUser);
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
        unsubscribe();
        window.removeEventListener('storage', handleStorageChange);
    };
  }, [syncUser]);

  const signOut = async () => {
    await auth.signOut(); // Esto disparará el onAuthStateChanged y limpiará todo
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
