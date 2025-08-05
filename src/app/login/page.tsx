'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Configuración de Firebase directamente en el cliente
// TODO: Reemplaza estos valores con las credenciales de tu proyecto de Firebase
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
};

// Inicializar Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (firebaseConfig.apiKey === "YOUR_API_KEY") {
        toast({
            variant: 'destructive',
            title: 'Error de Configuración',
            description: 'Las credenciales de Firebase no están configuradas. Revisa el objeto firebaseConfig en src/app/login/page.tsx.',
        });
        setIsLoading(false);
        return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      
      toast({ title: '¡Éxito!', description: 'Has iniciado sesión correctamente.' });
      document.cookie = `firebaseIdToken=${token}; path=/; max-age=3600`;
      router.push('/dashboard');

    } catch (error: any) {
      let errorMessage = 'No se pudo iniciar sesión. Por favor, revisa tus credenciales.';
       if (error.code) {
         errorMessage = `Error: ${error.code}. Revisa tus credenciales o la configuración del proyecto.`;
       }
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
          errorMessage = 'Correo electrónico o contraseña incorrectos.';
      }
      toast({
        variant: 'destructive',
        title: 'Error de autenticación',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <form onSubmit={handleLogin}>
          <Card className="shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-primary">Sorteo Xpress</CardTitle>
              <CardDescription>Bienvenido de nuevo. Inicia sesión para continuar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
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
                    disabled={isLoading}
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : <ArrowRight className="mr-2" />}
                Iniciar Sesión
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </main>
  );
}
