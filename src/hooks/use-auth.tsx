
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
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
          // If the user doc doesn't exist, create it.
          const isSuperuser = firebaseUser.email === SUPERUSER_EMAIL;
          
          if (isSuperuser) {
            const batch = writeBatch(db);
            
            // Create a default business for the superuser
            const businessRef = doc(collection(db, 'businesses'));
            batch.set(businessRef, {
              name: 'Mi Negocio Principal',
              owner: firebaseUser.uid,
              createdAt: new Date(),
            });

            // Create the superuser's user document
            const newUserData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                role: 'superuser',
                createdAt: new Date(),
                businessId: businessRef.id,
            };
            batch.set(userDocRef, newUserData);

            await batch.commit();
            setUser(newUserData);

          } else {
             // For normal users, mark them as unknown until assigned to a business.
             const newUserData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                role: 'unknown',
                createdAt: new Date(),
             };
             await setDoc(userDocRef, newUserData);
             setUser(newUserData as AppUser);
          }
        }
      } else {
        setUser(null);
        document.cookie = 'firebaseIdToken=; path=/; max-age=-1'; // Clear cookie
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
