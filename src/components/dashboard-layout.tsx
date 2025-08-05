
'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // This effect handles redirection logic.
    // The middleware should prevent unauthenticated access, but this is a fallback.
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);


  const handleSignOut = async () => {
    await signOutUser();
    router.push('/login');
  };

  if (loading || !user) {
      return (
          <div className="flex h-screen items-center justify-center bg-background">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
      )
  }
  
  const menuItems = [
    { href: '/dashboard', label: 'Inicio', icon: <Home />, roles: ['superuser', 'admin', 'seller'] },
    { href: '/dashboard/raffle', label: 'Sorteos', icon: <Ticket />, roles: ['superuser', 'admin', 'seller'] },
    { href: '/dashboard/businesses', label: 'Negocios', icon: <Building />, roles: ['superuser'] },
    { href: '/dashboard/users', label: 'Usuarios', icon: <Users />, roles: ['superuser', 'admin'] }
  ];

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
            {menuItems.filter(item => user && item.roles.includes(user.role)).map(item => (
                 <SidebarMenuItem key={item.href}>
                    <Link href={item.href} passHref>
                        <SidebarMenuButton isActive={pathname === item.href} tooltip={item.label}>
                            {item.icon}
                            {item.label}
                        </SidebarMenuButton>
                    </Link>
                 </SidebarMenuItem>
            ))}
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
        <main className="flex-1 overflow-y-auto bg-slate-50">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
