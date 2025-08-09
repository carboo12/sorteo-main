
'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Building, Loader2, Edit } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { getBusinesses } from '@/lib/actions';
import type { Business } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function BusinessesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user?.role !== 'superuser') {
      router.replace('/dashboard');
      return;
    }

    if (user?.role === 'superuser') {
        const fetchBusinesses = async () => {
            try {
                const fetchedBusinesses = await getBusinesses();
                setBusinesses(fetchedBusinesses);
            } catch (error) {
                console.error("Failed to fetch businesses:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBusinesses();
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
        <DashboardLayout>
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gestión de Negocios</h2>
            <p className="text-muted-foreground">
              Crea y administra los negocios de tus clientes.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={() => router.push('/dashboard/businesses/new')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Negocio
            </Button>
          </div>
        </div>
        
        {businesses.length === 0 ? (
            <Card>
                 <CardContent className="p-8">
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                        <Building className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold">No hay negocios</h3>
                        <p className="text-muted-foreground">
                            Crea un nuevo negocio para empezar.
                        </p>
                    </div>
                 </CardContent>
            </Card>
        ) : (
            <>
            {/* Desktop View: Table */}
            <Card className="hidden md:block">
              <CardHeader>
                <CardTitle>Negocios</CardTitle>
                 <CardDescription>
                    Lista de negocios registrados en la plataforma.
                 </CardDescription>
              </CardHeader>
              <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Teléfono</TableHead>
                                <TableHead>Email Dueño</TableHead>
                                <TableHead>Licencia Expira</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {businesses.map((business) => (
                                <TableRow key={business.id}>
                                    <TableCell>{business.name}</TableCell>
                                    <TableCell>{business.phone}</TableCell>
                                    <TableCell>{business.ownerEmail}</TableCell>
                                    <TableCell>{new Date(business.licenseExpiresAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/businesses/${business.id}`)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Editar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
              </CardContent>
            </Card>

            {/* Mobile View: Cards */}
            <div className="grid gap-4 md:hidden">
                {businesses.map((business) => (
                    <Card key={business.id}>
                        <CardHeader>
                            <CardTitle>{business.name}</CardTitle>
                            <CardDescription>{business.ownerEmail}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="text-sm">
                                <p className="font-medium text-muted-foreground">Teléfono</p>
                                <p>{business.phone}</p>
                           </div>
                           <div className="text-sm">
                                <p className="font-medium text-muted-foreground">Licencia Expira</p>
                                <p>{new Date(business.licenseExpiresAt).toLocaleDateString()}</p>
                           </div>
                           <Button className="w-full" variant="outline" size="sm" onClick={() => router.push(`/dashboard/businesses/${business.id}`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                           </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
            </>
        )}
      </div>
    </DashboardLayout>
  );
}
