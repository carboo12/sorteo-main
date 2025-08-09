
'use client';

import { useEffect, useState } from 'react';
import { getBusinessById } from '@/lib/actions';
import EditBusinessClient from '@/components/edit-business-client';
import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import type { Business } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function EditBusinessPage({ params }: { params: { id: string } }) {
    const { user, loading: authLoading } = useAuth();
    const [business, setBusiness] = useState<Business | null>(null);
    const [loading, setLoading] = useState(true);

     useEffect(() => {
        const fetchBusiness = async () => {
            setLoading(true);
            try {
                const fetchedBusiness = await getBusinessById(params.id);
                setBusiness(fetchedBusiness);
            } catch (error) {
                console.error("Failed to fetch business:", error);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            fetchBusiness();
        }
    }, [params.id, authLoading]);

    if (authLoading || loading) {
        return (
             <DashboardLayout>
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Editar Negocio</h2>
                        <p className="text-muted-foreground">
                            Modifica los detalles del negocio y guarda los cambios.
                        </p>
                    </div>
                </div>
                {business && user ? (
                    <EditBusinessClient business={business} editor={user} />
                ) : (
                    <Card className="bg-destructive/10">
                        <CardHeader>
                            <CardTitle>Error</CardTitle>
                            <CardDescription className="text-destructive">
                                No se pudo encontrar el negocio especificado o ocurrió un error al cargarlo.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
