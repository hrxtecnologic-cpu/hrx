'use client';

/**
 * Service Radius Selector
 *
 * Componente para o profissional definir o raio máximo de atuação
 * - Slider visual de 5km a 200km
 * - Previsão de tempo de viagem
 * - Visualização de área coberta
 */

import { useState } from 'react';
import { MapPin, Clock, TrendingUp } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface ServiceRadiusSelectorProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

// Opções predefinidas
const PRESET_RADIUS = [
  { value: 10, label: '10 km', description: 'Apenas bairros próximos' },
  { value: 30, label: '30 km', description: 'Cidade e arredores' },
  { value: 50, label: '50 km', description: 'Região metropolitana' },
  { value: 100, label: '100 km', description: 'Cidades vizinhas' },
  { value: 200, label: '200 km', description: 'Estado completo' },
];

export function ServiceRadiusSelector({
  value,
  onChange,
  className = '',
}: ServiceRadiusSelectorProps) {
  const [selectedRadius, setSelectedRadius] = useState(value);

  const handleChange = (newValue: number[]) => {
    const radius = newValue[0];
    setSelectedRadius(radius);
    onChange(radius);
  };

  const handlePresetClick = (presetValue: number) => {
    setSelectedRadius(presetValue);
    onChange(presetValue);
  };

  // Estimar tempo de viagem (aproximado)
  const estimatedTime = Math.round((selectedRadius / 60) * 60); // ~60km/h média

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <MapPin className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex-1">
          <Label className="text-base font-semibold text-white">
            Raio de Atuação
          </Label>
          <p className="text-sm text-zinc-400 mt-1">
            Defina a distância máxima que você aceita viajar para eventos
          </p>
        </div>
      </div>

      {/* Valor Atual */}
      <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg border border-zinc-700">
        <div>
          <p className="text-sm text-zinc-400">Raio selecionado</p>
          <p className="text-3xl font-bold text-white mt-1">
            {selectedRadius} <span className="text-lg text-zinc-400">km</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-zinc-400">Tempo estimado</p>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-4 h-4 text-zinc-400" />
            <p className="text-lg font-semibold text-white">
              ~{estimatedTime} min
            </p>
          </div>
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-3">
        <Slider
          value={[selectedRadius]}
          onValueChange={handleChange}
          min={5}
          max={200}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-zinc-500">
          <span>5 km</span>
          <span>200 km</span>
        </div>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-zinc-400">Opções rápidas:</p>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_RADIUS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetClick(preset.value)}
              className={`p-3 rounded-lg border transition-all text-left ${
                selectedRadius === preset.value
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
              }`}
              type="button"
            >
              <p className="font-semibold text-sm">{preset.label}</p>
              <p className="text-xs opacity-75 mt-0.5">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Informação adicional */}
      <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <TrendingUp className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-300">
          <strong>Dica:</strong> Raios maiores aumentam suas chances de receber mais convites,
          mas considere o tempo de deslocamento e custos de viagem.
        </p>
      </div>
    </div>
  );
}
