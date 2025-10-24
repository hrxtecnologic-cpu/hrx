import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface DeliveryUpdate {
  id: string;
  status: string;
  current_latitude: number | null;
  current_longitude: number | null;
  last_location_update: string | null;
}

/**
 * Hook para tracking em tempo real de entregas usando Supabase Realtime
 *
 * Inscreve-se em mudanças na tabela delivery_trackings e atualiza
 * automaticamente quando:
 * - Localização GPS é atualizada
 * - Status da entrega muda
 * - Nova entrega é criada
 */
export function useRealtimeDeliveries(initialDeliveries: any[]) {
  const [deliveries, setDeliveries] = useState(initialDeliveries);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel;

    // Configurar subscription
    const setupRealtimeSubscription = async () => {
      channel = supabase
        .channel('delivery-trackings-realtime')
        .on(
          'postgres_changes',
          {
            event: '*', // UPDATE, INSERT, DELETE
            schema: 'public',
            table: 'delivery_trackings',
          },
          (payload) => {
            console.log('🔄 Realtime update received:', payload);

            if (payload.eventType === 'UPDATE') {
              // Atualizar entrega existente
              setDeliveries((prev) =>
                prev.map((delivery) =>
                  delivery.id === payload.new.id
                    ? {
                        ...delivery,
                        status: payload.new.status,
                        current_latitude: payload.new.current_latitude,
                        current_longitude: payload.new.current_longitude,
                        last_location_update: payload.new.last_location_update,
                      }
                    : delivery
                )
              );
            } else if (payload.eventType === 'INSERT') {
              // Adicionar nova entrega (se relevante para o usuário atual)
              console.log('📦 Nova entrega detectada:', payload.new);
              // Você pode fazer uma query adicional aqui para pegar dados completos
            } else if (payload.eventType === 'DELETE') {
              // Remover entrega
              setDeliveries((prev) => prev.filter((d) => d.id !== payload.old.id));
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Realtime status:', status);
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            console.log('✅ Conectado ao Realtime!');
          } else if (status === 'CLOSED') {
            setIsConnected(false);
            console.log('❌ Desconectado do Realtime');
          }
        });
    };

    setupRealtimeSubscription();

    // Cleanup ao desmontar
    return () => {
      if (channel) {
        console.log('🔌 Desconectando Realtime...');
        supabase.removeChannel(channel);
      }
    };
  }, []); // Rodar apenas uma vez

  // Atualizar quando initialDeliveries mudar (primeira carga)
  useEffect(() => {
    setDeliveries(initialDeliveries);
  }, [initialDeliveries]);

  return { deliveries, isConnected };
}
