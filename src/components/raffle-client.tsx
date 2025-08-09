
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
import { getTurnoData, buyTicket, drawWinner, getWinnerHistory, getBusinessById } from '@/lib/actions';
import { getCurrentTurno, cn } from '@/lib/utils';
import type { TurnoData, Winner, TurnoInfo, Ticket, Business } from '@/lib/types';
import { Loader2, Ticket as TicketIcon, Trophy, User, Calendar, Clock, Sparkles, Gift, Printer } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/use-auth';
import TicketReceipt from '@/components/ticket-receipt';

const buyTicketSchema = z.object({
  name: z.string().optional(),
});

export default function RaffleClient() {
  const { user, loading: authLoading } = useAuth();
  const [turnoInfo, setTurnoInfo] = useState<TurnoInfo | null>(null);
  const [turnoData, setTurnoData] = useState<TurnoData>({ tickets: [] });
  const [winnerHistory, setWinnerHistory] = useState<Winner[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [highlightedNumber, setHighlightedNumber] = useState<number | null>(null);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [lastSoldTicket, setLastSoldTicket] = useState<Ticket | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const { toast } = useToast();
  
  const receiptRef = useRef<HTMLDivElement>(null);


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
      const [data, history, businessData] = await Promise.all([
        getTurnoData(currentTurno, businessId),
        getWinnerHistory(businessId),
        getBusinessById(businessId),
      ]);
      setTurnoData(data);
      setWinnerHistory(history);
      setBusiness(businessData);
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
    setIsPurchaseDialogOpen(true);
    form.reset();
  };

  const handleBuyTicket = async (values: z.infer<typeof buyTicketSchema>) => {
    if (!selectedNumber || !turnoInfo || !businessId || !user) return;
    setIsBuying(true);
    
    const newTicket: Ticket = { 
        number: selectedNumber, 
        name: values.name || 'Anónimo', 
        purchasedAt: new Date().toISOString() 
    };

    const result = await buyTicket(turnoInfo, newTicket, businessId, user);

    if (result.success) {
      toast({ title: '¡Éxito!', description: result.message });
      setTurnoData((prev) => ({
        ...prev,
        tickets: [...prev.tickets, newTicket],
      }));
      setLastSoldTicket(newTicket);
      setIsPurchaseDialogOpen(false);
      setIsReceiptDialogOpen(true);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsBuying(false);
  };
  
  const handlePrint = () => {
    const printContents = receiptRef.current?.innerHTML;
    const originalContents = document.body.innerHTML;

    if (printContents) {
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      // We need to reload to re-attach React event listeners
      window.location.reload(); 
    }
  };
  
  const runTumbleEffect = async () => {
    setIsSpinning(true);
    const spinDuration = 3000; // 3 seconds
    const intervalTime = 100; // update every 100ms
    let spinInterval: NodeJS.Timeout;

    return new Promise<void>((resolve) => {
      spinInterval = setInterval(() => {
        const randomNumber = Math.floor(Math.random() * 100) + 1;
        setHighlightedNumber(randomNumber);
      }, intervalTime);

      setTimeout(() => {
        clearInterval(spinInterval);
        setHighlightedNumber(null);
        setIsSpinning(false);
        resolve();
      }, spinDuration);
    });
  };

  const handleDrawWinner = async () => {
    if (!turnoInfo || !businessId || !user) return;
    setIsDrawing(true);
    
    await runTumbleEffect();

    const result = await drawWinner(turnoInfo, businessId, user);
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
                     <CardTitle className="flex items-center gap-3 text-2xl">
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
                    const isHighlighted = number === highlightedNumber;
                    return (
                      <Button
                        key={number}
                        variant={isSold ? 'secondary' : 'outline'}
                        className={cn(`aspect-square h-auto w-auto text-lg font-bold transition-all duration-100 transform hover:scale-110`,
                          isWinner && 'bg-accent text-accent-foreground ring-4 ring-accent-foreground ring-offset-2 animate-pulse-glow shadow-lg',
                          isHighlighted && !isWinner && 'bg-primary/50 text-primary-foreground scale-110',
                          isSold && !isWinner && !isHighlighted && 'bg-muted text-muted-foreground line-through',
                          turnoData.winningNumber || isDrawing ? 'cursor-not-allowed' : ''
                        )}
                        onClick={() => handleSelectNumber(number)}
                        disabled={isSold || !!turnoData.winningNumber || isDrawing}
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
                        {isDrawing || isSpinning ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Trophy className="mr-2 h-6 w-6" />}
                        {!!turnoData.winningNumber ? 'Ganador Seleccionado' : isSpinning ? 'Sorteando...' : '¡Realizar Sorteo!'}
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
                            <TableHead>Premio</TableHead>
                            <TableHead>Fecha</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {winnerHistory.length > 0 ? (
                            winnerHistory.map((winner, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-bold text-primary">{winner.winningNumber}</TableCell>
                                <TableCell>{winner.winnerName}</TableCell>
                                <TableCell className="flex items-center gap-2"><Gift size={14} />{winner.prize}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{winner.drawnAt}</TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
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

      {/* Purchase Dialog */}
      <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
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
                <Button type="button" variant="ghost" onClick={() => setIsPurchaseDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isBuying}>
                  {isBuying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TicketIcon className="mr-2 h-4 w-4" />}
                  Comprar Número
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Receipt Dialog */}
       <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compra Exitosa</DialogTitle>
             <DialogDescription>
                El número ha sido registrado. Puedes imprimir un recibo.
             </DialogDescription>
          </DialogHeader>
          
          <div className="my-4">
             {business && turnoInfo && lastSoldTicket && (
                <TicketReceipt 
                    ref={receiptRef}
                    businessName={business.name}
                    turnoInfo={turnoInfo}
                    ticket={lastSoldTicket}
                />
             )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsReceiptDialogOpen(false)}>Cerrar</Button>
            <Button type="button" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
