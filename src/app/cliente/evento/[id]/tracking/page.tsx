'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DeliveryTrackingMap } from '@/components/delivery/DeliveryTrackingMap';
import { Package, Clock, MapPin, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Delivery {
  id: string;
  status: string;
  equipment_items: Array<{
    name: string;
    quantity: number;
    category: string;
  }>;
  current_latitude: number | null;
  current_longitude: number | null;
  destination_latitude: number;
  destination_longitude: number;
  scheduled_delivery_time: string;
  actual_delivery_time: string | null;
  supplier: {
    company_name: string;
    phone: string;
  };
}

export default function EventTrackingPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Polling para atualizar em tempo real
  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const response = await fetch(`/api/deliveries?eventId=${eventId}`);
        if (!response.ok) throw new Error('Erro ao carregar entregas');

        const data = await response.json();
        setDeliveries(data.deliveries || []);
        setError(null);
      } catch (err: unknown) {
        console.error('Erro ao carregar entregas:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Carregar inicialmente
    fetchDeliveries();

    // Polling a cada 10 segundos para entregas ativas
    const interval = setInterval(fetchDeliveries, 10000);

    return () => clearInterval(interval);
  }, [eventId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-500 bg-green-500/10';
      case 'in_transit':
        return 'text-blue-500 bg-blue-500/10';
      case 'preparing':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'cancelled':
        return 'text-red-500 bg-red-500/10';
      default:
        return 'text-zinc-500 bg-zinc-500/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return CheckCircle;
      case 'in_transit':
        return MapPin;
      case 'preparing':
        return Clock;
      case 'cancelled':
        return XCircle;
      default:
        return Package;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'preparing':
        return 'Preparando';
      case 'in_transit':
        return 'Em Trânsito';
      case 'delivered':
        return 'Entregue';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-8 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  // Separar entregas por status
  const activeDeliveries = deliveries.filter(d =>
    ['preparing', 'in_transit'].includes(d.status)
  );
  const deliveredDeliveries = deliveries.filter(d => d.status === 'delivered');
  const pendingDeliveries = deliveries.filter(d => d.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Rastreamento de Entregas
        </h1>
        <p className="text-zinc-400">
          Acompanhe suas entregas de equipamentos em tempo real
        </p>
      </div>

      {/* Mapa com entregas ativas */}
      {activeDeliveries.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            Entregas em Andamento
          </h2>
          <DeliveryTrackingMap deliveries={activeDeliveries} />
        </div>
      )}

      {/* Lista de entregas ativas */}
      {activeDeliveries.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Status das Entregas
          </h2>
          <div className="space-y-4">
            {activeDeliveries.map((delivery) => {
              const StatusIcon = getStatusIcon(delivery.status);
              return (
                <div
                  key={delivery.id}
                  className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getStatusColor(delivery.status)}`}>
                        <StatusIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {delivery.supplier.company_name}
                        </h3>
                        <p className="text-sm text-zinc-400">
                          {getStatusLabel(delivery.status)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-zinc-400">Previsão</p>
                      <p className="text-white font-medium">
                        {new Date(delivery.scheduled_delivery_time).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {/* Equipamentos */}
                  <div className="mb-3">
                    <p className="text-xs text-zinc-500 mb-2">Equipamentos:</p>
                    <div className="flex flex-wrap gap-2">
                      {delivery.equipment_items.map((item, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-zinc-700/50 px-2 py-1 rounded text-zinc-300"
                        >
                          {item.quantity}x {item.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Fornecedor */}
                  <div className="text-sm text-zinc-400">
                    Contato: {delivery.supplier.phone}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Entregas pendentes */}
      {pendingDeliveries.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            Entregas Pendentes
          </h2>
          <div className="space-y-3">
            {pendingDeliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/50"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">{delivery.supplier.company_name}</p>
                    <p className="text-sm text-zinc-400">
                      {delivery.equipment_items.length} item(s)
                    </p>
                  </div>
                  <p className="text-sm text-zinc-400">
                    {new Date(delivery.scheduled_delivery_time).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entregas concluídas */}
      {deliveredDeliveries.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Entregas Concluídas
          </h2>
          <div className="space-y-3">
            {deliveredDeliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/50"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">{delivery.supplier.company_name}</p>
                    <p className="text-sm text-zinc-400">
                      {delivery.equipment_items.length} item(s)
                    </p>
                  </div>
                  <p className="text-sm text-green-400">
                    Entregue em {new Date(delivery.actual_delivery_time!).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mensagem quando não há entregas */}
      {deliveries.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <Package className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
          <p className="text-zinc-400">Nenhuma entrega encontrada para este evento</p>
        </div>
      )}
    </div>
  );
}
