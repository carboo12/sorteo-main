
'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from "@/components/dashboard-layout";
import BusinessForm from "@/components/business-form";
import { getBusinessById } from '@/lib/actions';
import type { Business } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function EditBusinessPage({ params }: { params: { id: string } }) {
    const [business, setBusiness] = useState<Business | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBusiness = async () => {
            try {
                const fetchedBusiness = await getBusinessById(params.id);
                if (fetchedBusiness) {
                    setBusiness(fetchedBusiness);
                } else {
                    setError("No se pudo encontrar el negocio especificado.");
                }
            } catch (err) {
                setError("Ocurrió un error al cargar los datos del negocio.");
            } finally {
                setLoading(false);
            }
        };

        fetchBusiness();
    }, [params.id]);

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
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-16 w-16 animate-spin text-primary" />
                    </div>
                ) : error ? (
                    <Card className="bg-destructive/10">
                        <CardHeader>
                            <CardTitle>Error</CardTitle>
                            <CardDescription className="text-destructive">{error}</CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                    <BusinessForm initialData={business} />
                )}
            </div>
        </DashboardLayout>
    );
}
