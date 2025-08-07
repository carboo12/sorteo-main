import { getBusinessById } from '@/lib/actions';
import EditBusinessClient from '@/components/edit-business-client';
import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default async function EditBusinessPage({ params }: { params: { id: string } }) {
    const business = await getBusinessById(params.id);

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
                {business ? (
                    <EditBusinessClient business={business} />
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
