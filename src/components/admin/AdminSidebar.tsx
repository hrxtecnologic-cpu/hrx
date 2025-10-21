'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileCheck,
  ClipboardList,
  Calendar,
  BarChart3,
  MessageSquare,
  Settings,
  Home,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  {
    title: 'Principal',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/admin', badge: null },
      { icon: Home, label: 'Voltar ao Site', href: '/', badge: null },
    ],
  },
  {
    title: 'Gestão',
    items: [
      { icon: Users, label: 'Profissionais', href: '/admin/profissionais', badge: null },
      { icon: Building2, label: 'Fornecedores', href: '/admin/fornecedores', badge: null },
      { icon: FileCheck, label: 'Documentos', href: '/admin/documentos', badge: 12 },
      { icon: ClipboardList, label: 'Solicitações', href: '/admin/solicitacoes', badge: 5 },
      { icon: Calendar, label: 'Eventos', href: '/admin/eventos', badge: null },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { icon: BarChart3, label: 'Relatórios', href: '/admin/relatorios', badge: null },
      { icon: MessageSquare, label: 'Comunicação', href: '/admin/comunicacao', badge: null },
      { icon: Settings, label: 'Configurações', href: '/admin/configuracoes', badge: null },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Sidebar Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-zinc-900 border-r border-zinc-800 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-zinc-800">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="text-2xl font-bold text-white">HRX</div>
              <span className="text-xs font-semibold text-red-500 bg-red-500/10 px-2 py-1 rounded">
                ADMIN
              </span>
            </Link>
          </div>

          {/* Menu */}
          <nav className="flex-1 px-3 py-4 space-y-6">
            {menuItems.map((section) => (
              <div key={section.title}>
                <h3 className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all',
                          isActive
                            ? 'bg-red-600 text-white'
                            : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-800">
            <div className="text-xs text-zinc-500 text-center">
              <p>HRX Admin Panel</p>
              <p className="mt-1">v1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
