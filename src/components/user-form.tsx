
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { createUser, updateUser } from "@/lib/actions";
import type { Business, AppUser } from "@/lib/types";
import { useRouter } from "next/navigation";


const formSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto."),
  email: z.string().email("El correo no es válido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres.").optional().or(z.literal('')),
  role: z.enum(["admin", "seller"]),
  businessId: z.string().nullable(),
});

interface UserFormProps {
    businesses: Business[];
    onUserSaved: () => void;
    creator: AppUser;
    initialData?: AppUser | null;
}

export function UserForm({ businesses, onUserSaved, creator, initialData }: UserFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    
    const isEditMode = !!initialData;
    const isSuperuser = creator.role === 'superuser';
    const isAdminEditing = creator.role === 'admin';

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            role: "seller",
            businessId: isSuperuser ? null : creator.businessId,
        },
    });
    
    useEffect(() => {
        if (isEditMode && initialData) {
            form.reset({
                name: initialData.name,
                email: initialData.email || '',
                password: '',
                role: initialData.role,
                businessId: initialData.businessId,
            });
        }
    }, [initialData, isEditMode, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!creator) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo identificar al creador del usuario." });
            return;
        }

        setIsSubmitting(true);
        try {
            let result;
            if (isEditMode && initialData) {
                 const updateData = {
                    ...values,
                    // Don't send an empty password to the update function
                    password: values.password ? values.password : undefined,
                 };
                result = await updateUser(initialData.uid, updateData, creator);
            } else {
                 if (!values.password) {
                    form.setError("password", { message: "La contraseña es obligatoria al crear un usuario." });
                    setIsSubmitting(false);
                    return;
                }
                const createData = {
                    ...values,
                    password: values.password,
                };
                result = await createUser(createData, creator);
            }
            

            if (result.success) {
                toast({ title: "¡Éxito!", description: result.message });
                onUserSaved();
                if (isEditMode) {
                    router.push('/dashboard/users');
                    router.refresh();
                }
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
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej: Juan Pérez" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Correo Electrónico</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="usuario@ejemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Contraseña</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder={isEditMode ? "Dejar en blanco para no cambiar" : "••••••••"} {...field} />
                        </FormControl>
                        {isEditMode && <FormDescription>Deja este campo en blanco si no deseas cambiar la contraseña.</FormDescription>}
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Rol</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isAdminEditing}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un rol" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                    <SelectItem value="seller">Vendedor</SelectItem>
                                </SelectContent>
                            </Select>
                             {isAdminEditing && <FormDescription>Los administradores no pueden cambiar roles.</FormDescription>}
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="businessId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Negocio</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={!isSuperuser}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Asignar a un negocio" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {isSuperuser && businesses.map(b => (
                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                    ))}
                                    {!isSuperuser && businesses.find(b => b.id === creator.businessId) &&
                                        <SelectItem key={creator.businessId!} value={creator.businessId!}>
                                            {businesses.find(b => b.id === creator.businessId)?.name}
                                        </SelectItem>
                                    }
                                </SelectContent>
                            </Select>
                            {!isSuperuser && <FormDescription>Asignado al negocio actual.</FormDescription>}
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex justify-end pt-4 gap-2">
                     <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
                     <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        {isEditMode ? 'Guardar Cambios' : 'Crear Usuario'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
