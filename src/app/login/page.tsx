
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, User as UserIcon } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, firestore } from '@/lib/firebase';
import { login, getCurrentUser } from '@/lib/auth-client';
import type { AppUser } from '@/lib/types';


export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Si el usuario ya ha iniciado sesión, redirigir al dashboard
    if (getCurrentUser()) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
        // 1. Verificar si es Superusuario en 'users' con role 'superuser'
        const superuserQuery = query(collection(firestore, "users"), where("email", "==", username.toLowerCase()), where("role", "==", "superuser"));
        const superuserSnapshot = await getDocs(superuserQuery);
        
        // Asumimos que el email del superusuario también puede ser su "username" para el login.
        if (!superuserSnapshot.empty) {
            try {
                 // Intentar iniciar sesión con Firebase Auth directamente
                await signInWithEmailAndPassword(auth, username, password);
                const userDoc = superuserSnapshot.docs[0];
                const userData = userDoc.data() as AppUser;

                login({
                    uid: userDoc.id,
                    email: userData.email,
                    role: 'superuser',
                    businessId: userData.businessId
                });

                toast({ title: `¡Bienvenido, Superusuario!`});
                router.push('/dashboard');
                return;
            } catch (authError) {
                 // Si falla, el password es incorrecto. Cae al error general.
                 throw new Error("Credenciales de superusuario incorrectas.");
            }
        }
        
        // 2. Si no es superusuario, buscar usuario regular por email en la colección 'users'
        const userQuery = query(collection(firestore, "users"), where("email", "==", username.toLowerCase()));
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.empty) {
            throw new Error("Credenciales inválidas.");
        }

        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data() as AppUser;
        const userEmail = userData.email;

        if (!userEmail) {
            throw new Error("El usuario no tiene un correo electrónico configurado para iniciar sesión.");
        }

        // Usar Firebase Auth para iniciar sesión
        const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
        const firebaseUser = userCredential.user;

        // Si el inicio de sesión es exitoso, crear sesión local
        login({
            uid: firebaseUser.uid,
            email: userData.email,
            role: userData.role,
            businessId: userData.businessId
        });

        toast({ title: `¡Bienvenido!`});
        router.push('/dashboard');

    } catch (error: any) {
        console.error("Error de inicio de sesión: ", error);
        let errorMessage = "Credenciales inválidas. Por favor, inténtalo de nuevo.";
        if (error.code) {
          if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
             errorMessage = "Usuario o contraseña incorrectos.";
          }
        } else if (error.message) {
           errorMessage = error.message;
        }

        toast({
            variant: "destructive",
            title: "Error de Inicio de Sesión",
            description: errorMessage,
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <Card className="shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-primary">Sorteo Xpress</CardTitle>
              <CardDescription>Bienvenido de nuevo. Inicia sesión para continuar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario (Email)</Label>
                <Input
                  id="username"
                  type="email"
                  placeholder="tu@email.com"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                    <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute bottom-0 right-1 h-8 w-8"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span className="sr-only">Toggle password visibility</span>
                    </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : <UserIcon className="mr-2" />}
                {isSubmitting ? 'Verificando...' : 'Iniciar Sesión'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </main>
  );
}
