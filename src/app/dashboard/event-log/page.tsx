
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function EventLogPage() {
    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Registro de Eventos</h2>
                        <p className="text-muted-foreground">
                            Audita todas las acciones realizadas por los usuarios en el sistema.
                        </p>
                    </div>
                </div>
                 <Card>
                    <CardHeader>
                        <CardTitle>Eventos del Sistema</CardTitle>
                        <CardDescription>
                            Aquí se mostrará una lista de todas las acciones importantes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Event log table/list will go here */}
                         <p>La lista o tabla de eventos se implementará aquí.</p>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
