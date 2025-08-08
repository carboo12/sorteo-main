
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { Loader2, LogIn, Eye, EyeOff } from 'lucide-react';
import type { AppUser } from '@/lib/types';
import { logError } from '@/lib/actions';
import { login } from '@/lib/auth-client';

const formSchema = z.object({
  username: z.string().min(1, 'El nombre de usuario es obligatorio.'),
  password: z.string().min(1, 'La contraseña es obligatoria.'),
});

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
        // --- 1. SUPERUSER HARDCODED CHECK (HIGHEST PRIORITY) ---
        if (values.username.toLowerCase() === 'admin' && values.password === 'ArbolNergro1988$') {
            const superUser: AppUser = {
                uid: 'superuser_local_id',
                email: 'admin@sorteo.xpress',
                name: 'admin',
                role: 'superuser',
                businessId: null,
            };
            login(superUser);
            toast({ title: '¡Éxito!', description: 'Has iniciado sesión como superusuario.' });
            router.push('/dashboard');
            return;
        }

        // --- 2. MASTERUSER DB CHECK (SECOND PRIORITY) ---
        const masterUserQuery = query(collection(db, "masterusers"), where("nombre", "==", values.username));
        const masterUserSnapshot = await getDocs(masterUserQuery);

        if (!masterUserSnapshot.empty) {
            const masterUserData = masterUserSnapshot.docs[0].data();
            if (masterUserData.contraseña === values.password) {
                 const masterUser: AppUser = {
                    uid: masterUserSnapshot.docs[0].id,
                    email: masterUserData.email || `${masterUserData.nombre}@sorteo.xpress`,
                    name: masterUserData.nombre,
                    role: 'superuser',
                    businessId: null,
                };
                login(masterUser);
                toast({ title: '¡Éxito!', description: 'Has iniciado sesión como superusuario.' });
                router.push('/dashboard');
                return;
            } else {
                // Password for masteruser is incorrect, throw error and stop.
                 throw new Error("Usuario o contraseña incorrectos.");
            }
        }

        // --- 3. NORMAL USER AUTHENTICATION (FALLBACK) ---
        // Try to find user by name first, then by email.
        let userDoc: DocumentData | null = null;

        // Query by name
        const userByNameQuery = query(collection(db, "users"), where("name", "==", values.username));
        const userByNameSnapshot = await getDocs(userByNameQuery);

        if (!userByNameSnapshot.empty) {
            userDoc = userByNameSnapshot.docs[0].data();
        } else {
            // If not found by name, query by email
            const userByEmailQuery = query(collection(db, "users"), where("email", "==", values.username));
            const userByEmailSnapshot = await getDocs(userByEmailQuery);
            if (!userByEmailSnapshot.empty) {
                userDoc = userByEmailSnapshot.docs[0].data();
            }
        }

        if (!userDoc) {
            throw new Error("Usuario o contraseña incorrectos.");
        }
        
        if (userDoc.disabled) {
            throw new Error("Tu cuenta ha sido inhabilitada. Contacta al administrador.");
        }
        
        const userEmail = userDoc.email as string;

        if (!userEmail) {
             throw new Error("El usuario no tiene un email asociado.");
        }
        
        await signInWithEmailAndPassword(auth, userEmail, values.password);
      
        toast({ title: '¡Éxito!', description: 'Has iniciado sesión correctamente.' });
        router.push('/dashboard');

    } catch (error: any) {
        await logError(`Login attempt for user: ${values.username}`, error);
        
        let errorMessage = 'Usuario o contraseña incorrectos.';
        if (error.code === 'auth/invalid-credential' || error.message.includes("incorrectos")) {
             errorMessage = 'Usuario o contraseña incorrectos.';
        } else if (error.message.includes("inhabilitada")) {
             errorMessage = "Tu cuenta ha sido inhabilitada. Contacta al administrador.";
        }


        toast({
            variant: 'destructive',
            title: 'Error al Iniciar Sesión',
            description: errorMessage,
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tighter text-primary">Sorteo Xpress</CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder al sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de Usuario o Email</FormLabel>
                    <FormControl>
                      <Input placeholder="tu-usuario o tu-email@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          {...field}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute inset-y-0 right-0 flex items-center justify-center h-full px-3 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword((prev) => !prev)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                          <span className="sr-only">
                            {showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          </span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                Iniciar Sesión
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
