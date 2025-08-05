
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getAuth, getFirestore } from '@/lib/firebase-client';

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
        // Fetch user role from Firestore
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
           // This could be a new user, check if they are the first.
           const superUserDocRef = doc(db, 'config', 'superuser');
           const superUserDoc = await getDoc(superUserDocRef);
           if (!superUserDoc.exists()) {
               // First user becomes superuser
               // This part would be handled during sign-up, not sign-in state change.
               // For now, we assume users exist.
                setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: 'unknown' });
           } else {
                setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: 'unknown' });
           }
        }
      } else {
        setUser(null);
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
