/**
 * Professionals Search View
 *
 * Client component that wraps the AdvancedSearch and displays results
 */

'use client';

import { useState } from 'react';
import { AdvancedSearch } from './AdvancedSearch';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';

interface Professional {
  id: string;
  full_name: string;
  email: string;
  categories: string[];
  status: 'pending' | 'approved' | 'rejected' | 'incomplete';
  created_at: string;
  distance_km?: number;
}

interface ProfessionalsSearchViewProps {
  initialProfessionals: Professional[];
}

export function ProfessionalsSearchView({ initialProfessionals }: ProfessionalsSearchViewProps) {
  const [professionals, setProfessionals] = useState<Professional[]>(initialProfessionals);

  return (
    <div className="space-y-6">
      {/* Advanced Search Component */}
      <AdvancedSearch<Professional>
        onResultsChange={(results) => setProfessionals(results)}
        showProximitySearch={true}
        showStatusFilter={true}
        showCategoryFilter={true}
        showExperienceFilter={true}
      />

      {/* Results Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-800">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">
                    Profissional
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">
                    Categorias
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">
                    Status
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">
                    Cadastro
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">
                    Distância
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-zinc-400">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {professionals && professionals.length > 0 ? (
                  professionals.map((prof) => (
                    <tr key={prof.id} className="hover:bg-zinc-800/50 transition">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-white">{prof.full_name}</p>
                          <p className="text-sm text-zinc-500">{prof.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {prof.categories?.slice(0, 2).map((cat: string) => (
                            <span
                              key={cat}
                              className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded"
                            >
                              {cat}
                            </span>
                          ))}
                          {prof.categories?.length > 2 && (
                            <span className="text-xs text-zinc-500">
                              +{prof.categories.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {prof.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">
                            <CheckCircle className="h-3 w-3" />
                            Aprovado
                          </span>
                        ) : prof.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded">
                            <Clock className="h-3 w-3" />
                            Pendente
                          </span>
                        ) : prof.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded">
                            <XCircle className="h-3 w-3" />
                            Rejeitado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs bg-gray-500/10 text-gray-500 px-2 py-1 rounded">
                            <Clock className="h-3 w-3" />
                            Incompleto
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-zinc-400">
                          {new Date(prof.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </td>
                      <td className="p-4">
                        {prof.distance_km !== undefined ? (
                          <p className="text-sm text-zinc-400">
                            {prof.distance_km < 1
                              ? `${Math.round(prof.distance_km * 1000)} m`
                              : `${prof.distance_km.toFixed(1)} km`}
                          </p>
                        ) : (
                          <p className="text-sm text-zinc-500">-</p>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <Link href={`/admin/profissionais/${prof.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-zinc-400 hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-zinc-500">
                      Nenhum profissional encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
