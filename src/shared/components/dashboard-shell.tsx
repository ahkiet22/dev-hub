'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Activity,
  AppWindow,
  Bot,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sun,
  User,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { logoutAction } from '@/modules/auth/auth.actions';
import type { AuthUser } from '@/modules/auth/auth.types';

const NAV_ITEMS = [
  { href: '/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/backends', label: 'Backends', icon: Activity },
  { href: '/applications', label: 'Applications', icon: AppWindow },
  { href: '/ai/accounts', label: 'AI Accounts', icon: Bot },
  { href: '/settings/profile', label: 'Settings', icon: Settings },
] as const;

export function DashboardShell({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const segments = pathname.split('/').filter(Boolean);

  return (
    <div className="flex min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-[hsl(var(--card))] transition-all duration-200 md:static',
          collapsed ? 'w-16' : 'w-60',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-3">
          <Link href="/overview" className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--primary))] text-xs font-bold text-[hsl(var(--primary-foreground))]">
              DH
            </div>
            {!collapsed && (
              <span className="truncate text-sm font-semibold tracking-tight">
                Dev Hub
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden rounded-md p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] md:inline-flex"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-2" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-[hsl(var(--accent))] text-[hsl(var(--foreground))]'
                    : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-2">
          <div className="flex items-center gap-2.5 rounded-md px-2.5 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--secondary))] text-xs font-medium">
              <User className="h-3.5 w-3.5" />
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">
                  {user.fullName || user.username}
                </p>
                <p className="truncate font-mono text-[11px] text-[hsl(var(--muted-foreground))]">
                  {user.email}
                </p>
              </div>
            )}
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="mt-1 flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
              title={collapsed ? 'Sign out' : undefined}
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && <span>Sign out</span>}
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-[hsl(var(--card))] px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              className="rounded-md p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] md:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
              <span className="text-[hsl(var(--muted-foreground))]">Dev Hub</span>
              {segments.map((seg) => (
                <React.Fragment key={seg}>
                  <span className="text-[hsl(var(--muted-foreground))]">/</span>
                  <span className="font-medium capitalize">{seg}</span>
                </React.Fragment>
              ))}
            </nav>
          </div>

          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-transparent text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
          >
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="hidden h-4 w-4 dark:block" />
          </button>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
