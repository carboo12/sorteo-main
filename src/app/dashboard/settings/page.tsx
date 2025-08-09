
'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, DollarSign, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';
import { getBusinessSettings, updateBusinessFinancialSettings, updateBusinessTurnosSettings } from '@/lib/actions';
import type { BusinessSettings, FinancialSettings, TurnosSettings } from '@/lib/types';
import DashboardLayout from '@/components/dashboard-layout';
import { Switch } from '@/components/ui/switch';

// Schema for the financial settings form
const financialSettingsSchema = z.object({
  exchangeRateUSDToNIO: z.coerce.number().positive({ message: "La tasa de cambio debe ser un número positivo." }),
  ticketPrice: z.coerce.number().nonnegative({ message: "El precio del número no puede ser negativo." }),
});

// Schema for the turnos settings form
const turnosSettingsSchema = z.object({
  turnos: z.object({
    turno1: z.object({
      enabled: z.boolean(),
      drawTime: z.string().optional(),
      prize: z.string().optional(),
    }),
    turno2: z.object({
      enabled: z.boolean(),
      drawTime: z.string().optional(),
      prize: z.string().optional(),
    }),
    turno3: z.object({
      enabled: z.boolean(),
      drawTime: z.string().optional(),
      prize: z.string().optional(),
    }),
  }),
}).superRefine((data, ctx) => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (data.turnos.turno1.enabled) {
        if (!data.turnos.turno1.drawTime || !timeRegex.test(data.turnos.turno1.drawTime)) {
             ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Formato de hora inválido (HH:mm).", path: ["turnos", "turno1", "drawTime"] });
        }
        if (!data.turnos.turno1.prize || data.turnos.turno1.prize.trim().length < 1) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El premio es obligatorio.", path: ["turnos", "turno1", "prize"] });
        }
    }
    if (data.turnos.turno2.enabled) {
        if (!data.turnos.turno2.drawTime || !timeRegex.test(data.turnos.turno2.drawTime)) {
             ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Formato de hora inválido (HH:mm).", path: ["turnos", "turno2", "drawTime"] });
        }
        if (!data.turnos.turno2.prize || data.turnos.turno2.prize.trim().length < 1) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El premio es obligatorio.", path: ["turnos", "turno2", "prize"] });
        }
    }
    if (data.turnos.turno3.enabled) {
        if (!data.turnos.turno3.drawTime || !timeRegex.test(data.turnos.turno3.drawTime)) {
             ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Formato de hora inválido (HH:mm).", path: ["turnos", "turno3", "drawTime"] });
        }
        if (!data.turnos.turno3.prize || data.turnos.turno3.prize.trim().length < 1) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El premio es obligatorio.", path: ["turnos", "turno3", "prize"] });
        }
    }
});

type FinancialFormValues = z.infer<typeof financialSettingsSchema>;
type TurnosFormValues = z.infer<typeof turnosSettingsSchema>;

export default function SettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmittingFinancial, setIsSubmittingFinancial] = useState(false);
    const [isSubmittingTurnos, setIsSubmittingTurnos] = useState(false);

    const financialForm = useForm<FinancialFormValues>({
        resolver: zodResolver(financialSettingsSchema),
        defaultValues: { exchangeRateUSDToNIO: 0, ticketPrice: 0 }
    });

    const turnosForm = useForm<TurnosFormValues>({
        resolver: zodResolver(turnosSettingsSchema),
        defaultValues: {
            turnos: {
                turno1: { enabled: true, drawTime: '11:00', prize: '' },
                turno2: { enabled: true, drawTime: '15:00', prize: '' },
                turno3: { enabled: true, drawTime: '21:00', prize: '' },
            },
        }
    });

    useEffect(() => {
        if (authLoading || !user) return;

        if (user.businessId) {
            const fetchSettings = async () => {
                setIsLoading(true);
                try {
                    const settings = await getBusinessSettings(user.businessId!);
                    if (settings) {
                        financialForm.reset({
                            exchangeRateUSDToNIO: settings.exchangeRateUSDToNIO,
                            ticketPrice: settings.ticketPrice,
                        });
                        turnosForm.reset({
                            turnos: settings.turnos
                        });
                    }
                } catch (error) {
                     toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar la configuración.' });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchSettings();
        } else {
             setIsLoading(false);
        }
    }, [user, authLoading, financialForm, turnosForm, toast]);

    const onFinancialSubmit = async (data: FinancialFormValues) => {
        if (!user?.businessId) return;
        setIsSubmittingFinancial(true);
        try {
            const result = await updateBusinessFinancialSettings(user.businessId, data, user);
            if (result.success) {
                toast({ title: '¡Éxito!', description: 'Configuración financiera guardada.' });
                financialForm.reset(data, { keepIsDirty: false });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Ocurrió un error inesperado.' });
        } finally {
            setIsSubmittingFinancial(false);
        }
    };

    const onTurnosSubmit = async (data: TurnosFormValues) => {
        if (!user?.businessId) return;
        setIsSubmittingTurnos(true);
        try {
            const result = await updateBusinessTurnosSettings(user.businessId, data, user);
            if (result.success) {
                toast({ title: '¡Éxito!', description: 'Configuración de turnos guardada.' });
                turnosForm.reset(data, { keepIsDirty: false });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Ocurrió un error inesperado.' });
        } finally {
            setIsSubmittingTurnos(false);
        }
    };

    if (authLoading || isLoading) {
         return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-full"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>
            </DashboardLayout>
        );
    }
    
    if (!user?.businessId && user?.role !== 'superuser') {
        return (
            <DashboardLayout>
                <div className="flex-1 space-y-4 p-8 pt-6">
                    <Card className="bg-destructive/10 border-destructive"><CardHeader className="flex flex-row items-center gap-4"><AlertCircle className="h-8 w-8 text-destructive" /><div><CardTitle>Acción Requerida</CardTitle><CardDescription className="text-destructive">No estás asociado a ningún negocio. El superusuario debe asignarte a uno.</CardDescription></div></CardHeader></Card>
                </div>
            </DashboardLayout>
        );
    }
    
    if (user?.role === 'superuser') {
         return (
            <DashboardLayout>
                <div className="flex-1 space-y-4 p-8 pt-6">
                     <div className="flex items-center justify-between space-y-2"><div><h2 className="text-3xl font-bold tracking-tight">Configuración del Negocio</h2><p className="text-muted-foreground">Los superusuarios ven esta página pero no pueden editar configuraciones.</p></div></div>
                     <Card><CardHeader><CardTitle>Vista de Superusuario</CardTitle></CardHeader><CardContent><p>La configuración es específica para cada negocio y debe ser gestionada por un administrador de ese negocio.</p></CardContent></Card>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2"><div><h2 className="text-3xl font-bold tracking-tight">Configuración del Negocio</h2><p className="text-muted-foreground">Ajusta los parámetros operativos y financieros de tu negocio.</p></div></div>
                <div className="space-y-6">
                    {/* Financial Settings Form */}
                    <Form {...financialForm}>
                        <form onSubmit={financialForm.handleSubmit(onFinancialSubmit)}>
                            <Card>
                                <CardHeader><div className="flex items-start gap-4"><DollarSign className="h-8 w-8 text-primary mt-1" /><div className='flex-1'><h3 className="text-lg font-semibold">Configuración Financiera</h3><p className="text-sm text-muted-foreground">Define precios y tasas de cambio.</p></div></div></CardHeader>
                                <CardContent>
                                    <div className="grid md:grid-cols-2 gap-6 pl-12">
                                        <FormField control={financialForm.control} name="exchangeRateUSDToNIO" render={({ field }) => (<FormItem><FormLabel>Tasa de Cambio (USD a NIO)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="Ej: 36.50" {...field} /></FormControl><FormDescription>1 Dólar Americano (USD) equivale a X Córdobas (NIO).</FormDescription><FormMessage /></FormItem>)} />
                                        <FormField control={financialForm.control} name="ticketPrice" render={({ field }) => (<FormItem><FormLabel>Precio del Número (NIO)</FormLabel><FormControl><Input type="number" placeholder="Ej: 10" {...field} /></FormControl><FormDescription>El costo de cada número. Poner 0 si es gratis.</FormDescription><FormMessage /></FormItem>)} />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end p-4 border-t">
                                    <Button type="submit" disabled={isSubmittingFinancial || !financialForm.formState.isDirty}>
                                        {isSubmittingFinancial && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Guardar Cambios Financieros
                                    </Button>
                                </CardFooter>
                            </Card>
                        </form>
                    </Form>

                    {/* Turnos Settings Form */}
                    <Form {...turnosForm}>
                        <form onSubmit={turnosForm.handleSubmit(onTurnosSubmit)}>
                            <Card>
                                <CardHeader><div className="flex items-start gap-4"><Clock className="h-8 w-8 text-primary mt-1" /><div className='flex-1'><h3 className="text-lg font-semibold">Gestión de Turnos y Premios</h3><p className="text-sm text-muted-foreground">Habilita o deshabilita turnos, y define sus horarios y premios.</p></div></div></CardHeader>
                                <CardContent className="space-y-6 pl-12">
                                    <div className="space-y-4 p-4 rounded-md border">
                                        <FormField control={turnosForm.control} name="turnos.turno1.enabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between"><div className='space-y-0.5'><FormLabel className="text-base">Turno Mañana</FormLabel><FormDescription>Habilitar o deshabilitar este turno.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                                        <div className="grid sm:grid-cols-2 gap-6">
                                            <FormField control={turnosForm.control} name="turnos.turno1.drawTime" render={({ field }) => (<FormItem><FormLabel>Hora del Sorteo</FormLabel><FormControl><Input type="time" {...field} value={field.value ?? ""} disabled={!turnosForm.watch('turnos.turno1.enabled')} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={turnosForm.control} name="turnos.turno1.prize" render={({ field }) => (<FormItem><FormLabel>Premio</FormLabel><FormControl><Input placeholder="Ej: 100 Córdobas" {...field} value={field.value ?? ""} disabled={!turnosForm.watch('turnos.turno1.enabled')} /></FormControl><FormMessage /></FormItem>)} />
                                        </div>
                                    </div>
                                    <div className="space-y-4 p-4 rounded-md border">
                                        <FormField control={turnosForm.control} name="turnos.turno2.enabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between"><div className='space-y-0.5'><FormLabel className="text-base">Turno Tarde</FormLabel><FormDescription>Habilitar o deshabilitar este turno.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                                        <div className="grid sm:grid-cols-2 gap-6">
                                            <FormField control={turnosForm.control} name="turnos.turno2.drawTime" render={({ field }) => (<FormItem><FormLabel>Hora del Sorteo</FormLabel><FormControl><Input type="time" {...field} value={field.value ?? ""} disabled={!turnosForm.watch('turnos.turno2.enabled')} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={turnosForm.control} name="turnos.turno2.prize" render={({ field }) => (<FormItem><FormLabel>Premio</FormLabel><FormControl><Input placeholder="Ej: Canasta Básica" {...field} value={field.value ?? ""} disabled={!turnosForm.watch('turnos.turno2.enabled')} /></FormControl><FormMessage /></FormItem>)} />
                                        </div>
                                    </div>
                                    <div className="space-y-4 p-4 rounded-md border">
                                        <FormField control={turnosForm.control} name="turnos.turno3.enabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between"><div className='space-y-0.5'><FormLabel className="text-base">Turno Noche</FormLabel><FormDescription>Habilitar o deshabilitar este turno.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                                        <div className="grid sm:grid-cols-2 gap-6">
                                            <FormField control={turnosForm.control} name="turnos.turno3.drawTime" render={({ field }) => (<FormItem><FormLabel>Hora del Sorteo</FormLabel><FormControl><Input type="time" {...field} value={field.value ?? ""} disabled={!turnosForm.watch('turnos.turno3.enabled')} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={turnosForm.control} name="turnos.turno3.prize" render={({ field }) => (<FormItem><FormLabel>Premio</FormLabel><FormControl><Input placeholder="Ej: Recarga 50 C$" {...field} value={field.value ?? ""} disabled={!turnosForm.watch('turnos.turno3.enabled')} /></FormControl><FormMessage /></FormItem>)} />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end p-4 border-t">
                                    <Button type="submit" disabled={isSubmittingTurnos || !turnosForm.formState.isDirty}>
                                        {isSubmittingTurnos && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Guardar Cambios de Turnos
                                    </Button>
                                </CardFooter>
                            </Card>
                        </form>
                    </Form>
                </div>
            </div>
        </DashboardLayout>
    );
}

    