
'use client';

import DashboardLayout from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Building } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function BusinessesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role !== 'superuser') {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user?.role !== 'superuser') {
    return (
        <DashboardLayout>
            <div className="flex justify-center items-center h-full">
                <p>Cargando...</p>
            </div>
        </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gestión de Negocios</h2>
            <p className="text-muted-foreground">
              Crea y administra los negocios de tus clientes.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Negocio
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Negocios</CardTitle>
             <CardDescription>
                Lista de negocios registrados en la plataforma.
             </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                <Building className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">No hay negocios</h3>
                <p className="text-muted-foreground">
                    Crea un nuevo negocio para empezar.
                </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
