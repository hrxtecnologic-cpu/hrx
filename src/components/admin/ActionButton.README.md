# ActionButton Component

Componente de botão padronizado para o painel admin, garantindo consistência visual e acessibilidade.

## Uso Básico

```tsx
import { ActionButton } from '@/components/admin/ActionButton';

// Botão vermelho sólido (padrão)
<ActionButton>Salvar</ActionButton>

// Com ícone
<ActionButton>
  <Save className="h-4 w-4 mr-2" />
  Salvar
</ActionButton>
```

## Variantes

### `primary` (padrão)
Vermelho sólido - Para ações principais
```tsx
<ActionButton variant="primary">Criar Novo</ActionButton>
```

### `outlineRed`
Contorno vermelho - Para ações secundárias
```tsx
<ActionButton variant="outlineRed">Deletar</ActionButton>
```

### `outlineWhite`
Contorno branco - Para ações neutras
```tsx
<ActionButton variant="outlineWhite">Editar</ActionButton>
```

### `danger`
Vermelho escuro - Para ações destrutivas importantes
```tsx
<ActionButton variant="danger">Excluir Permanentemente</ActionButton>
```

### `success`
Verde - Para ações de aprovação/sucesso
```tsx
<ActionButton variant="success">Aprovar</ActionButton>
```

### `ghost`
Transparente - Para ações sutis
```tsx
<ActionButton variant="ghost">Cancelar</ActionButton>
```

## Tamanhos

```tsx
<ActionButton size="sm">Pequeno</ActionButton>
<ActionButton size="default">Padrão</ActionButton>
<ActionButton size="lg">Grande</ActionButton>
<ActionButton size="icon"><Plus className="h-4 w-4" /></ActionButton>
```

## Estados

```tsx
// Desabilitado
<ActionButton disabled>Não Disponível</ActionButton>

// Loading
<ActionButton disabled>
  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
  Carregando...
</ActionButton>
```

## Exemplos Práticos

### Ações de CRUD
```tsx
// Criar
<ActionButton variant="primary">
  <Plus className="h-4 w-4 mr-2" />
  Novo Registro
</ActionButton>

// Editar
<ActionButton variant="outlineWhite" size="sm">
  <Edit className="h-4 w-4" />
</ActionButton>

// Deletar
<ActionButton variant="outlineRed" size="sm">
  <Trash2 className="h-4 w-4" />
</ActionButton>
```

### Aprovação/Rejeição
```tsx
<ActionButton variant="success">Aprovar</ActionButton>
<ActionButton variant="danger">Rejeitar</ActionButton>
```

### Dialog Footer
```tsx
<DialogFooter className="gap-3">
  <ActionButton variant="ghost" onClick={onCancel}>
    Cancelar
  </ActionButton>
  <ActionButton variant="primary" onClick={onSave}>
    Salvar
  </ActionButton>
</DialogFooter>
```

## Acessibilidade

- ✅ Suporte completo a teclado
- ✅ Ring de foco visível
- ✅ Estados disabled com opacity reduzida
- ✅ Contraste WCAG AA em todas as variantes
- ✅ Cores semânticas (vermelho = atenção, verde = sucesso)

## Quando NÃO usar

- Para links de navegação → use `<Link>` ou `<a>`
- Para ações inline em texto → use `<Button variant="link">`
- Para tabs/segmented controls → use componentes específicos
