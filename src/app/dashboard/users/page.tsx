
'use client';

import DashboardLayout from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, User } from 'lucide-react';

export default function UsersPage() {
  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h2>
            <p className="text-muted-foreground">
              Aquí puedes crear y administrar los usuarios de tu negocio.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Usuario
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Usuarios</CardTitle>
             <CardDescription>
                Lista de usuarios registrados en el sistema.
             </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                <User className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">No hay usuarios</h3>
                <p className="text-muted-foreground">
                    Crea un nuevo usuario para empezar.
                </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
