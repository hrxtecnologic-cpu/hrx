'use client';

import { useEffect, useState } from 'react';
import { MapView, type MapMarker } from '@/components/admin/MapView';

export default function MapPage() {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMapData() {
      try {
        const response = await fetch('/api/admin/map-data');
        if (!response.ok) throw new Error('Erro ao carregar dados');

        const data = await response.json();
        setMarkers(data.markers || []);
      } catch (err) {
        console.error('Erro ao carregar mapa:', err);
        setError('Erro ao carregar dados do mapa');
      } finally {
        setLoading(false);
      }
    }

    loadMapData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Mapa Geográfico
          </h1>
          <p className="text-zinc-400">
            Carregando dados...
          </p>
        </div>
        <div className="bg-zinc-800 rounded-xl p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-zinc-400">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Mapa Geográfico
          </h1>
        </div>
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-8 text-center">
          <p className="text-red-400 font-semibold mb-3 text-lg">
            {error}
          </p>
        </div>
      </div>
    );
  }

  const handleGeocodeAll = async () => {
    if (!confirm('Isso irá geocodificar todos os profissionais, fornecedores e eventos sem coordenadas. Pode levar alguns minutos. Deseja continuar?')) {
      return;
    }

    setLoading(true);
    try {
      const types = ['professionals', 'suppliers', 'events'];
      let totalProcessed = 0;

      for (const type of types) {
        console.log(`Buscando ${type} sem coordenadas...`);

        const response = await fetch(`/api/admin/geocode/batch?type=${type}`);

        if (!response.ok) {
          console.error(`Erro ao buscar ${type}:`, response.status);
          continue; // Pula para o próximo tipo
        }

        const data = await response.json();
        console.log(`${type}:`, data);

        const pending = data.data?.records || [];

        if (pending.length > 0) {
          console.log(`Geocodificando ${pending.length} ${type}...`);

          // Geocodificar
          const geocodeResponse = await fetch('/api/admin/geocode/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type,
              ids: pending.map((p: any) => p.id)
            })
          });

          if (geocodeResponse.ok) {
            const result = await geocodeResponse.json();
            totalProcessed += result.data?.summary?.successful || 0;
            console.log(`${type} processado:`, result);
          }
        }
      }

      // Recarregar dados
      const response = await fetch('/api/admin/map-data');
      const data = await response.json();
      setMarkers(data.markers || []);

      alert(`Geocodificação concluída!\n${totalProcessed} registros processados com sucesso.`);
    } catch (err) {
      console.error('Erro ao geocodificar:', err);
      alert('Erro ao geocodificar. Veja o console para detalhes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-0">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Mapa Geográfico
        </h1>
        <p className="text-sm sm:text-base text-zinc-400">
          Visualize profissionais, fornecedores e eventos no mapa interativo com filtros por tipo
        </p>
      </div>

      {/* Content */}
      {markers.length === 0 ? (
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6 sm:p-8 text-center">
          <div className="max-w-md mx-auto">
            <p className="text-yellow-400 font-semibold mb-3 text-base sm:text-lg">
              Nenhuma localização disponível
            </p>
            <p className="text-yellow-500/80 text-sm leading-relaxed mb-6">
              Profissionais, fornecedores e eventos precisam ter coordenadas geográficas.
            </p>
            <button
              onClick={handleGeocodeAll}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm sm:text-base"
            >
              {loading ? 'Processando...' : 'Geocodificar Todos Automaticamente'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-3 sm:p-6">
          <MapView markers={markers} />
        </div>
      )}
    </div>
  );
}
