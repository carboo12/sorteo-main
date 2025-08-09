
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getTurnoData, buyTicket, drawWinner, getWinnerHistory } from '@/lib/actions';
import { getCurrentTurno } from '@/lib/utils';
import type { TurnoData, Winner, TurnoInfo } from '@/lib/types';
import { Loader2, Ticket, Trophy, User, Calendar, Clock, Sparkles } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/use-auth';

const buyTicketSchema = z.object({
  name: z.string().optional(),
});

export default function RaffleClient() {
  const { user, loading: authLoading } = useAuth();
  const [turnoInfo, setTurnoInfo] = useState<TurnoInfo | null>(null);
  const [turnoData, setTurnoData] = useState<TurnoData>({ tickets: [] });
  const [winnerHistory, setWinnerHistory] = useState<Winner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof buyTicketSchema>>({
    resolver: zodResolver(buyTicketSchema),
    defaultValues: { name: '' },
  });

  const businessId = user?.businessId;
  const userRole = user?.role;

  const loadData = async () => {
    if (!businessId) return;
    setIsLoading(true);
    try {
      const currentTurno = getCurrentTurno();
      setTurnoInfo(currentTurno);
      const [data, history] = await Promise.all([
        getTurnoData(currentTurno, businessId),
        getWinnerHistory(businessId),
      ]);
      setTurnoData(data);
      setWinnerHistory(history);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los datos de la rifa.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && businessId) {
      loadData();
    }
  }, [authLoading, businessId]);

  useEffect(() => {
    const interval = setInterval(() => {
        const newTurno = getCurrentTurno();
        if (newTurno.key !== turnoInfo?.key) {
            if (!authLoading && businessId) {
                loadData();
            }
        }
    }, 60 * 1000); 
    return () => clearInterval(interval);
  }, [turnoInfo?.key, authLoading, businessId]);

  const soldNumbers = useMemo(() => new Set(turnoData.tickets.map((t) => t.number)), [turnoData]);

  const handleSelectNumber = (number: number) => {
    if (soldNumbers.has(number) || turnoData.winningNumber) return;
    setSelectedNumber(number);
    setIsDialogOpen(true);
    form.reset();
  };

  const handleBuyTicket = async (values: z.infer<typeof buyTicketSchema>) => {
    if (!selectedNumber || !turnoInfo || !businessId) return;
    setIsBuying(true);
    const result = await buyTicket(turnoInfo, selectedNumber, values.name || null, businessId);
    if (result.success) {
      toast({ title: '¡Éxito!', description: result.message });
      setTurnoData((prev) => ({
        ...prev,
        tickets: [...prev.tickets, { number: selectedNumber, name: values.name || 'Anónimo', purchasedAt: new Date().toISOString() }],
      }));
      setIsDialogOpen(false);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsBuying(false);
  };

  const handleDrawWinner = async () => {
    if (!turnoInfo || !businessId) return;
    setIsDrawing(true);
    const result = await drawWinner(turnoInfo, businessId);
    if (result.success && result.winningNumber) {
      toast({
        title: '¡Tenemos un ganador!',
        description: result.message,
      });
      loadData(); 
    } else {
      toast({ variant: 'destructive', title: 'Sorteo Fallido', description: result.message });
    }
    setIsDrawing(false);
  };
  
  const canDraw = userRole === 'admin' || userRole === 'superuser';


  if (authLoading || (isLoading && businessId)) {
    return (
        <div className="flex justify-center items-center h-96">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  if (!businessId && !authLoading) {
    return (
        <div className="flex justify-center items-center h-96">
            <p className="text-destructive text-lg">No estás asociado a ningún negocio. Contacta al superusuario.</p>
        </div>
    );
  }


  return (
    <div className="container mx-auto p-4 md:p-8 font-body">
      <header className="text-center mb-8">
        <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary tracking-tighter">Sorteo Xpress</h1>
        <p className="text-muted-foreground text-lg mt-2">¡Tu oportunidad de ganar está a un número de distancia!</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="shadow-lg border-2 border-primary/20 bg-card">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                     <CardTitle className="flex items-center gap-3">
                        <Sparkles className="text-primary" />
                        <span>Selecciona tu número</span>
                    </CardTitle>
                    {turnoInfo && (
                        <div className="text-sm font-medium text-muted-foreground flex items-center gap-4">
                            <div className='flex items-center gap-1.5'><Calendar size={16} /> {turnoInfo.date}</div>
                            <div className='flex items-center gap-1.5'><Clock size={16} /> Turno: {turnoInfo.turno.replace('turno', '')}</div>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-10 gap-2">
                  {Array.from({ length: 100 }, (_, i) => i + 1).map((number) => {
                    const isSold = soldNumbers.has(number);
                    const isWinner = number === turnoData.winningNumber;
                    return (
                      <Button
                        key={number}
                        variant={isSold ? 'secondary' : 'outline'}
                        className={`aspect-square h-auto w-auto text-lg font-bold transition-all duration-300 transform hover:scale-110
                          ${isWinner ? 'bg-primary text-primary-foreground animate-pulse-glow shadow-lg' : ''}
                          ${isSold && !isWinner ? 'bg-muted text-muted-foreground line-through' : ''}
                          ${turnoData.winningNumber ? 'cursor-not-allowed' : ''}
                        `}
                        onClick={() => handleSelectNumber(number)}
                        disabled={isSold || !!turnoData.winningNumber}
                        aria-label={isSold ? `Número ${number} vendido` : `Comprar número ${number}`}
                      >
                        {number}
                      </Button>
                    );
                  })}
                </div>
            </CardContent>
             {canDraw && (
                <CardFooter className="pt-6 justify-center">
                    <Button
                        size="lg"
                        className="font-bold text-xl px-12 py-8 shadow-lg transform hover:scale-105"
                        onClick={handleDrawWinner}
                        disabled={isDrawing || !!turnoData.winningNumber || turnoData.tickets.length === 0}
                    >
                        {isDrawing ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Trophy className="mr-2 h-6 w-6" />}
                        {!!turnoData.winningNumber ? 'Ganador Seleccionado' : '¡Realizar Sorteo!'}
                    </Button>
                </CardFooter>
            )}
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-8">
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Trophy className="text-primary"/> Ganadores Anteriores</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="max-h-96 overflow-y-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Ganador</TableHead>
                            <TableHead>Fecha</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {winnerHistory.length > 0 ? (
                            winnerHistory.map((winner, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-bold text-primary">{winner.winningNumber}</TableCell>
                                <TableCell>{winner.winnerName}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{winner.drawnAt}</TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                                No hay ganadores todavía.
                            </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comprar Número <span className="text-primary font-black">{selectedNumber}</span></DialogTitle>
            <DialogDescription>
              Este número es tuyo por este turno. Ingresa tu nombre (opcional) para registrar la compra.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleBuyTicket)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre (Opcional)</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Tu nombre aquí..." {...field} className="pl-9" />
                        </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isBuying}>
                  {isBuying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ticket className="mr-2 h-4 w-4" />}
                  Comprar Número
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
