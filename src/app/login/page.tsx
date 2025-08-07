
'use client';

import { useState, FormEvent } from 'react';
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
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Loader2, LogIn, Eye, EyeOff } from 'lucide-react';
import type { AppUser } from '@/lib/types';

const formSchema = z.object({
  username: z.string().min(1, 'El nombre de usuario es obligatorio.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
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
        // 1. Check for Superuser in 'masterusers' collection first
        const masterQuery = query(collection(db, "masterusers"), where("nombre", "==", values.username));
        const masterSnapshot = await getDocs(masterQuery);
        
        if (!masterSnapshot.empty) {
            const masterDoc = masterSnapshot.docs[0];
            const masterData = masterDoc.data();
            
            // 1.1 Superuser found, get their email and use Firebase Auth
            const superuserEmail = masterData.email;
            if (!superuserEmail) {
                throw new Error("El documento del superusuario no tiene un email configurado.");
            }
            
            // 1.2 Sign in superuser with Firebase Auth
            await signInWithEmailAndPassword(auth, superuserEmail, values.password);
            
            toast({ title: '¡Éxito!', description: 'Has iniciado sesión como Superusuario.' });
            router.push('/dashboard');
            router.refresh(); 
            return; // Stop execution after successful superuser login
        }
        
        // 2. If not superuser, check regular 'users' collection
        const userQuery = query(collection(db, "users"), where("name", "==", values.username));
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.empty) {
            throw new Error("Usuario o contraseña incorrectos.");
        }

        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data() as AppUser;
        const userEmail = userData.email;

        if (!userEmail) {
            throw new Error("El usuario no tiene un correo electrónico configurado para iniciar sesión.");
        }

        // 3. Sign in regular user with Firebase Auth
        await signInWithEmailAndPassword(auth, userEmail, values.password);

        toast({ title: '¡Éxito!', description: 'Has iniciado sesión correctamente.' });
        router.push('/dashboard');
        router.refresh();

    } catch (error: any) {
        let errorMessage = 'Ocurrió un error inesperado.';
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            errorMessage = 'Usuario o contraseña incorrectos. Por favor, inténtalo de nuevo.';
        } else if (error.message) {
            errorMessage = error.message;
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
                    <FormLabel>Nombre de Usuario</FormLabel>
                    <FormControl>
                      <Input placeholder="tu-usuario" {...field} />
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
