/**
 * =====================================================
 * PAGE: Centro de Notificações
 * =====================================================
 * Página completa com todas as notificações
 * =====================================================
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Bell,
  Check,
  Filter,
  Trash2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import {
  Notification,
  NotificationStats,
  getNotificationIcon,
  formatNotificationTime,
  PRIORITY_COLORS,
  NOTIFICATION_TYPE_LABELS,
} from '@/types/notification';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  async function loadNotifications() {
    try {
      setLoading(true);

      const unreadOnly = filter === 'unread';
      const response = await fetch(
        `/api/notifications?limit=100&unread_only=${unreadOnly}`
      );

      if (response.ok) {
        const result = await response.json();
        setNotifications(result.data?.notifications || []);
        setStats(result.data?.stats || null);
      } else {
        toast.error('Erro ao carregar notificações');
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      toast.error('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        );

        if (stats) {
          setStats({
            ...stats,
            unread_count: Math.max(0, stats.unread_count - 1),
          });
        }
      }
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
      toast.error('Erro ao marcar notificação');
    }
  }

  async function markAllAsRead() {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );

        if (stats) {
          setStats({ ...stats, unread_count: 0 });
        }

        toast.success('Todas as notificações marcadas como lidas');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao marcar notificações');
    }
  }

  const unreadCount = stats?.unread_count || 0;

  return (
    <div className="min-h-screen bg-zinc-950 p-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Notificações</h1>
            <p className="text-zinc-400">
              {unreadCount > 0
                ? `Você tem ${unreadCount} notificação${unreadCount !== 1 ? 'ões' : ''} não lida${unreadCount !== 1 ? 's' : ''}`
                : 'Você está em dia com suas notificações'}
            </p>
          </div>

          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Check className="h-4 w-4 mr-2" />
                Marcar todas como lidas
              </Button>
            )}

            <Link href="/admin">
              <Button variant="outline" className="border-zinc-700 text-zinc-300">
                Voltar
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500">Total</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {stats?.total_notifications || 0}
                  </p>
                </div>
                <Bell className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500">Não Lidas</p>
                  <p className="text-2xl font-bold text-white mt-1">{unreadCount}</p>
                </div>
                <div className="h-8 w-8 bg-yellow-600/10 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500">Urgentes</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {stats?.urgent_count || 0}
                  </p>
                </div>
                <div className="h-8 w-8 bg-red-600/10 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500">Alta Prioridade</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {stats?.high_count || 0}
                  </p>
                </div>
                <div className="h-8 w-8 bg-orange-600/10 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-zinc-500" />
              <span className="text-sm text-zinc-400 mr-3">Filtrar:</span>
              <Button
                size="sm"
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                className={
                  filter === 'all'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'border-zinc-700 text-zinc-400'
                }
              >
                Todas
              </Button>
              <Button
                size="sm"
                variant={filter === 'unread' ? 'default' : 'outline'}
                onClick={() => setFilter('unread')}
                className={
                  filter === 'unread'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'border-zinc-700 text-zinc-400'
                }
              >
                Não Lidas ({unreadCount})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Notificações */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">
              {filter === 'all' ? 'Todas as Notificações' : 'Notificações Não Lidas'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-zinc-400">Carregando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-400">
                  {filter === 'unread'
                    ? 'Nenhuma notificação não lida'
                    : 'Nenhuma notificação'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`bg-zinc-950 border-zinc-800 ${
                      !notification.is_read ? 'border-l-4 border-l-red-600' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="text-3xl flex-shrink-0">
                          {getNotificationIcon(notification.notification_type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <p className="text-sm font-medium text-white mb-1">
                                {notification.title}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {NOTIFICATION_TYPE_LABELS[notification.notification_type]}
                              </p>
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded-full border ${
                                PRIORITY_COLORS[notification.priority]
                              }`}
                            >
                              {notification.priority}
                            </span>
                          </div>

                          <p className="text-sm text-zinc-300 mb-3">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-zinc-600">
                              {formatNotificationTime(notification.created_at)}
                            </span>

                            <div className="flex items-center gap-2">
                              {notification.action_url && (
                                <Link href={notification.action_url}>
                                  <Button
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    <ExternalLink className="h-3 w-3 mr-2" />
                                    Ver Detalhes
                                  </Button>
                                </Link>
                              )}

                              {!notification.is_read && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markAsRead(notification.id)}
                                  className="border-zinc-700 text-zinc-400"
                                >
                                  <Check className="h-3 w-3 mr-2" />
                                  Marcar como lida
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
