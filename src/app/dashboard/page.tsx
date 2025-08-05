
'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getTurnoData } from '@/lib/actions';
import { getCurrentTurno } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Ticket, Trophy, Sunrise, Sunset, Moon } from 'lucide-react';
import type { TurnoData } from '@/lib/types';

interface DailyStats {
  turno1: TurnoData & { winner: number | null };
  turno2: TurnoData & { winner: number | null };
  turno3: TurnoData & { winner: number | null };
  totalTicketsSold: number;
}

export default function DashboardHomePage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const fetchStats = async () => {
      if (!user?.businessId) {
        setLoading(false);
        return;
      }
        
      setLoading(true);
      try {
        const { date } = getCurrentTurno();
        const businessId = user.businessId!;

        const [turno1Data, turno2Data, turno3Data] = await Promise.all([
          getTurnoData({ date, turno: 'turno1' }, businessId),
          getTurnoData({ date, turno: 'turno2' }, businessId),
          getTurnoData({ date, turno: 'turno3' }, businessId),
        ]);
        
        const totalTicketsSold = turno1Data.tickets.length + turno2Data.tickets.length + turno3Data.tickets.length;

        setStats({
          turno1: { ...turno1Data, winner: turno1Data.winningNumber || null },
          turno2: { ...turno2Data, winner: turno2Data.winningNumber || null },
          turno3: { ...turno3Data, winner: turno3Data.winningNumber || null },
          totalTicketsSold,
        });
      } catch (error) {
        console.error("Error fetching daily stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [authLoading, user]);

  if (authLoading || (loading && user?.businessId)) {
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
            <div className="flex justify-center items-center h-full p-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Sin Asignación de Negocio</CardTitle>
                        <CardDescription>
                            No estás asignado a ningún negocio todavía.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Por favor, contacta al superusuario para que te asigne a un negocio y puedas empezar a operar.</p>
                    </CardContent>
                 </Card>
            </div>
        </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Turno Mañana</CardTitle>
              <Sunrise className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.turno1.winner ?? '-'}</div>
              <p className="text-xs text-muted-foreground">Número ganador</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Turno Tarde</CardTitle>
              <Sunset className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.turno2.winner ?? '-'}</div>
              <p className="text-xs text-muted-foreground">Número ganador</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Turno Noche</CardTitle>
              <Moon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.turno3.winner ?? '-'}</div>
              <p className="text-xs text-muted-foreground">Número ganador</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas del Día</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{stats?.totalTicketsSold ?? 0}</div>
              <p className="text-xs text-muted-foreground">Tickets vendidos hoy</p>
            </CardContent>
          </Card>
        </div>
         <div className="mt-8 text-center">
            <p className="text-muted-foreground">El sorteo principal se encuentra en la sección "Sorteos".</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
