'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { api, logout, getAccessToken } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  roles?: string[];
}

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Softphone', href: '/call', icon: Phone, roles: ['AGENT', 'SALES_MANAGER', 'ADMIN'] },
  { label: 'Customers', href: '/customers', icon: Users },
  { label: 'Campaigns', href: '/campaigns', icon: Megaphone, roles: ['SALES_MANAGER', 'ADMIN', 'AGENT'] },
  { label: 'Orders', href: '/orders', icon: ShoppingCart },
  { label: 'Duplicates', href: '/duplicates', icon: AlertTriangle, roles: ['SALES_MANAGER', 'ADMIN'] },
  { label: 'Territory', href: '/territory', icon: Map },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'DMS Sync', href: '/dms', icon: Database, roles: ['SALES_MANAGER', 'ADMIN'] },
  { label: 'Settings', href: '/settings', icon: Settings, roles: ['ADMIN'] },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useAuth();
  const [checking, setChecking] = useState(true);

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

  if (checking || !user) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">Loading TeleTrade…</div>
    );
  }

  const visible = NAV.filter((n) => !n.roles || n.roles.includes(user.role));

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <div className="flex h-screen bg-muted/30">
      <aside className="w-60 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <div className="text-lg font-semibold">TeleTrade</div>
          <div className="text-xs text-muted-foreground truncate">{user.fullName}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{user.role.replace('_', ' ')}</div>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-auto">
          {visible.map((item) => {
            const Icon = item.icon;
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
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
        <div className="p-3 border-t">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
