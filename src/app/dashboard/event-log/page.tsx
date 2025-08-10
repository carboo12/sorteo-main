
'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, History, User, Building, Search } from "lucide-react";
import { useAuth } from '@/hooks/use-auth';
import { getEventLogs } from '@/lib/actions';
import type { EventLog } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function EventLogPage() {
    const { user, loading: authLoading } = useAuth();
    const [logs, setLogs] = useState<EventLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && user && (user.role === 'admin' || user.role === 'superuser')) {
            const fetchLogs = async () => {
                setLoading(true);
                try {
                    const fetchedLogs = await getEventLogs(user);
                    setLogs(fetchedLogs);
                } catch (error) {
                    console.error("Failed to fetch event logs:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchLogs();
        } else if (!authLoading) {
            setLoading(false);
        }
    }, [user, authLoading]);

    const getActionBadgeVariant = (action: EventLog['action']) => {
        switch (action) {
            case 'create': return 'default';
            case 'update': return 'secondary';
            case 'delete': return 'destructive';
            case 'login': return 'outline';
            case 'logout': return 'outline';
            case 'claim': return 'default'; // Using 'default' which is often green-ish
            default: return 'secondary';
        }
    };

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
                            Lista de acciones importantes realizadas por los usuarios.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {logs.length === 0 ? (
                             <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg text-center">
                                <Search className="h-16 w-16 text-muted-foreground mb-4" />
                                <h3 className="text-xl font-semibold">No se encontraron eventos</h3>
                                <p className="text-muted-foreground">
                                    Todavía no se ha registrado ninguna acción en el sistema.
                                </p>
                            </div>
                        ) : (
                            <>
                            {/* Desktop View */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha y Hora</TableHead>
                                            <TableHead>Usuario</TableHead>
                                            <TableHead>Acción</TableHead>
                                            <TableHead>Entidad</TableHead>
                                            <TableHead>Detalles</TableHead>
                                             {user?.role === 'superuser' && <TableHead>Negocio</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs.map(log => (
                                            <TableRow key={log.id}>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {format(parseISO(log.timestamp), "d MMM yyyy, h:mm:ss a", { locale: es })}
                                                </TableCell>
                                                <TableCell>{log.userName}</TableCell>
                                                <TableCell>
                                                    <Badge variant={getActionBadgeVariant(log.action)} className="capitalize">{log.action}</Badge>
                                                </TableCell>
                                                <TableCell className="capitalize">{log.entity}</TableCell>
                                                <TableCell className="text-sm">{log.details}</TableCell>
                                                 {user?.role === 'superuser' && <TableCell>{log.businessName || 'N/A'}</TableCell>}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            {/* Mobile View */}
                            <div className="grid gap-4 md:hidden">
                                {logs.map(log => (
                                    <Card key={log.id} className="p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <span className="font-semibold text-foreground">{log.details}</span>
                                            <Badge variant={getActionBadgeVariant(log.action)} className="capitalize shrink-0">{log.action}</Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground space-y-2">
                                            <p className="flex items-center gap-2"><User size={14} /> <span>{log.userName}</span></p>
                                            {user?.role === 'superuser' && log.businessName && <p className="flex items-center gap-2"><Building size={14} /> <span>{log.businessName}</span></p>}
                                            <p className="flex items-center gap-2"><History size={14} /> <span>{format(parseISO(log.timestamp), "d MMM, h:mm a", { locale: es })}</span></p>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
