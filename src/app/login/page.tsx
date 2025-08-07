
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
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Loader2, LogIn, Eye, EyeOff } from 'lucide-react';
import type { AppUser } from '@/lib/types';
import { logError } from '@/lib/actions';

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
    let userFound: AppUser | null = null;
    let userEmail: string | null = null;

    try {
        // Step 1: Find the user in Firestore to get their email.
        // This logic works for both 'users' and 'masterusers' if they share the 'name' field convention.
        
        // Try finding in 'users' collection first
        let userQuery = query(collection(db, "users"), where("name", "==", values.username));
        let userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
            userFound = userSnapshot.docs[0].data() as AppUser;
            userEmail = userFound.email;
        } else {
            // If not in 'users', check 'masterusers'
            const masterQuery = query(collection(db, "masterusers"), where("nombre", "==", values.username));
            const masterSnapshot = await getDocs(masterQuery);
            if (!masterSnapshot.empty) {
                const masterData = masterSnapshot.docs[0].data();
                userEmail = masterData.email;
            }
        }
        
        if (!userEmail) {
            throw new Error("Usuario no encontrado.");
        }

        // Step 2: Sign in with Firebase Auth using the retrieved email.
        await signInWithEmailAndPassword(auth, userEmail, values.password);
      
        toast({ title: '¡Éxito!', description: 'Has iniciado sesión correctamente.' });
        router.push('/dashboard');

    } catch (error: any) {
        await logError(`Login attempt for user: ${values.username}`, error);

        let errorMessage = 'Ocurrió un error inesperado.';
        if (
            error.code === 'auth/wrong-password' ||
            error.code === 'auth/user-not-found' ||
            error.code === 'auth/invalid-credential' ||
            error.message === "Usuario no encontrado."
        ) {
            errorMessage = 'Usuario o contraseña incorrectos.';
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
