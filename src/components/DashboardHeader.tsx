'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface DashboardHeaderProps {
  userName?: string;
  userRole?: string;
  title?: string;
  subtitle?: string;
  showNotifications?: boolean;
  onMenuClick?: () => void;
}

export function DashboardHeader({
  userName,
  userRole,
  title,
  subtitle,
  showNotifications = true,
  onMenuClick,
}: DashboardHeaderProps) {
  const { user } = useUser();
  const displayName = userName || user?.firstName || user?.fullName || 'Usuário';

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur px-6">
      {/* Mobile menu button (se fornecido) */}
      {onMenuClick && (
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-zinc-400 hover:text-white"
          onClick={onMenuClick}
        >
          <Menu className="h-6 w-6" />
        </Button>
      )}

      {/* Logo / Home (mobile) */}
      <Link href="/" className="flex items-center gap-2 lg:hidden">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">HRX</span>
        </div>
      </Link>

      {/* Title / Welcome */}
      <div className="flex-1">
        {title ? (
          <div>
            <h1 className="text-lg font-semibold text-white">{title}</h1>
            {subtitle && <p className="text-sm text-zinc-400">{subtitle}</p>}
          </div>
        ) : (
          <div>
            <h1 className="text-lg font-semibold text-white">
              Bem-vindo, {displayName}
            </h1>
            {userRole && <p className="text-sm text-zinc-400">{userRole}</p>}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Notificações */}
        {showNotifications && (
          <Button
            variant="ghost"
            size="icon"
            className="relative text-zinc-400 hover:text-white"
            title="Notificações"
          >
            <Bell className="h-5 w-5" />
            {/* Badge de notificação (pode ser dinâmico depois) */}
            {/* <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" /> */}
          </Button>
        )}

        {/* User Avatar com SignOut */}
        <UserButton
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: '#ef4444',
              colorText: '#ffffff',
              colorTextOnPrimaryBackground: '#ffffff',
              colorTextSecondary: '#ffffff',
            },
            elements: {
              avatarBox: 'h-9 w-9 border-2 border-red-500',
            },
          }}
          afterSignOutUrl="/"
        />
      </div>
    </header>
  );
}
