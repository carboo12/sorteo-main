
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Home, Ticket, Users, LogOut, Building } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { signOutUser } from '@/lib/auth-client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOutUser();
    router.push('/login');
  };

  if (loading) {
      return (
          <div className="flex h-screen items-center justify-center">
              <div className="text-xl">Cargando...</div>
          </div>
      )
  }

  if (!user) {
    // This should ideally not be reached if middleware is set up, but as a fallback
    router.replace('/login');
    return null;
  }
  
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-primary tracking-tighter">Sorteo Xpress</h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton href="/dashboard" isActive={true} tooltip="Sorteos">
                <Ticket />
                Sorteos
              </SidebarMenuButton>
            </SidebarMenuItem>
            {user.role === 'superuser' && (
                 <SidebarMenuItem>
                    <SidebarMenuButton href="/dashboard/businesses" tooltip="Negocios">
                        <Building/>
                        Negocios
                    </SidebarMenuButton>
                 </SidebarMenuItem>
            )}
             <SidebarMenuItem>
                <SidebarMenuButton href="/dashboard/users" tooltip="Usuarios">
                    <Users />
                    Usuarios
                </SidebarMenuButton>
             </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleSignOut}>
            <LogOut />
            <span>Cerrar Sesión</span>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 items-center justify-between border-b bg-background px-4">
            <SidebarTrigger />
            <div className='font-medium text-sm text-muted-foreground'>
                {user.email} ({user.role})
            </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
