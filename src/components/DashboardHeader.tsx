'use client';

import { UserButton } from '@clerk/nextjs';

interface DashboardHeaderProps {
  userName: string;
  userRole: string;
}

export function DashboardHeader({ userName, userRole }: DashboardHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p className="text-sm text-zinc-400">Olá,</p>
        <p className="font-semibold text-white">{userName}</p>
      </div>
      <UserButton
        appearance={{
          elements: {
            avatarBox: 'h-8 w-8',
          },
        }}
      />
    </div>
  );
}
