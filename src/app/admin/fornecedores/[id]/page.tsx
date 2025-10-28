import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, Phone, MapPin, Package, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{supplier.company_name}</h1>
          <p className="text-zinc-400">Detalhes do fornecedor</p>
        </div>
        <Link href="/admin/fornecedores">
          <Button variant="outline">Voltar</Button>
        </Link>
      </div>

      {/* Status */}
      <div>
        <Badge variant={supplier.status === 'active' ? 'default' : 'destructive'}>
          {supplier.status === 'active' ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-zinc-400 mt-0.5" />
              <div>
                <p className="text-sm text-zinc-500">Empresa</p>
                <p className="text-white">{supplier.company_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-zinc-400 mt-0.5" />
              <div>
                <p className="text-sm text-zinc-500">Email</p>
                <p className="text-white">{supplier.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-zinc-400 mt-0.5" />
              <div>
                <p className="text-sm text-zinc-500">Telefone</p>
                <p className="text-white">{supplier.phone}</p>
              </div>
            </div>

            {supplier.contact_name && (
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-zinc-400 mt-0.5" />
                <div>
                  <p className="text-sm text-zinc-500">Contato</p>
                  <p className="text-white">{supplier.contact_name}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-zinc-400 mt-0.5" />
              <div>
                <p className="text-sm text-zinc-500">Cadastrado em</p>
                <p className="text-white">
                  {new Date(supplier.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Equipamentos */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="h-5 w-5" />
              Tipos de Equipamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {supplier.equipment_types && supplier.equipment_types.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {supplier.equipment_types.map((type: string) => (
                  <Badge key={type} variant="secondary" className="bg-zinc-800 text-zinc-200">
                    {type}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500">Nenhum tipo de equipamento cadastrado</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Catálogo de Equipamentos */}
      {supplier.equipment_catalog && supplier.equipment_catalog.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Catálogo de Equipamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {supplier.equipment_catalog.map((item: any, index: number) => (
                <div key={index} className="border border-zinc-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-white">{item.name}</h3>
                      <p className="text-sm text-zinc-400">{item.description}</p>
                    </div>
                    {item.pricing && (
                      <div className="text-right">
                        {item.pricing.daily && (
                          <p className="text-sm text-green-500">
                            R$ {item.pricing.daily}/dia
                          </p>
                        )}
                        {item.pricing.weekly && (
                          <p className="text-xs text-zinc-500">
                            R$ {item.pricing.weekly}/semana
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {item.specifications && Object.keys(item.specifications).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-zinc-800">
                      <p className="text-xs text-zinc-500 mb-2">Especificações:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(item.specifications).map(([key, value]: [string, any]) => (
                          <div key={key} className="text-sm">
                            <span className="text-zinc-500">{key}:</span>{' '}
                            <span className="text-white">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.availability && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs text-white border-zinc-700">
                        {item.availability.quantity} disponível(is)
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notas */}
      {supplier.notes && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-300 whitespace-pre-wrap">{supplier.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
