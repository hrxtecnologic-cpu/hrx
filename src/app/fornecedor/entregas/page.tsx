'use client';

import { useEffect, useState } from 'react';
import { Package, MapPin, Clock, CheckCircle, Navigation, Loader2 } from 'lucide-react';

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
  destination_address: string;
  destination_latitude: number;
  destination_longitude: number;
  scheduled_delivery_time: string;
  actual_delivery_time: string | null;
  event_project: {
    event_name: string;
    venue_address: string;
    venue_city: string;
    venue_state: string;
  };
}

export default function SupplierDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [trackingLocation, setTrackingLocation] = useState(false);
  const [locationWatchId, setLocationWatchId] = useState<number | null>(null);

  useEffect(() => {
    fetchDeliveries();

    // Polling a cada 30 segundos
    const interval = setInterval(fetchDeliveries, 30000);

    return () => {
      clearInterval(interval);
      if (locationWatchId !== null) {
        navigator.geolocation.clearWatch(locationWatchId);
      }
    };
  }, [locationWatchId]);

  const fetchDeliveries = async () => {
    try {
      const response = await fetch('/api/deliveries');
      if (!response.ok) throw new Error('Erro ao carregar entregas');

      const data = await response.json();
      setDeliveries(data.deliveries || []);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao carregar entregas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (deliveryId: string, newStatus: string) => {
    setUpdatingStatus(deliveryId);
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Erro ao atualizar status');

      await fetchDeliveries();
      alert('Status atualizado com sucesso!');
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err);
      alert(err.message);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const startLocationTracking = (deliveryId: string) => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada neste navegador');
      return;
    }

    setTrackingLocation(true);

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, speed } = position.coords;

        try {
          await fetch(`/api/deliveries/${deliveryId}/location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude,
              longitude,
              speed_kmh: speed ? speed * 3.6 : null, // m/s para km/h
            }),
          });

          console.log('Localização atualizada:', { latitude, longitude });
        } catch (err) {
          console.error('Erro ao atualizar localização:', err);
        }
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
        alert('Erro ao obter localização. Verifique as permissões.');
        setTrackingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    setLocationWatchId(watchId);
  };

  const stopLocationTracking = () => {
    if (locationWatchId !== null) {
      navigator.geolocation.clearWatch(locationWatchId);
      setLocationWatchId(null);
    }
    setTrackingLocation(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'in_transit':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'preparing':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
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

  const activeDeliveries = deliveries.filter(d =>
    ['pending', 'preparing', 'in_transit'].includes(d.status)
  );
  const completedDeliveries = deliveries.filter(d =>
    ['delivered', 'cancelled'].includes(d.status)
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Minhas Entregas</h1>
        <p className="text-zinc-400">Gerencie suas entregas de equipamentos</p>
      </div>

      {/* Entregas Ativas */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-500" />
          Entregas Ativas ({activeDeliveries.length})
        </h2>

        {activeDeliveries.length === 0 ? (
          <p className="text-zinc-400 text-center py-8">Nenhuma entrega ativa</p>
        ) : (
          <div className="space-y-4">
            {activeDeliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="bg-zinc-800/50 rounded-lg p-5 border border-zinc-700"
              >
                {/* Cabeçalho */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-white text-lg mb-1">
                      {delivery.event_project.event_name}
                    </h3>
                    <p className="text-sm text-zinc-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {delivery.destination_address}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-lg border ${getStatusColor(delivery.status)}`}>
                    {getStatusLabel(delivery.status)}
                  </div>
                </div>

                {/* Equipamentos */}
                <div className="mb-4">
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

                {/* Horário */}
                <div className="mb-4 flex items-center gap-2 text-sm text-zinc-400">
                  <Clock className="w-4 h-4" />
                  Previsto para: {new Date(delivery.scheduled_delivery_time).toLocaleString('pt-BR')}
                </div>

                {/* Ações */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-zinc-700">
                  {delivery.status === 'pending' && (
                    <button
                      onClick={() => updateStatus(delivery.id, 'preparing')}
                      disabled={updatingStatus === delivery.id}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-zinc-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      {updatingStatus === delivery.id ? 'Atualizando...' : 'Iniciar Preparação'}
                    </button>
                  )}

                  {delivery.status === 'preparing' && (
                    <>
                      <button
                        onClick={() => updateStatus(delivery.id, 'in_transit')}
                        disabled={updatingStatus === delivery.id}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        {updatingStatus === delivery.id ? 'Atualizando...' : 'Iniciar Entrega'}
                      </button>
                    </>
                  )}

                  {delivery.status === 'in_transit' && (
                    <>
                      {!trackingLocation ? (
                        <button
                          onClick={() => startLocationTracking(delivery.id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <Navigation className="w-4 h-4" />
                          Iniciar Rastreamento GPS
                        </button>
                      ) : (
                        <button
                          onClick={stopLocationTracking}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <Navigation className="w-4 h-4 animate-pulse" />
                          Parar Rastreamento
                        </button>
                      )}

                      <button
                        onClick={() => updateStatus(delivery.id, 'delivered')}
                        disabled={updatingStatus === delivery.id}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-zinc-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {updatingStatus === delivery.id ? 'Atualizando...' : 'Confirmar Entrega'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Entregas Concluídas */}
      {completedDeliveries.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Entregas Concluídas ({completedDeliveries.length})
          </h2>
          <div className="space-y-3">
            {completedDeliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">{delivery.event_project.event_name}</p>
                    <p className="text-sm text-zinc-400">
                      {delivery.equipment_items.length} item(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-lg border text-sm ${getStatusColor(delivery.status)}`}>
                      {getStatusLabel(delivery.status)}
                    </div>
                    {delivery.actual_delivery_time && (
                      <p className="text-xs text-zinc-500 mt-1">
                        {new Date(delivery.actual_delivery_time).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {deliveries.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <Package className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
          <p className="text-zinc-400">Nenhuma entrega encontrada</p>
        </div>
      )}
    </div>
  );
}
