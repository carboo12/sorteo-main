
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
    // Redirige si ya hay un usuario en la sesión del cliente
    if (getCurrentUser()) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
        toast({
            variant: "destructive",
            title: "Campos Incompletos",
            description: "Por favor, introduce tu nombre de usuario y contraseña.",
        });
        return;
    }
    setIsSubmitting(true);

    try {
        // Paso 1 & 2: Buscar usuario por nombre y obtener su email (Server Action)
        const result = await signInWithUsername(username, password);

        if (!result.success || !result.user || !result.user.email) {
            // Si la Server Action falla (ej: usuario no encontrado, error de SDK Admin), muestra el mensaje.
            throw new Error(result.message || 'Usuario o contraseña incorrectos.');
        }

        const appUser = result.user;
        const userEmail = appUser.email;

        // Paso 3: Autenticar en el cliente con email y contraseña
        const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
        const firebaseUser = userCredential.user;
        
        // Si la autenticación de Firebase es exitosa, guardamos la sesión localmente
        login({
            uid: firebaseUser.uid,
            email: appUser.email,
            username: appUser.username,
            nombre: appUser.nombre,
            role: appUser.role,
            businessId: appUser.businessId
        });

        toast({ title: `¡Bienvenido, ${appUser.nombre}!`});
        router.push('/dashboard');

    } catch (error: any) {
        console.error("Error de inicio de sesión: ", error);
        
        let errorMessage = error.message;

        // Mapeo de errores de Firebase Auth a mensajes amigables
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            errorMessage = "Usuario o contraseña incorrectos.";
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
                  onChange={(e) => setUsername(e.target.value.toLowerCase())} // Guardar en minúsculas
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
