/**
 * =====================================================
 * COMPONENT: Notification Bell
 * =====================================================
 * Sino de notificações com badge de contador
 * Dropdown com lista de notificações
 * =====================================================
 */

'use client';

import { useEffect, useState } from 'react';
import { Bell, X, Check, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import {
  Notification,
  NotificationStats,
  getNotificationIcon,
  formatNotificationTime,
  PRIORITY_COLORS,
} from '@/types/notification';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadNotifications();

    // Polling a cada 30 segundos
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadNotifications() {
    try {
      const response = await fetch('/api/notifications?limit=10&unread_only=false');

      if (response.ok) {
        const result = await response.json();
        setNotifications(result.data?.notifications || []);
        setStats(result.data?.stats || null);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });

      if (response.ok) {
        // Atualizar localmente
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
          )
        );

        // Atualizar stats
        if (stats) {
          setStats({
            ...stats,
            unread_count: Math.max(0, stats.unread_count - 1),
          });
        }
      }
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
      toast.error('Erro ao marcar notificação como lida');
    }
  }

  async function markAllAsRead() {
    try {
      setLoading(true);

      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      if (response.ok) {
        // Atualizar todas localmente
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );

        // Atualizar stats
        if (stats) {
          setStats({
            ...stats,
            unread_count: 0,
          });
        }

        toast.success('Todas as notificações foram marcadas como lidas');
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast.error('Erro ao marcar notificações');
    } finally {
      setLoading(false);
    }
  }

  const unreadCount = stats?.unread_count || 0;
  const hasUnread = unreadCount > 0;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-zinc-800 text-zinc-400 hover:text-white"
        >
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 bg-zinc-900 border-zinc-800 p-0">
        <Card className="bg-transparent border-0 shadow-none">
          <CardHeader className="border-b border-zinc-800 pb-3">
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-red-600" />
                <span className="text-sm">Notificações</span>
                {hasUnread && (
                  <span className="text-xs bg-red-600/20 text-red-500 px-2 py-0.5 rounded-full">
                    {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {hasUnread && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="text-xs text-zinc-400 hover:text-white h-7 px-2"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Marcar todas
                </Button>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0 max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-zinc-800/50 transition-colors ${
                      !notification.is_read ? 'bg-red-950/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.notification_type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-medium text-white">
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <div className="h-2 w-2 bg-red-600 rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>

                        <p className="text-xs text-zinc-400 mb-2 line-clamp-2">
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-600">
                            {formatNotificationTime(notification.created_at)}
                          </span>

                          <div className="flex items-center gap-2">
                            {/* Priority Badge */}
                            {notification.priority !== 'normal' && (
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full border ${
                                  PRIORITY_COLORS[notification.priority]
                                }`}
                              >
                                {notification.priority}
                              </span>
                            )}

                            {/* Actions */}
                            {notification.action_url && (
                              <Link href={notification.action_url}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    markAsRead(notification.id);
                                    setOpen(false);
                                  }}
                                  className="h-6 px-2 text-xs text-red-500 hover:text-red-400 hover:bg-red-950/20"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Ver
                                </Button>
                              </Link>
                            )}

                            {!notification.is_read && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => markAsRead(notification.id)}
                                className="h-6 w-6 p-0 text-zinc-500 hover:text-white"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          {notifications.length > 0 && (
            <div className="border-t border-zinc-800 p-3">
              <Link href="/notifications">
                <Button
                  variant="ghost"
                  className="w-full text-xs text-zinc-400 hover:text-white hover:bg-zinc-800"
                  onClick={() => setOpen(false)}
                >
                  Ver todas as notificações
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
