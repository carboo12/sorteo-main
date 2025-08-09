
'use client';

import DashboardLayout from "@/components/dashboard-layout";
import BusinessForm from "@/components/business-form";
import { useAuth } from "@/hooks/use-auth";


export default function NewBusinessPage() {
    const { user } = useAuth();
    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-8 pt-6">
                 <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Crear Nuevo Negocio</h2>
                        <p className="text-muted-foreground">
                            Rellena el formulario para registrar un nuevo negocio en la plataforma.
                        </p>
                    </div>
                </div>
                {user && <BusinessForm creator={user}/>}
            </div>
        </DashboardLayout>
    )
}
