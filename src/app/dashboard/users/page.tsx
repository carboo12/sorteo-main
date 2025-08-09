
'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, User, Loader2, MoreHorizontal, Pencil, Ban, Edit } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getUsers, getBusinesses, toggleUserStatus } from '@/lib/actions';
import type { AppUser, Business } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserForm } from '@/components/user-form';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [fetchedUsers, fetchedBusinesses] = await Promise.all([
          getUsers(user),
          getBusinesses(user.role === 'superuser' ? null : user.businessId)
      ]);
      setUsers(fetchedUsers);
      setBusinesses(fetchedBusinesses);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [user, authLoading]);

  const onUserSaved = () => {
    fetchData(); 
    setIsDialogOpen(false); 
  }

  const handleToggleStatus = async (uid: string, currentStatus: boolean | undefined) => {
    const newStatus = !currentStatus;
    const result = await toggleUserStatus(uid, newStatus);
    if (result.success) {
      toast({ title: 'Éxito', description: result.message });
      fetchData(); // Refresh data
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };

  const canEdit = (userToEdit: AppUser): boolean => {
      if (!user) return false;
      if (user.role === 'superuser') return true;
      if (user.role === 'admin') {
          return userToEdit.role === 'seller' && userToEdit.businessId === user.businessId;
      }
      return false;
  }

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
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h2>
            <p className="text-muted-foreground">
              Aquí puedes crear y administrar los usuarios de tu negocio.
            </p>
          </div>
          <div className="flex items-center space-x-2">
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Crear Usuario
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                    </DialogHeader>
                    {user && <UserForm businesses={businesses} onUserSaved={onUserSaved} creator={user} />}
                </DialogContent>
            </Dialog>
          </div>
        </div>
       
        {users.length === 0 ? (
             <Card>
                <CardContent className="p-8">
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                      <User className="h-16 w-16 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold">No hay usuarios</h3>
                      <p className="text-muted-foreground">
                          Crea un nuevo usuario para empezar.
                      </p>
                  </div>
                </CardContent>
             </Card>
        ) : (
            <>
              {/* Desktop View: Table */}
              <Card className="hidden md:block">
                <CardHeader>
                  <CardTitle>Usuarios</CardTitle>
                   <CardDescription>
                      Lista de usuarios registrados en el sistema.
                   </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Nombre</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Rol</TableHead>
                              <TableHead>Negocio</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead className='text-right'>Acciones</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {users.filter(u => u.uid !== user?.uid).map((u) => (
                              <TableRow key={u.uid} className={cn(u.disabled && "text-muted-foreground opacity-50")}>
                                  <TableCell>{u.name}</TableCell>
                                  <TableCell>{u.email}</TableCell>
                                  <TableCell className="capitalize">{u.role}</TableCell>
                                  <TableCell>{businesses.find(b => b.id === u.businessId)?.name || 'N/A'}</TableCell>
                                  <TableCell>
                                    <Badge variant={u.disabled ? 'destructive' : 'default'}>
                                      {u.disabled ? 'Inhabilitado' : 'Activo'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className='text-right'>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Abrir menú</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem 
                                              onClick={() => router.push(`/dashboard/users/${u.uid}`)}
                                              disabled={!canEdit(u)}
                                            >
                                                <Pencil className="mr-2 h-4 w-4" />
                                                <span>Editar</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleToggleStatus(u.uid, u.disabled)}>
                                                <Ban className="mr-2 h-4 w-4" />
                                                <span>{u.disabled ? 'Habilitar' : 'Inhabilitar'}</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Mobile View: Cards */}
              <div className="grid gap-4 md:hidden">
                {users.filter(u => u.uid !== user?.uid).map((u) => (
                  <Card key={u.uid} className={cn(u.disabled && "bg-muted/50 opacity-70")}>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-start">
                        <span>{u.name}</span>
                         <Badge variant={u.disabled ? 'destructive' : 'default'} className="mt-1">
                            {u.disabled ? 'Inhabilitado' : 'Activo'}
                         </Badge>
                      </CardTitle>
                      <CardDescription>{u.email}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm">
                          <p className="font-medium text-muted-foreground">Rol</p>
                          <p className="capitalize">{u.role}</p>
                      </div>
                      <div className="text-sm">
                          <p className="font-medium text-muted-foreground">Negocio</p>
                          <p>{businesses.find(b => b.id === u.businessId)?.name || 'N/A'}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          className="w-full" 
                          variant="outline" 
                          size="sm"
                          disabled={!canEdit(u)}
                          onClick={() => router.push(`/dashboard/users/${u.uid}`)}
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                        </Button>
                         <Button 
                          className="w-full" 
                          variant={u.disabled ? "secondary" : "destructive"}
                          size="sm"
                          onClick={() => handleToggleStatus(u.uid, u.disabled)}
                        >
                            <Ban className="mr-2 h-4 w-4" />
                            {u.disabled ? 'Habilitar' : 'Inhabilitar'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
        )}
      </div>
    </DashboardLayout>
  );
}
