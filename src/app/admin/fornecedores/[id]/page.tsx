import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Package,
  Calendar,
  FileText,
  DollarSign,
  Image as ImageIcon,
  Wrench,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ImageViewer } from '@/components/ImageViewer';

export default async function FornecedorDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Buscar fornecedor
  const { data: supplier, error } = await supabase
    .from('equipment_suppliers')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !supplier) {
    notFound();
  }

  const totalEquipamentos = supplier.equipment_catalog?.length || 0;
  const equipamentosComFoto = supplier.equipment_catalog?.filter((item: any) => item.photos && item.photos.length > 0).length || 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Header com padrão do projeto */}
      <div className="relative overflow-hidden rounded-lg bg-zinc-900 border border-zinc-800 p-6">
        {/* Detalhes vermelhos no canto */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-600/5 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <Link href="/admin/fornecedores">
              <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                ← Voltar
              </Button>
            </Link>
            <Badge
              variant={supplier.status === 'active' ? 'default' : 'destructive'}
              className={supplier.status === 'active'
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-red-500/20 text-red-400 border-red-500/30'
              }
            >
              {supplier.status === 'active' ? '✓ Ativo' : '✕ Inativo'}
            </Badge>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-600/10 border border-red-600/20 rounded-lg">
              <Building2 className="h-8 w-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                {supplier.company_name}
              </h1>
              <p className="text-zinc-400 text-sm">
                {supplier.contact_name} • {supplier.email}
              </p>
            </div>
          </div>

          {/* Stats rápidos */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 hover:border-red-600/30 transition-colors">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <Package className="h-3 w-3 text-red-500" />
                Equipamentos
              </div>
              <p className="text-2xl font-bold text-white">{totalEquipamentos}</p>
            </div>
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 hover:border-red-600/30 transition-colors">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <ImageIcon className="h-3 w-3 text-red-500" />
                Com Fotos
              </div>
              <p className="text-2xl font-bold text-white">{equipamentosComFoto}</p>
            </div>
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 hover:border-red-600/30 transition-colors">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <TrendingUp className="h-3 w-3 text-red-500" />
                Tipos
              </div>
              <p className="text-2xl font-bold text-white">
                {supplier.equipment_types?.length || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Accent vermelhos */}
        <div className="absolute top-0 right-0 h-1 w-32 bg-gradient-to-r from-transparent to-red-600" />
        <div className="absolute bottom-0 left-0 h-1 w-24 bg-gradient-to-r from-red-600 to-transparent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda - Informações */}
        <div className="lg:col-span-1 space-y-6">
          {/* Informações de Contato */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-500" />
                Informações de Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                  <Mail className="h-4 w-4 text-purple-400 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-500">Email</p>
                    <p className="text-sm text-white truncate">{supplier.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                  <Phone className="h-4 w-4 text-purple-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-xs text-zinc-500">Telefone</p>
                    <p className="text-sm text-white">{supplier.phone}</p>
                  </div>
                </div>

                {supplier.contact_name && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                    <Building2 className="h-4 w-4 text-purple-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-zinc-500">Pessoa de Contato</p>
                      <p className="text-sm text-white">{supplier.contact_name}</p>
                    </div>
                  </div>
                )}

                {(supplier.city || supplier.state) && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                    <MapPin className="h-4 w-4 text-purple-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-zinc-500">Localização</p>
                      <p className="text-sm text-white">
                        {supplier.city}{supplier.city && supplier.state && ', '}{supplier.state}
                      </p>
                    </div>
                  </div>
                )}

                {supplier.cnpj && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                    <FileText className="h-4 w-4 text-purple-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-zinc-500">CNPJ</p>
                      <p className="text-sm text-white font-mono">{supplier.cnpj}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                  <Calendar className="h-4 w-4 text-purple-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-xs text-zinc-500">Cadastrado em</p>
                    <p className="text-sm text-white">
                      {new Date(supplier.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tipos de Equipamentos */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="h-5 w-5 text-red-500" />
                Tipos de Equipamentos
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Categorias disponíveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {supplier.equipment_types && supplier.equipment_types.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {supplier.equipment_types.map((type: string) => (
                    <Badge
                      key={type}
                      className="bg-gradient-to-r from-purple-600/20 to-red-600/20 text-white border border-purple-500/30 hover:border-purple-500/50 transition-colors"
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 text-center py-4">
                  Nenhum tipo cadastrado
                </p>
              )}
            </CardContent>
          </Card>

          {/* Observações */}
          {supplier.notes && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-yellow-500" />
                  Observações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {supplier.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna Direita - Catálogo de Equipamentos */}
        <div className="lg:col-span-2">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-purple-500" />
                    Catálogo de Equipamentos
                  </CardTitle>
                  <CardDescription className="text-zinc-400 mt-1">
                    {totalEquipamentos} equipamento{totalEquipamentos !== 1 ? 's' : ''} cadastrado{totalEquipamentos !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {supplier.equipment_catalog && supplier.equipment_catalog.length > 0 ? (
                <div className="grid gap-4">
                  {supplier.equipment_catalog.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="border border-zinc-800 rounded-lg p-4 hover:border-purple-500/50 transition-colors bg-zinc-800/30"
                    >
                      <div className="flex gap-4">
                        {/* Fotos do Equipamento */}
                        {item.photos && item.photos.length > 0 ? (
                          <div className="flex-shrink-0">
                            <ImageViewer images={item.photos} />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 w-48 h-24 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                            <div className="text-center">
                              <ImageIcon className="h-8 w-8 text-zinc-600 mx-auto mb-1" />
                              <p className="text-xs text-zinc-600">Sem fotos</p>
                            </div>
                          </div>
                        )}

                        {/* Informações do Equipamento */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-white text-lg">{item.name}</h3>
                                {item.is_active && (
                                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                    Disponível
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-zinc-400 line-clamp-2">{item.description}</p>

                              {/* Categoria e Subcategoria */}
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline" className="text-xs text-purple-400 border-purple-500/30">
                                  {item.category}
                                </Badge>
                                {item.subcategory && (
                                  <Badge variant="outline" className="text-xs text-red-400 border-red-500/30">
                                    {item.subcategory}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Preços */}
                            {item.pricing && (
                              <div className="text-right space-y-1 flex-shrink-0">
                                {item.pricing.daily && (
                                  <div className="flex items-center gap-1 justify-end">
                                    <DollarSign className="h-3 w-3 text-green-400" />
                                    <span className="text-lg font-bold text-green-400">
                                      R$ {parseFloat(item.pricing.daily).toLocaleString('pt-BR')}
                                    </span>
                                    <span className="text-xs text-zinc-500">/dia</span>
                                  </div>
                                )}
                                {item.pricing.weekly && (
                                  <p className="text-xs text-zinc-400">
                                    R$ {parseFloat(item.pricing.weekly).toLocaleString('pt-BR')}/sem
                                  </p>
                                )}
                                {item.pricing.monthly && (
                                  <p className="text-xs text-zinc-400">
                                    R$ {parseFloat(item.pricing.monthly).toLocaleString('pt-BR')}/mês
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Especificações Técnicas */}
                          {item.specifications && Object.keys(item.specifications).length > 0 && (
                            <div className="mt-3 pt-3 border-t border-zinc-700">
                              <p className="text-xs text-zinc-500 mb-2 font-medium">📋 Especificações Técnicas:</p>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                {Object.entries(item.specifications).map(([key, value]: [string, any]) => (
                                  <div key={key} className="text-xs">
                                    <span className="text-zinc-500">{key}:</span>{' '}
                                    <span className="text-white font-medium">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Quantidade Disponível */}
                          {item.availability && (
                            <div className="mt-3 flex items-center gap-2">
                              <Badge variant="outline" className="text-xs text-zinc-300 border-zinc-600">
                                📦 {item.availability.quantity} unidade{item.availability.quantity !== 1 ? 's' : ''} disponível{item.availability.quantity !== 1 ? 'is' : ''}
                              </Badge>
                              {item.availability.status && (
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    item.availability.status === 'available'
                                      ? 'text-green-400 border-green-500/30'
                                      : 'text-yellow-400 border-yellow-500/30'
                                  }`}
                                >
                                  {item.availability.status === 'available' ? '✓ Disponível' : '⏰ Limitado'}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-500 mb-2">Nenhum equipamento cadastrado</p>
                  <p className="text-xs text-zinc-600">
                    Este fornecedor ainda não possui equipamentos no catálogo
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
