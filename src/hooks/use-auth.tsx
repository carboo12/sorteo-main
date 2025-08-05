
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { getAuth, getFirestore } from '@/lib/firebase-client';

const SUPERUSER_EMAIL = 'carboo12@gmail.com';

interface AppUser {
  uid: string;
  email: string | null;
  role: 'superuser' | 'admin' | 'seller' | 'unknown';
  businessId?: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        document.cookie = `firebaseIdToken=${token}; path=/; max-age=3600`;

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: userData.role || 'unknown',
            businessId: userData.businessId,
          });
        } else {
          const isSuperuser = firebaseUser.email === SUPERUSER_EMAIL;
          
          if (isSuperuser) {
             const newUserData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                role: 'superuser' as const,
                createdAt: new Date(),
             };
             await setDoc(userDocRef, newUserData);
             setUser(newUserData);
          } else {
             const newUserData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                role: 'unknown' as const,
                createdAt: new Date(),
             };
             await setDoc(userDocRef, newUserData);
             setUser(newUserData as AppUser);
          }
        }
      } else {
        setUser(null);
        document.cookie = 'firebaseIdToken=; path=/; max-age=-1';
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
