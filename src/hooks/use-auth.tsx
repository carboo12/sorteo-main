
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
        
        const isSuperuser = firebaseUser.email === SUPERUSER_EMAIL;
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const role = isSuperuser ? 'superuser' : (userData.role || 'unknown');
          
          if (userData.role !== role) {
             await setDoc(userDocRef, { role: role }, { merge: true });
          }

          setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: role,
              businessId: userData.businessId,
          });

        } else {
           const role = isSuperuser ? 'superuser' : 'unknown';
           const newUserData: Omit<AppUser, 'businessId'> & { createdAt: Date } = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: role,
            createdAt: new Date(),
          };
          await setDoc(userDocRef, newUserData);
          setUser({
            uid: newUserData.uid,
            email: newUserData.email,
            role: newUserData.role
          });
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
