# 🗺️ Como Usar o Mapbox Autocomplete

## Componente Criado
`src/components/MapboxAutocomplete.tsx`

## Uso Básico

### 1. Importar o componente
```typescript
import { MapboxAutocomplete } from '@/components/MapboxAutocomplete';
```

### 2. No seu formulário (exemplo: wizard de eventos)

```typescript
// State para o endereço
const [addressValue, setAddressValue] = useState('');

// Handler quando usuário seleciona uma sugestão
const handleAddressSelect = (suggestion) => {
  // Preencher campos automaticamente
  setValue('venue_address', suggestion.placeName);
  setValue('venue_city', suggestion.city || '');
  setValue('venue_state', suggestion.state || '');

  // Se quiser salvar coordenadas
  setValue('latitude', suggestion.coordinates.latitude);
  setValue('longitude', suggestion.coordinates.longitude);

  console.log('Endereço selecionado:', suggestion);
};

// No JSX
<MapboxAutocomplete
  value={addressValue}
  onChange={setAddressValue}
  onSelect={handleAddressSelect}
  placeholder="Digite o endereço do evento..."
  className="w-full"
/>
```

## Onde Aplicar

### ✅ 1. Wizard de Eventos (`solicitar-evento-wizard/page.tsx`)
**Step**: Venue (Local do Evento)
**Campo**: `venue_address`
**Linha aproximada**: ~1100

**Substituir**:
```typescript
// ANTES:
<input
  type="text"
  {...register('venue_address')}
  placeholder="Endereço completo"
  className="..."
/>

// DEPOIS:
<MapboxAutocomplete
  value={watch('venue_address') || ''}
  onChange={(value) => setValue('venue_address', value)}
  onSelect={(suggestion) => {
    setValue('venue_address', suggestion.placeName);
    setValue('venue_city', suggestion.city || '');
    setValue('venue_state', suggestion.state || '');
    // Opcional: salvar coordenadas para geocoding automático
  }}
  placeholder="Digite o endereço do evento..."
/>
```

### ✅ 2. Cadastro de Profissional
**Arquivo**: Onde cadastra profissional
**Campos**: `street`, `city`, `state`

### ✅ 3. Cadastro de Fornecedor
**Arquivo**: Onde cadastra fornecedor
**Campo**: `address`

## Features do Componente

- ✅ **Autocomplete** enquanto digita (debounce 300ms)
- ✅ **Sugestões** do Mapbox (até 5 resultados)
- ✅ **Navegação por teclado** (setas + Enter + Esc)
- ✅ **Filtrado para Brasil** (`country: 'br'`)
- ✅ **Respostas em português** (`language: 'pt'`)
- ✅ **Coordenadas automáticas** (latitude/longitude)
- ✅ **Loading indicator**
- ✅ **Botão limpar (X)**
- ✅ **Dark mode** (tema zinc)
- ✅ **Responsive**

## Benefícios

1. **UX Premium**: Usuário digita "Copacabana Palace" → seleciona → preenche tudo automaticamente
2. **Menos erros**: Endereços validados pelo Mapbox
3. **Geocoding grátis**: Coordenadas vêm junto (não gasta quota)
4. **Rápido**: Apenas 3 caracteres para buscar

## Dados Retornados

```typescript
interface AddressSuggestion {
  id: string;
  placeName: string;  // "Av. Atlântica, 1702, Copacabana, Rio de Janeiro"
  address: string;     // "Av. Atlântica, 1702"
  city: string;        // "Rio de Janeiro"
  state: string;       // "RJ"
  coordinates: {
    latitude: number;
    longitude: number;
  };
}
```

## Exemplo Completo (React Hook Form)

```typescript
function VenueStep() {
  const { register, setValue, watch } = useFormContext();

  return (
    <div>
      <label>Endereço do Evento</label>
      <MapboxAutocomplete
        value={watch('venue_address') || ''}
        onChange={(value) => setValue('venue_address', value)}
        onSelect={(suggestion) => {
          // Preencher todos os campos de uma vez
          setValue('venue_address', suggestion.address);
          setValue('venue_city', suggestion.city);
          setValue('venue_state', suggestion.state);
          setValue('latitude', suggestion.coordinates.latitude);
          setValue('longitude', suggestion.coordinates.longitude);

          // Marcar campos como "touched" para validação
          setValue('venue_address', suggestion.address, { shouldValidate: true });
        }}
        placeholder="Ex: Copacabana Palace, Rio de Janeiro"
      />

      {/* Campos cidade/estado podem ficar ocultos ou readonly */}
      <input {...register('venue_city')} readOnly />
      <input {...register('venue_state')} readOnly />
    </div>
  );
}
```

## Próximos Passos (Implementar)

1. ✅ Componente criado
2. ✅ Adicionar no wizard de eventos - **IMPLEMENTADO em 27/10/2025**
3. ⏳ Adicionar no cadastro de profissional
4. ⏳ Adicionar no cadastro de fornecedor
5. ⏳ Testar em produção

## API Limits

- **Mapbox Geocoding**: 100.000 requisições/mês GRÁTIS
- Cada busca = 1 requisição
- Debounce de 300ms reduz requisições
- Cache no browser reduz ainda mais

## Status

✅ **PRONTO PARA USO**

Basta importar e usar onde precisar de autocomplete de endereço!
