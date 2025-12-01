'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Edit, Save, AlertCircle, CheckCircle, Building2, Package } from 'lucide-react';
import { SimpleCatalogItemsManager } from './SimpleCatalogItemsManager';

interface CatalogItem {
  id: string;
  category: string;
  subcategory: string;
  name: string;
  description: string;
  pricing_daily?: string;
  pricing_weekly?: string;
  pricing_monthly?: string;
  quantity: string;
  specifications: { key: string; value: string }[];
  photos?: string[];
  pricing?: {
    daily?: number;
    weekly?: number;
    monthly?: number;
  };
  availability?: {
    status?: string;
    quantity?: number;
  };
}

interface SupplierData {
  id: string;
  company_name: string;
  legal_name?: string;
  cnpj?: string;
  contact_name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  equipment_types: string[];
  equipment_catalog?: CatalogItem[];
  notes?: string;
  status: string;
}

interface EditSupplierModalProps {
  supplier: SupplierData;
  onUpdate?: () => void;
}

export function EditSupplierModal({ supplier, onUpdate }: EditSupplierModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    company_name: supplier.company_name || '',
    legal_name: supplier.legal_name || '',
    cnpj: supplier.cnpj || '',
    contact_name: supplier.contact_name || '',
    email: supplier.email || '',
    phone: supplier.phone || '',
    address: supplier.address || '',
    city: supplier.city || '',
    state: supplier.state || '',
    zip_code: supplier.zip_code || '',
    notes: supplier.notes || '',
  });

  // Converter catálogo do formato do banco para o formato do editor
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>(() => {
    return (supplier.equipment_catalog || []).map((item) => ({
      id: item.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      category: item.category || '',
      subcategory: item.subcategory || '',
      name: item.name || '',
      description: item.description || '',
      pricing_daily: item.pricing?.daily?.toString() || item.pricing_daily || '',
      pricing_weekly: item.pricing?.weekly?.toString() || item.pricing_weekly || '',
      pricing_monthly: item.pricing?.monthly?.toString() || item.pricing_monthly || '',
      quantity: item.availability?.quantity?.toString() || item.quantity || '1',
      specifications: Array.isArray(item.specifications)
        ? item.specifications
        : Object.entries(item.specifications || {}).map(([key, value]) => ({ key, value: String(value) })),
      photos: item.photos || [],
    }));
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Converter catálogo para o formato do banco
      const catalogForDB = catalogItems.map((item) => ({
        id: item.id,
        category: item.category,
        subcategory: item.subcategory,
        name: item.name,
        description: item.description,
        pricing: {
          daily: item.pricing_daily ? parseFloat(item.pricing_daily) : null,
          weekly: item.pricing_weekly ? parseFloat(item.pricing_weekly) : null,
          monthly: item.pricing_monthly ? parseFloat(item.pricing_monthly) : null,
        },
        specifications: Object.fromEntries(
          (item.specifications || [])
            .filter(s => s.key && s.value)
            .map(s => [s.key, s.value])
        ),
        photos: item.photos || [],
        availability: {
          status: 'available',
          quantity: parseInt(item.quantity) || 1,
        },
        is_active: true,
      }));

      const response = await fetch(`/api/admin/suppliers/${supplier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: formData.company_name,
          contact_name: formData.contact_name,
          email: formData.email,
          phone: formData.phone,
          equipment_types: supplier.equipment_types,
          equipment_catalog: catalogForDB,
          notes: formData.notes,
          status: supplier.status,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao salvar alterações');
      }

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        onUpdate?.();
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700 text-white">
          <Edit className="h-4 w-4 mr-2" />
          Editar Fornecedor
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-white text-lg">
            Editar Fornecedor - {supplier.company_name}
          </DialogTitle>
        </DialogHeader>

        {/* Mensagens */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-400">Dados atualizados com sucesso!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-zinc-800">
              <TabsTrigger value="dados" className="data-[state=active]:bg-red-600">
                <Building2 className="h-4 w-4 mr-2" />
                Dados da Empresa
              </TabsTrigger>
              <TabsTrigger value="catalogo" className="data-[state=active]:bg-red-600">
                <Package className="h-4 w-4 mr-2" />
                Catálogo ({catalogItems.length})
              </TabsTrigger>
            </TabsList>

            {/* Aba Dados da Empresa */}
            <TabsContent value="dados" className="space-y-4 mt-4">
              {/* Nome da Empresa */}
              <div>
                <Label htmlFor="company_name" className="text-zinc-300 text-sm">
                  Nome da Empresa *
                </Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, company_name: e.target.value }))}
                  required
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              {/* Razão Social e CNPJ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="legal_name" className="text-zinc-300 text-sm">
                    Razão Social
                  </Label>
                  <Input
                    id="legal_name"
                    value={formData.legal_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, legal_name: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="cnpj" className="text-zinc-300 text-sm">
                    CNPJ
                  </Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cnpj: e.target.value }))}
                    placeholder="00.000.000/0000-00"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>

              {/* Contato */}
              <div>
                <Label htmlFor="contact_name" className="text-zinc-300 text-sm">
                  Pessoa de Contato *
                </Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contact_name: e.target.value }))}
                  required
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              {/* Email e Telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="text-zinc-300 text-sm">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    required
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-zinc-300 text-sm">
                    Telefone *
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    required
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div>
                <Label htmlFor="address" className="text-zinc-300 text-sm">
                  Endereço
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              {/* Cidade, Estado, CEP */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city" className="text-zinc-300 text-sm">
                    Cidade
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="state" className="text-zinc-300 text-sm">
                    Estado
                  </Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                    maxLength={2}
                    className="bg-zinc-800 border-zinc-700 text-white uppercase"
                  />
                </div>
                <div>
                  <Label htmlFor="zip_code" className="text-zinc-300 text-sm">
                    CEP
                  </Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => setFormData((prev) => ({ ...prev, zip_code: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <Label htmlFor="notes" className="text-zinc-300 text-sm">
                  Observações
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="bg-zinc-800 border-zinc-700 text-white resize-none"
                />
              </div>
            </TabsContent>

            {/* Aba Catálogo */}
            <TabsContent value="catalogo" className="mt-4">
              <SimpleCatalogItemsManager
                items={catalogItems}
                onChange={setCatalogItems}
              />
            </TabsContent>
          </Tabs>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
              className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
