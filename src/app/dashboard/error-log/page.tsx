
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ErrorLogPage() {
    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Log de Errores</h2>
                        <p className="text-muted-foreground">
                            Revisa los errores que han ocurrido en la aplicación.
                        </p>
                    </div>
                </div>
                 <Card>
                    <CardHeader>
                        <CardTitle>Registros de Errores</CardTitle>
                        <CardDescription>
                            Aquí se mostrará una lista de todos los errores registrados.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Error log table/list will go here */}
                         <p>La lista o tabla de errores se implementará aquí.</p>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
