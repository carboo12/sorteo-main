
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from "@/components/dashboard-layout";
import { UserForm } from "@/components/user-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getUserById, getBusinesses } from '@/lib/actions';
import type { AppUser, Business } from '@/lib/types';

export default function EditUserPage() {
    const { user: editor, loading: authLoading } = useAuth();
    const params = useParams();
    const userId = params.id as string;
    
    const [userToEdit, setUserToEdit] = useState<AppUser | null>(null);
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading || !editor) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [fetchedUser, fetchedBusinesses] = await Promise.all([
                    getUserById(userId),
                    getBusinesses(editor.role === 'superuser' ? null : editor.businessId),
                ]);

                if (!fetchedUser) {
                    setError("El usuario no fue encontrado.");
                    return;
                }
                
                // Permission Check
                if (editor.role === 'admin' && (fetchedUser.role !== 'seller' || fetchedUser.businessId !== editor.businessId)) {
                    setError("No tienes permiso para editar este usuario.");
                    return;
                }

                setUserToEdit(fetchedUser);
                setBusinesses(fetchedBusinesses);
            } catch (err) {
                setError("Ocurrió un error al cargar los datos.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId, authLoading, editor]);

    const onUserSaved = () => {
        // Handled by the form's own navigation
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
    
    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Editar Usuario</h2>
                        <p className="text-muted-foreground">
                            Modifica los detalles del usuario y guarda los cambios.
                        </p>
                    </div>
                </div>
                 <Card>
                    <CardHeader>
                        <CardTitle>Detalles del Usuario</CardTitle>
                    </CardHeader>
                    <CardContent>
                       {error ? (
                            <p className="text-destructive">{error}</p>
                       ) : userToEdit && editor ? (
                            <UserForm 
                                businesses={businesses}
                                onUserSaved={onUserSaved}
                                creator={editor}
                                initialData={userToEdit}
                            />
                       ) : null}
                    </CardContent>
                 </Card>
            </div>
        </DashboardLayout>
    );
}
