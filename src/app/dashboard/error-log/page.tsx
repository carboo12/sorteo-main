
'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle, ShieldX, ServerCrash } from "lucide-react";
import { useAuth } from '@/hooks/use-auth';
import { getErrorLogs } from '@/lib/actions';
import type { ErrorLog } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function ErrorLogPage() {
    const { user, loading: authLoading } = useAuth();
    const [logs, setLogs] = useState<ErrorLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && user && (user.role === 'admin' || user.role === 'superuser')) {
            const fetchLogs = async () => {
                setLoading(true);
                try {
                    const fetchedLogs = await getErrorLogs(user);
                    setLogs(fetchedLogs);
                } catch (error) {
                    console.error("Failed to fetch error logs:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchLogs();
        } else if (!authLoading) {
            setLoading(false);
        }
    }, [user, authLoading]);
    
    if (authLoading || loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }
    
    if (user && user.role === 'seller') {
         return (
             <DashboardLayout>
                 <div className="flex-1 space-y-4 p-8 pt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Acceso Denegado</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p>No tienes permiso para ver esta página.</p>
                        </CardContent>
                    </Card>
                 </div>
            </DashboardLayout>
         );
    }

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
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
                            Aquí se mostrará una lista de todos los errores registrados en el sistema.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         {logs.length === 0 ? (
                             <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg text-center">
                                <ShieldX className="h-16 w-16 text-muted-foreground mb-4" />
                                <h3 className="text-xl font-semibold">¡Todo en orden!</h3>
                                <p className="text-muted-foreground">
                                    No se han registrado errores por el momento.
                                </p>
                            </div>
                        ) : (
                            <Accordion type="multiple" className="w-full">
                                {logs.map(log => (
                                    <AccordionItem value={log.id} key={log.id}>
                                        <AccordionTrigger className="hover:no-underline">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between w-full text-left">
                                                <div className="flex-1 mb-2 md:mb-0">
                                                    <p className="font-semibold text-destructive flex items-center gap-2">
                                                        <AlertTriangle size={16} /> 
                                                        <span>{log.context}</span>
                                                    </p>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {format(parseISO(log.timestamp), "d MMM yyyy, h:mm:ss a", { locale: es })}
                                                    </p>
                                                </div>
                                                {user?.role === 'superuser' && (
                                                    <div className="md:ml-4 flex-shrink-0">
                                                        <Badge variant="secondary">{log.businessName || 'Global'}</Badge>
                                                    </div>
                                                )}
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="p-4 bg-muted/50 rounded-md">
                                                <p className="font-semibold">Mensaje de Error:</p>
                                                <p className="text-sm text-destructive font-mono mb-4">{log.errorMessage}</p>
                                                
                                                {log.stack && (
                                                    <>
                                                        <p className="font-semibold">Stack Trace:</p>
                                                        <pre className="text-xs bg-black text-white p-2 rounded-md overflow-x-auto">
                                                            <code>{log.stack}</code>
                                                        </pre>
                                                    </>
                                                )}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
