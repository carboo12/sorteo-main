
'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, DollarSign, Ticket, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';
import { getBusinessSettings, updateBusinessSettings } from '@/lib/actions';
import type { BusinessSettings } from '@/lib/types';
import DashboardLayout from '@/components/dashboard-layout';

const settingsSchema = z.object({
  exchangeRateUSDToNIO: z.coerce.number().positive({ message: "La tasa de cambio debe ser un número positivo." }),
  ticketPrice: z.coerce.number().min(0, { message: "El precio del número no puede ser negativo." }),
  drawTimes: z.object({
    turno1: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Formato de hora inválido (HH:mm)."}),
    turno2: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Formato de hora inválido (HH:mm)."}),
    turno3: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Formato de hora inválido (HH:mm)."}),
  }),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            exchangeRateUSDToNIO: 0,
            ticketPrice: 0,
            drawTimes: {
                turno1: '11:00',
                turno2: '15:00',
                turno3: '21:00',
            }
        }
    });
    
    useEffect(() => {
        if (authLoading || !user?.businessId) return;

        const fetchSettings = async () => {
            setIsLoading(true);
            const settings = await getBusinessSettings(user!.businessId!);
            if (settings) {
                form.reset({
                    exchangeRateUSDToNIO: settings.exchangeRateUSDToNIO,
                    ticketPrice: settings.ticketPrice,
                    drawTimes: settings.drawTimes,
                });
            }
            setIsLoading(false);
        };

        fetchSettings();

    }, [user, authLoading, form]);


    const onSubmit = async (data: SettingsFormValues) => {
        if (!user?.businessId) {
            toast({ variant: 'destructive', title: "Error", description: "No se encontró un negocio asociado."});
            return;
        }
        setIsSubmitting(true);
        const result = await updateBusinessSettings(user.businessId, data);
        if (result.success) {
            toast({ title: '¡Éxito!', description: 'La configuración se ha guardado correctamente.' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
        setIsSubmitting(false);
    };

    if (authLoading || isLoading) {
         return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }
    
    if (!user?.businessId) {
        return (
            <DashboardLayout>
                <div className="flex-1 space-y-4 p-8 pt-6">
                    <Card className="bg-destructive/10 border-destructive">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                            <div>
                                <CardTitle>Acción Requerida</CardTitle>
                                <CardDescription className="text-destructive">
                                    No estás asociado a ningún negocio. El superusuario debe asignarte a uno.
                                </CardDescription>
                            </div>
                        </CardHeader>
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
                        <h2 className="text-3xl font-bold tracking-tight">Configuración del Negocio</h2>
                        <p className="text-muted-foreground">
                            Ajusta los parámetros operativos y financieros de tu negocio.
                        </p>
                    </div>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                
                                <Card className="p-6">
                                    <div className="flex items-start gap-4">
                                        <DollarSign className="h-8 w-8 text-primary mt-1" />
                                        <div className='flex-1'>
                                            <h3 className="text-lg font-semibold">Configuración Financiera</h3>
                                            <p className="text-sm text-muted-foreground mb-4">Define precios y tasas de cambio.</p>

                                            <div className="grid md:grid-cols-2 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="exchangeRateUSDToNIO"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Tasa de Cambio (USD a NIO)</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" step="0.01" placeholder="Ej: 36.50" {...field} />
                                                            </FormControl>
                                                            <FormDescription>1 Dólar Americano (USD) equivale a X Córdobas (NIO).</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                 <FormField
                                                    control={form.control}
                                                    name="ticketPrice"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Precio del Número (NIO)</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" placeholder="Ej: 10" {...field} />
                                                            </FormControl>
                                                             <FormDescription>El costo de cada número de rifa en la moneda local.</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-6">
                                    <div className="flex items-start gap-4">
                                        <Clock className="h-8 w-8 text-primary mt-1" />
                                        <div className='flex-1'>
                                             <h3 className="text-lg font-semibold">Horarios de Sorteos</h3>
                                            <p className="text-sm text-muted-foreground mb-4">Establece la hora de cierre para cada turno.</p>
                                            <div className="grid sm:grid-cols-3 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="drawTimes.turno1"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                        <FormLabel>Turno Mañana</FormLabel>
                                                        <FormControl>
                                                            <Input type="time" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="drawTimes.turno2"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                        <FormLabel>Turno Tarde</FormLabel>
                                                        <FormControl>
                                                            <Input type="time" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="drawTimes.turno3"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                        <FormLabel>Turno Noche</FormLabel>
                                                        <FormControl>
                                                            <Input type="time" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                                
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Guardar Cambios
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
