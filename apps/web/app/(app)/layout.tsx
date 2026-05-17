'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { api, logout, getAccessToken } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Phone,
  Megaphone,
  ShoppingCart,
  Map,
  BarChart3,
  AlertTriangle,
  Settings,
  LogOut,
  Database,
  Menu,
  Bell,
  Truck,
  ListChecks,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  roles?: string[];
  /** show on the mobile bottom tab bar (max 5) */
  bottomTab?: boolean;
}

// Role-aware nav. Each role gets a tailored bottom tab strip plus the full
// drawer when they need to dig deeper.
const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, bottomTab: true },
  { label: 'Softphone', href: '/call', icon: Phone, roles: ['AGENT', 'SALES_MANAGER', 'ADMIN'], bottomTab: true },
  { label: 'Customers', href: '/customers', icon: Users, bottomTab: true },
  { label: 'Route', href: '/route', icon: Truck, roles: ['DELIVERY_OPS', 'ADMIN'], bottomTab: true },
  { label: 'Queue', href: '/campaigns', icon: ListChecks, roles: ['AGENT'], bottomTab: true },
  { label: 'Campaigns', href: '/campaigns', icon: Megaphone, roles: ['SALES_MANAGER', 'ADMIN'], bottomTab: true },
  { label: 'Orders', href: '/orders', icon: ShoppingCart },
  { label: 'Duplicates', href: '/duplicates', icon: AlertTriangle, roles: ['SALES_MANAGER', 'ADMIN'] },
  { label: 'Territory', href: '/territory', icon: Map },
  { label: 'Reports', href: '/reports', icon: BarChart3, bottomTab: true },
  { label: 'Inbox', href: '/inbox', icon: Bell, bottomTab: true },
  { label: 'DMS Sync', href: '/dms', icon: Database, roles: ['SALES_MANAGER', 'ADMIN'] },
  { label: 'Settings', href: '/settings', icon: Settings, roles: ['ADMIN'] },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useAuth();
  const [checking, setChecking] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    api
      .get<{ id: string; email: string; fullName: string; role: string; tenantId: string }>('/auth/me')
      .then((u) => {
        setUser(u);
        setChecking(false);
      })
      .catch(() => router.replace('/login'));
  }, [router, setUser]);

  // close drawer on route change so navigation feels snappy
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const visible = useMemo(
    () => (user ? NAV.filter((n) => !n.roles || n.roles.includes(user.role)) : []),
    [user]
  );

  const bottomTabs = useMemo(() => visible.filter((n) => n.bottomTab).slice(0, 5), [visible]);

  if (checking || !user) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">Loading TeleTrade…</div>
    );
  }

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  function NavList({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <nav className="flex-1 p-2 space-y-1 overflow-auto">
        {visible.map((item) => {
          const Icon = item.icon;
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent',
                active && 'bg-accent font-medium'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 border-r bg-card flex-col">
        <div className="p-4 border-b">
          <div className="text-lg font-semibold">TeleTrade</div>
          <div className="text-xs text-muted-foreground truncate">{user.fullName}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {user.role.replace('_', ' ')}
          </div>
        </div>
        <NavList />
        <div className="p-3 border-t">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between bg-card border-b px-3 h-12 shrink-0">
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <button className="p-2 -ml-2 rounded-md hover:bg-accent" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="p-4 border-b">
              <div className="text-lg font-semibold">TeleTrade</div>
              <div className="text-xs text-muted-foreground truncate">{user.fullName}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {user.role.replace('_', ' ')}
              </div>
            </div>
            <NavList onNavigate={() => setDrawerOpen(false)} />
            <div className="p-3 border-t">
              <Button variant="outline" className="w-full" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        <div className="font-semibold">TeleTrade</div>
        <Link href="/inbox" className="p-2 -mr-2 rounded-md hover:bg-accent" aria-label="Inbox">
          <Bell className="h-5 w-5" />
        </Link>
      </header>

      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <div className="p-4 md:p-6">{children}</div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t flex justify-around items-center h-16">
        {bottomTabs.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 text-[11px] flex-1 h-full',
                active ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
