
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, ClipboardList, CheckCircle, Clock, Gift, User, Award, FileText } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getWinnerHistory, claimPrize } from '@/lib/actions';
import type { Winner } from '@/lib/types';
import { cn } from '@/lib/utils';


const claimSchema = z.object({
  claimerId: z.string().min(3, { message: 'El número de identificación es demasiado corto.' }),
});
type ClaimFormValues = z.infer<typeof claimSchema>;

export default function ReportsPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [winners, setWinners] = useState<Winner[]>([]);
    const [loading, setLoading] = useState(true);
    const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);
    const [selectedWinner, setSelectedWinner] = useState<Winner | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ClaimFormValues>({
        resolver: zodResolver(claimSchema),
        defaultValues: { claimerId: '' },
    });

    const fetchWinners = async () => {
        if (!user || !user.businessId) return;
        setLoading(true);
        try {
            const fetchedWinners = await getWinnerHistory(user.businessId);
            setWinners(fetchedWinners);
        } catch (error) {
            console.error("Failed to fetch winner history:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar el historial de ganadores.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && user) {
            fetchWinners();
        }
    }, [user, authLoading]);

    const handleOpenClaimDialog = (winner: Winner) => {
        setSelectedWinner(winner);
        form.reset();
        setIsClaimDialogOpen(true);
    };
    
    const handleClaimPrize = async (values: ClaimFormValues) => {
        if (!user || !user.businessId || !selectedWinner) return;
        setIsSubmitting(true);
        try {
            const result = await claimPrize(user.businessId, selectedWinner, values.claimerId, user);
            if (result.success) {
                toast({ title: '¡Éxito!', description: 'Premio entregado y registrado correctamente.' });
                setIsClaimDialogOpen(false);
                fetchWinners(); // Refresh the list
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Ocurrió un error inesperado.' });
        } finally {
            setIsSubmitting(false);
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

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Reportes de Sorteos</h2>
                        <p className="text-muted-foreground">
                            Historial completo de ganadores y gestión de entrega de premios.
                        </p>
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Historial de Ganadores</CardTitle>
                        <CardDescription>
                            Aquí se muestran todos los sorteos realizados en tu negocio.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {winners.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg text-center">
                                <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
                                <h3 className="text-xl font-semibold">No hay sorteos registrados</h3>
                                <p className="text-muted-foreground">
                                    Realiza tu primer sorteo para ver los resultados aquí.
                                </p>
                            </div>
                        ) : (
                            <>
                            {/* Desktop Table */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Ganador</TableHead>
                                            <TableHead>Premio</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {winners.map((winner) => (
                                            <TableRow key={winner.drawnAt}>
                                                <TableCell>
                                                    <div className="font-medium">{format(parseISO(winner.date), "d MMM yyyy", { locale: es })}</div>
                                                    <div className="text-xs text-muted-foreground">Turno {winner.turno.replace('turno','')}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-semibold text-primary">{winner.winningNumber}</div>
                                                    <div>{winner.winnerName}</div>
                                                </TableCell>
                                                <TableCell>{winner.prize}</TableCell>
                                                <TableCell>
                                                    <Badge variant={winner.claimed ? 'default' : 'secondary'} className={cn(winner.claimed && 'bg-green-600')}>
                                                        {winner.claimed ? <CheckCircle className="mr-2 h-4 w-4" /> : <Clock className="mr-2 h-4 w-4" />}
                                                        {winner.claimed ? 'Entregado' : 'Pendiente'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {!winner.claimed ? (
                                                        <Button variant="outline" size="sm" onClick={() => handleOpenClaimDialog(winner)}>
                                                            <Award className="mr-2 h-4 w-4" />
                                                            Registrar Entrega
                                                        </Button>
                                                    ) : (
                                                        <div className='text-xs text-muted-foreground text-right'>
                                                            <p>Entregado el {format(parseISO(winner.claimedAt!), "d/MM/yy, h:mm a")}</p>
                                                            <p>ID: {winner.claimerId}</p>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            {/* Mobile Cards */}
                            <div className="grid gap-4 md:hidden">
                                {winners.map((winner) => (
                                <Card key={winner.drawnAt}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-xl">
                                                Turno {winner.turno.replace('turno','')} - {format(parseISO(winner.date), "d MMM", { locale: es })}
                                            </CardTitle>
                                             <Badge variant={winner.claimed ? 'default' : 'secondary'} className={cn('shrink-0', winner.claimed && 'bg-green-600')}>
                                                {winner.claimed ? 'Entregado' : 'Pendiente'}
                                            </Badge>
                                        </div>
                                         <CardDescription>Número Ganador: <span className="font-bold text-primary">{winner.winningNumber}</span></CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <p className="flex items-center gap-2 text-sm"><User size={14} /> {winner.winnerName}</p>
                                            <p className="flex items-center gap-2 text-sm"><Gift size={14} /> {winner.prize}</p>
                                        </div>
                                        {!winner.claimed ? (
                                            <Button className="w-full" onClick={() => handleOpenClaimDialog(winner)}>
                                                <Award className="mr-2 h-4 w-4" />
                                                Registrar Entrega
                                            </Button>
                                        ) : (
                                            <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                                                <p className="flex items-center gap-2"><CheckCircle size={14} /> Entregado el {format(parseISO(winner.claimedAt!), "d/MM/yy, h:mm a")}</p>
                                                <p className="flex items-center gap-2"><FileText size={14} /> Cédula: {winner.claimerId}</p>
                                                <p className="flex items-center gap-2"><User size={14} /> Atendido por: {winner.claimedByUserName}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                                ))}
                            </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isClaimDialogOpen} onOpenChange={setIsClaimDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Entrega de Premio</DialogTitle>
                        <DialogDescription>
                            Confirma la entrega para el ganador <span className="font-bold">{selectedWinner?.winnerName}</span> (Número <span className="font-bold text-primary">{selectedWinner?.winningNumber}</span>). Ingresa el número de identificación de quien retira para el registro.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleClaimPrize)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="claimerId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cédula o Identificación de quien retira</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: 001-123456-0001A" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setIsClaimDialogOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Confirmar Entrega
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
