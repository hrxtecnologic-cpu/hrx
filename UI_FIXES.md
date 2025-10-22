# 🎨 Correções de UI - HRX Platform

> **Versão:** 1.0.0
> **Data:** 2025-10-21
> **Status:** Pendente

Correções identificadas na interface do sistema admin.

---

## 📋 Problemas Identificados

### 1. Admin - Fornecedores

**Problema:** Buttons e textos escuros sem contraste adequado

**Localização:** `/admin/fornecedores`

**Correção Necessária:**
- Buttons escuros → Contorno branco ou vermelho
- Textos escuros → Texto branco ou vermelho
- Seguir padrão de cores do projeto

**Padrão de Cores HRX:**
```css
/* Cores principais */
--primary: #DC2626 (Vermelho)
--primary-dark: #991B1B (Vermelho escuro)
--background: #000000 (Preto)
--text: #FFFFFF (Branco)
--text-muted: #A1A1AA (Cinza claro)

/* Borders */
--border: #27272A (Cinza escuro)
--border-light: #3F3F46 (Cinza médio)
```

---

### 2. Admin - Documentos

**Problema:** Responsividade ruim em telas menores

**Localização:** Página de validação de documentos

**Correção Necessária:**
- Adaptar layout para mobile
- Imagens de documentos responsivas
- Buttons empilhados em telas pequenas
- Melhor uso do espaço vertical

---

## 🔧 Implementação

### Correção 1: Fornecedores - Buttons e Textos

**Arquivo:** Encontrar e corrigir em `src/app/admin/fornecedores/**`

**ANTES (Errado):**
```tsx
<Button className="bg-gray-800 text-gray-900">
  Ação
</Button>
```

**DEPOIS (Correto):**
```tsx
<Button
  variant="outline"
  className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
>
  Ação
</Button>

// OU

<Button
  variant="outline"
  className="border-white text-white hover:bg-white hover:text-black"
>
  Ação
</Button>
```

**Classes Padrão para Buttons:**

```typescript
// src/lib/button-variants.ts

export const buttonVariants = {
  // Primary (Vermelho sólido)
  primary: "bg-red-600 hover:bg-red-500 text-white",

  // Outline Vermelho
  outlineRed: "border-red-600 text-red-600 hover:bg-red-600 hover:text-white",

  // Outline Branco
  outlineWhite: "border-white text-white hover:bg-white hover:text-black",

  // Danger (vermelho mais escuro)
  danger: "bg-red-700 hover:bg-red-600 text-white",

  // Success (verde)
  success: "bg-green-600 hover:bg-green-500 text-white",

  // Ghost (transparente)
  ghost: "text-white hover:bg-zinc-800",
};
```

**Componente de Button Padronizado:**

```tsx
// src/components/admin/ActionButton.tsx
'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ActionButtonProps {
  variant?: 'primary' | 'outlineRed' | 'outlineWhite' | 'danger' | 'success' | 'ghost';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function ActionButton({
  variant = 'outlineRed',
  children,
  onClick,
  disabled,
  className
}: ActionButtonProps) {
  const variants = {
    primary: 'bg-red-600 hover:bg-red-500 text-white',
    outlineRed: 'border-red-600 text-red-600 hover:bg-red-600 hover:text-white',
    outlineWhite: 'border-white text-white hover:bg-white hover:text-black',
    danger: 'bg-red-700 hover:bg-red-600 text-white',
    success: 'bg-green-600 hover:bg-green-500 text-white',
    ghost: 'text-white hover:bg-zinc-800',
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant={variant === 'primary' || variant === 'danger' || variant === 'success' ? 'default' : 'outline'}
      className={cn(variants[variant], className)}
    >
      {children}
    </Button>
  );
}
```

**Uso:**

```tsx
import { ActionButton } from '@/components/admin/ActionButton';

// Botão vermelho com contorno
<ActionButton variant="outlineRed" onClick={handleApprove}>
  Aprovar
</ActionButton>

// Botão branco com contorno
<ActionButton variant="outlineWhite" onClick={handleEdit}>
  Editar
</ActionButton>

// Botão vermelho sólido
<ActionButton variant="primary" onClick={handleDelete}>
  Deletar
</ActionButton>
```

---

### Correção 2: Documentos - Responsividade

**Arquivo:** `src/app/admin/profissionais/[id]/documentos/page.tsx` (exemplo)

**Problema:** Layout quebra em mobile

**Solução:**

```tsx
// ANTES (Desktop-only)
<div className="grid grid-cols-3 gap-4">
  {documents.map(doc => (
    <div key={doc.id} className="border p-4">
      <img src={doc.url} className="w-full h-64 object-cover" />
      <div className="flex gap-2 mt-4">
        <Button>Aprovar</Button>
        <Button>Rejeitar</Button>
      </div>
    </div>
  ))}
</div>

// DEPOIS (Responsivo)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {documents.map(doc => (
    <div key={doc.id} className="border border-zinc-800 rounded-lg p-4 bg-zinc-900">
      {/* Imagem Responsiva */}
      <div className="relative w-full h-48 sm:h-56 lg:h-64 overflow-hidden rounded-lg">
        <img
          src={doc.url}
          alt={doc.type}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="mt-3">
        <h3 className="text-white font-medium text-sm sm:text-base">
          {doc.name}
        </h3>
        <p className="text-zinc-400 text-xs sm:text-sm mt-1">
          {doc.status}
        </p>
      </div>

      {/* Actions - Empilhados em mobile */}
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <ActionButton
          variant="success"
          onClick={() => handleApprove(doc.id)}
          className="w-full sm:w-auto"
        >
          Aprovar
        </ActionButton>
        <ActionButton
          variant="danger"
          onClick={() => handleReject(doc.id)}
          className="w-full sm:w-auto"
        >
          Rejeitar
        </ActionButton>
      </div>
    </div>
  ))}
</div>
```

**Modal de Visualização Responsivo:**

```tsx
// src/components/admin/DocumentModal.tsx
'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ActionButton } from '@/components/admin/ActionButton';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    url: string;
    name: string;
    type: string;
  };
  onApprove: () => void;
  onReject: () => void;
}

export function DocumentModal({
  isOpen,
  onClose,
  document,
  onApprove,
  onReject
}: DocumentModalProps) {
  const [zoom, setZoom] = useState(100);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[90vh] p-0 bg-black">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-white font-semibold text-base sm:text-lg">
            {document.name}
          </h2>
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <button
              onClick={() => setZoom(Math.max(50, zoom - 25))}
              className="p-2 hover:bg-zinc-800 rounded"
            >
              <ZoomOut className="h-4 w-4 text-white" />
            </button>
            <span className="text-white text-sm">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              className="p-2 hover:bg-zinc-800 rounded"
            >
              <ZoomIn className="h-4 w-4 text-white" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded">
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        {/* Image Container - Scrollable */}
        <div className="flex-1 overflow-auto p-4 bg-zinc-950">
          <div className="flex items-center justify-center min-h-full">
            <img
              src={document.url}
              alt={document.name}
              className="max-w-full h-auto"
              style={{ transform: `scale(${zoom / 100})` }}
            />
          </div>
        </div>

        {/* Actions - Responsivo */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <ActionButton
              variant="success"
              onClick={onApprove}
              className="w-full sm:flex-1"
            >
              ✓ Aprovar Documento
            </ActionButton>
            <ActionButton
              variant="danger"
              onClick={onReject}
              className="w-full sm:flex-1"
            >
              ✗ Rejeitar Documento
            </ActionButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 📱 Classes Tailwind para Responsividade

### Breakpoints

```
sm:  640px  (mobile landscape)
md:  768px  (tablet)
lg:  1024px (desktop)
xl:  1280px (large desktop)
2xl: 1536px (extra large)
```

### Patterns Comuns

**Grid Responsivo:**
```tsx
// 1 coluna mobile, 2 tablet, 3 desktop
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"

// 1 coluna mobile, 3 desktop
className="grid grid-cols-1 lg:grid-cols-3 gap-4"
```

**Flex Responsivo:**
```tsx
// Coluna em mobile, row em desktop
className="flex flex-col md:flex-row gap-4"

// Stack buttons em mobile
className="flex flex-col sm:flex-row gap-2"
```

**Padding/Margin Responsivo:**
```tsx
// Padding menor em mobile
className="p-4 md:p-6 lg:p-8"

// Margin adaptável
className="mt-4 md:mt-6 lg:mt-8"
```

**Texto Responsivo:**
```tsx
// Tamanhos de texto adaptativos
className="text-sm sm:text-base lg:text-lg"

// Títulos responsivos
className="text-2xl md:text-3xl lg:text-4xl"
```

**Esconder/Mostrar por Tela:**
```tsx
// Esconder em mobile
className="hidden md:block"

// Mostrar apenas em mobile
className="block md:hidden"
```

---

## ✅ Checklist de Implementação

### Fornecedores
- [ ] Identificar todos os buttons na página de fornecedores
- [ ] Substituir por `ActionButton` com variant apropriado
- [ ] Verificar textos escuros e mudar para branco/vermelho
- [ ] Testar contraste em fundo escuro
- [ ] Verificar hover states

### Documentos
- [ ] Criar `DocumentModal` component
- [ ] Fazer grid responsivo (1 col mobile, 2 tablet, 3 desktop)
- [ ] Tornar imagens responsivas com aspect ratio
- [ ] Empilhar buttons em mobile
- [ ] Adicionar zoom na modal
- [ ] Testar em diferentes tamanhos de tela
- [ ] Otimizar carregamento de imagens

### Geral
- [ ] Criar `ActionButton` component
- [ ] Documentar variants de botões
- [ ] Criar guia de responsividade para o time
- [ ] Testar em dispositivos reais (não só DevTools)

---

## 🎨 Exemplo Completo de Página Responsiva

```tsx
// src/app/admin/fornecedores/page.tsx
'use client';

import { useState } from 'react';
import { ActionButton } from '@/components/admin/ActionButton';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function FornecedoresPage() {
  const [suppliers, setSuppliers] = useState([]);

  return (
    <div className="min-h-screen bg-black p-4 md:p-6 lg:p-8">
      {/* Header Responsivo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Fornecedores
        </h1>
        <ActionButton variant="primary" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Novo Fornecedor
        </ActionButton>
      </div>

      {/* Search Bar Responsivo */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Buscar fornecedor..."
            className="w-full bg-zinc-900 border-zinc-800 text-white"
          />
        </div>
        <ActionButton variant="outlineWhite" className="w-full sm:w-auto">
          <Search className="h-4 w-4 mr-2" />
          Buscar
        </ActionButton>
      </div>

      {/* Grid Responsivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map(supplier => (
          <div
            key={supplier.id}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 md:p-6"
          >
            <h3 className="text-white font-semibold text-base md:text-lg mb-2">
              {supplier.name}
            </h3>
            <p className="text-zinc-400 text-sm mb-4">
              {supplier.category}
            </p>

            {/* Actions Responsivos */}
            <div className="flex flex-col sm:flex-row gap-2">
              <ActionButton
                variant="outlineWhite"
                className="w-full sm:flex-1"
              >
                Editar
              </ActionButton>
              <ActionButton
                variant="danger"
                className="w-full sm:flex-1"
              >
                Excluir
              </ActionButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🔍 Como Testar Responsividade

### Chrome DevTools
1. F12 → Toggle Device Toolbar (Ctrl+Shift+M)
2. Testar em:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad (768px)
   - Desktop (1920px)

### Dispositivos Reais
- Testar em celular real (Android/iOS)
- Verificar touch targets (mínimo 44x44px)
- Testar orientação landscape

### Checklist Visual
- [ ] Nada cortado nas bordas
- [ ] Texto legível
- [ ] Buttons clicáveis (não muito pequenos)
- [ ] Scroll funcional
- [ ] Imagens não distorcidas
- [ ] Gaps e spacing consistentes

---

**Prioridade:** 🟡 Alta
**Estimativa:** 1-2 dias de trabalho
**Impacto:** Melhora significativa na UX
