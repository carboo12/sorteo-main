
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { createBusiness, updateBusiness } from "@/lib/actions";
import { useRouter } from "next/navigation";
import type { Business, Location, AppUser } from "@/lib/types";

const formSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  phone: z.string().min(8, { message: "El número de teléfono no es válido." }),
  ownerEmail: z.string().email({ message: "Por favor, introduce un correo electrónico válido." }),
  licenseExpiresAt: z.date({ required_error: "La fecha de expiración es obligatoria."}),
  address: z.string().min(5, { message: "La dirección es muy corta."}),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

interface BusinessFormProps {
    initialData?: Omit<Business, 'id'> & { id: string } | null;
    creator: AppUser;
}

export default function BusinessForm({ initialData, creator }: BusinessFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const isEditMode = !!initialData;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: isEditMode && initialData ? {
            ...initialData,
            licenseExpiresAt: new Date(initialData.licenseExpiresAt),
        } : {
            name: "",
            phone: "",
            ownerEmail: "",
            address: "",
        },
    });

    useEffect(() => {
        if (isEditMode && initialData) {
            form.reset({
                ...initialData,
                licenseExpiresAt: new Date(initialData.licenseExpiresAt),
            });
        }
    }, [initialData, isEditMode, form]);

    const handleGetLocation = () => {
        setIsLocating(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    form.setValue('location', { lat: latitude, lng: longitude });
                    toast({ title: "Ubicación obtenida", description: "Se ha guardado tu ubicación actual."});
                    setIsLocating(false);
                },
                (error) => {
                    toast({ variant: "destructive", title: "Error de ubicación", description: error.message });
                    setIsLocating(false);
                }
            );
        } else {
            toast({ variant: "destructive", title: "Error", description: "La geolocalización no es compatible con este navegador."});
            setIsLocating(false);
        }
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            const businessData = {
                ...values,
                licenseExpiresAt: values.licenseExpiresAt.toISOString(),
            };

            const result = isEditMode && initialData?.id
                ? await updateBusiness(initialData.id, businessData, creator)
                : await createBusiness(businessData, creator);

            if (result.success) {
                toast({ title: "¡Éxito!", description: result.message });
                router.push("/dashboard/businesses");
                router.refresh();
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
             toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{isEditMode ? 'Editar Detalles del Negocio' : 'Detalles del Negocio'}</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                         <div className="grid md:grid-cols-2 gap-8">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Nombre del Negocio</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Sorteos El Trébol" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Número de Teléfono</FormLabel>
                                    <FormControl>
                                        <Input placeholder="+1 (555) 123-4567" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="ownerEmail"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Correo del Dueño</FormLabel>
                                    <FormControl>
                                        <Input placeholder="dueño@ejemplo.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="licenseExpiresAt"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                    <FormLabel>Fecha de Expiración de Licencia</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-[240px] pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                            >
                                            {field.value ? (
                                                format(field.value, "PPP", { locale: es })
                                            ) : (
                                                <span>Elige una fecha</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => date < new Date() && !isEditMode}
                                            initialFocus
                                        />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Dirección</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Calle Falsa 123, Ciudad" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormItem>
                                <FormLabel>Ubicación (Opcional)</FormLabel>
                                <div className="flex items-center gap-4">
                                     <Button type="button" variant="outline" onClick={handleGetLocation} disabled={isLocating}>
                                        {isLocating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <MapPin className="mr-2 h-4 w-4" />}
                                        Obtener Ubicación
                                    </Button>
                                    {form.watch('location') && (
                                        <span className="text-sm text-green-600">¡Ubicación guardada!</span>
                                    )}
                                </div>
                                <FormDescription>
                                    Haz clic para capturar la ubicación actual del dispositivo.
                                </FormDescription>
                            </FormItem>
                        </div>

                        <div className="flex justify-end gap-2">
                             <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
                             <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                {isEditMode ? 'Guardar Cambios' : 'Crear Negocio'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
