'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/NotificationBell';

interface AdminHeaderProps {
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}

export function AdminHeader({ setMobileMenuOpen }: AdminHeaderProps) {
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden text-zinc-400 hover:text-white"
        onClick={() => setMobileMenuOpen?.(true)}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Breadcrumbs / Title - pode ser adicionado depois */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-white">
          Bem-vindo, {user?.firstName || 'Admin'}
        </h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Notificações */}
        <NotificationBell />

        {/* User Avatar */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'h-8 w-8',
            },
          }}
        />
      </div>
    </header>
  );
}
