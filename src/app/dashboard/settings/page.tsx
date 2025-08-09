
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SettingsPage() {
    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Configuración</h2>
                        <p className="text-muted-foreground">
                            Ajusta la configuración específica para tu negocio.
                        </p>
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Tasa de Cambio</CardTitle>
                        <CardDescription>
                            Define el valor del Dólar Americano (USD) en Córdobas Nicaragüenses (NIO) para las transacciones.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Configuration form will go here */}
                        <p>El formulario para actualizar la tasa de cambio y otras configuraciones se implementará aquí.</p>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
