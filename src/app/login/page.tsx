
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
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { login, getCurrentUser } from '@/lib/auth-client';
import { signInWithUsername } from '@/lib/actions';


export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (getCurrentUser()) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
        // 1. Find user by username using the server action to bypass client-side Firestore rules
        const result = await signInWithUsername(username, password);

        if (!result.success || !result.user || !result.user.email) {
            throw new Error(result.message || 'Usuario o contraseña incorrectos.');
        }

        const appUser = result.user;
        const userEmail = appUser.email;

        // 2. Use the retrieved email and the provided password to sign in with Firebase Auth on the client.
        const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
        const firebaseUser = userCredential.user;
        
        // 3. If login is successful, create the local session.
        login({
            uid: firebaseUser.uid,
            email: appUser.email,
            username: appUser.username,
            nombre: appUser.nombre,
            role: appUser.role,
            businessId: appUser.businessId
        });

        toast({ title: `¡Bienvenido, ${appUser.username}!`});
        router.push('/dashboard');

    } catch (error: any) {
        console.error("Error de inicio de sesión: ", error);
        let errorMessage = "Credenciales inválidas. Por favor, inténtalo de nuevo.";
        
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            errorMessage = "Usuario o contraseña incorrectos.";
        } else if (error.message && !error.code) { // Use custom error message from server action
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
                <Label htmlFor="username">Nombre de Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="tu-usuario"
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
