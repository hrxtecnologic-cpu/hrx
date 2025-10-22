'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Edit, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { Professional } from '@/types';

interface EditProfessionalModalProps {
  professional: Professional;
  onUpdate?: () => void;
}

export function EditProfessionalModal({ professional, onUpdate }: EditProfessionalModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    full_name: professional.full_name || '',
    cpf: professional.cpf || '',
    birth_date: professional.birth_date ? new Date(professional.birth_date).toISOString().split('T')[0] : '',
    email: professional.email || '',
    phone: professional.phone || '',
    street: professional.street || '',
    number: professional.number || '',
    complement: professional.complement || '',
    neighborhood: professional.neighborhood || '',
    city: professional.city || '',
    state: professional.state || '',
    cep: professional.cep || '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/admin/professionals/${professional.id}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao salvar alterações');
      }

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        onUpdate?.();
        window.location.reload(); // Recarregar para mostrar dados atualizados
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
        <Button
          variant="outline"
          size="sm"
          className="text-xs sm:text-sm border-zinc-300 text-zinc-300 hover:bg-zinc-800 hover:border-white hover:text-white"
        >
          <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          Editar Dados
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-white text-base sm:text-lg">
            Editar Dados do Profissional
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
          {/* Nome Completo */}
          <div>
            <Label htmlFor="full_name" className="text-zinc-300 text-xs sm:text-sm">
              Nome Completo *
            </Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
              required
              className="bg-zinc-800 border-zinc-700 text-white text-sm"
            />
          </div>

          {/* CPF e Data de Nascimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="cpf" className="text-zinc-300 text-xs sm:text-sm">
                CPF *
              </Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData((prev) => ({ ...prev, cpf: e.target.value }))}
                required
                placeholder="000.000.000-00"
                className="bg-zinc-800 border-zinc-700 text-white text-sm"
              />
            </div>

            <div>
              <Label htmlFor="birth_date" className="text-zinc-300 text-xs sm:text-sm">
                Data de Nascimento *
              </Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, birth_date: e.target.value }))}
                required
                className="bg-zinc-800 border-zinc-700 text-white text-sm"
              />
            </div>
          </div>

          {/* Email e Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="email" className="text-zinc-300 text-xs sm:text-sm">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                required
                className="bg-zinc-800 border-zinc-700 text-white text-sm"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-zinc-300 text-xs sm:text-sm">
                Telefone *
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                required
                className="bg-zinc-800 border-zinc-700 text-white text-sm"
              />
            </div>
          </div>

          {/* Endereço - Rua e Número */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="street" className="text-zinc-300 text-xs sm:text-sm">
                Rua
              </Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => setFormData((prev) => ({ ...prev, street: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-white text-sm"
              />
            </div>

            <div>
              <Label htmlFor="number" className="text-zinc-300 text-xs sm:text-sm">
                Número
              </Label>
              <Input
                id="number"
                value={formData.number}
                onChange={(e) => setFormData((prev) => ({ ...prev, number: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-white text-sm"
              />
            </div>
          </div>

          {/* Complemento */}
          <div>
            <Label htmlFor="complement" className="text-zinc-300 text-xs sm:text-sm">
              Complemento
            </Label>
            <Input
              id="complement"
              value={formData.complement}
              onChange={(e) => setFormData((prev) => ({ ...prev, complement: e.target.value }))}
              placeholder="Apto, casa, bloco..."
              className="bg-zinc-800 border-zinc-700 text-white text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="neighborhood" className="text-zinc-300 text-xs sm:text-sm">
                Bairro
              </Label>
              <Input
                id="neighborhood"
                value={formData.neighborhood}
                onChange={(e) => setFormData((prev) => ({ ...prev, neighborhood: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-white text-sm"
              />
            </div>

            <div>
              <Label htmlFor="city" className="text-zinc-300 text-xs sm:text-sm">
                Cidade
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-white text-sm"
              />
            </div>

            <div>
              <Label htmlFor="state" className="text-zinc-300 text-xs sm:text-sm">
                Estado
              </Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                maxLength={2}
                className="bg-zinc-800 border-zinc-700 text-white text-sm uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="cep" className="text-zinc-300 text-xs sm:text-sm">
                CEP
              </Label>
              <Input
                id="cep"
                value={formData.cep}
                onChange={(e) => setFormData((prev) => ({ ...prev, cep: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-white text-sm"
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
              className="flex-1 text-sm border-zinc-300 text-zinc-300 hover:bg-zinc-800 hover:border-white hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-500 text-sm"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
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
