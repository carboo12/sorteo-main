
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
        let role: AppUser['role'] = isSuperuser ? 'superuser' : 'unknown';
        let businessId: string | undefined = undefined;
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          // The role from the document is only used if the user is not a superuser.
          if (!isSuperuser) {
            role = userData.role || 'unknown';
          }
          businessId = userData.businessId;

          // If the role in the DB is different from the calculated one (e.g., a superuser was previously 'admin'), update it.
          if (userData.role !== role) {
             await setDoc(userDocRef, { role: role }, { merge: true });
          }
        } else {
           // If the document doesn't exist, create it with the determined role.
           await setDoc(userDocRef, {
             uid: firebaseUser.uid,
             email: firebaseUser.email,
             role: role,
             createdAt: new Date(),
           });
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: role,
          businessId: businessId,
        });

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
