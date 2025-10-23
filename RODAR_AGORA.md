# 🚀 RODAR AGORA - Sistema de Sugestões Inteligentes

## ✅ O QUE FOI FEITO

### 1. **Seed Script Melhorado** ✅
- **8 fornecedores** com MUITOS equipamentos cada (150+ tipos diferentes!)
- **5 profissionais** com categorias que combinam perfeitamente
- **2 projetos** (SEED-001 Conferência Tech, SEED-002 Casamento)
- Equipamentos solicitados nos projetos COMBINAM com fornecedores
- Profissionais solicitados COMBINAM com disponíveis
- Todos em São Paulo com mesmo email: `erickrussomat@gmail.com`

### 2. **Sistema de Sugestões de Fornecedores** ✅
- Função SQL `get_suggested_suppliers()` criada
- API `/api/admin/event-projects/[id]/suggested-suppliers` criada
- Scoring inteligente:
  - **40%** distância (mais importante que profissionais pois tem frete!)
  - **50%** match de equipamentos
  - **10%** performance/avaliações

### 3. **Tab Persistence** ✅
- Componente `ProjectTabsManager` integrado
- Ao deletar membro da equipe, permanece na aba "Equipe"
- Funciona com URL params (`?tab=team`)

## 🔥 PASSOS PARA RODAR

### **PASSO 1: Rodar Migration no Supabase**

1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Abra o arquivo: `C:\Users\erick\HRX_OP\hrx\supabase\migrations\025_supplier_suggestions.sql`
4. Cole TODO o conteúdo no SQL Editor
5. Clique em **RUN**
6. ✅ Deve aparecer "Success. No rows returned"

### **PASSO 2: Rodar o Seed Script**

```bash
npm run seed
```

Isso vai:
- Criar 5 profissionais em SP
- Criar 8 fornecedores em SP (com MUITOS equipamentos!)
- Criar 2 projetos de teste
- Geocodificar TUDO automaticamente

**AGUARDE**: Geocodificação pode levar 30-60 segundos.

### **PASSO 3: Testar o Fluxo**

1. **Login**: Entre com `erickrussomat@gmail.com`

2. **Testar Sugestões de Profissionais**:
   - Vá em `/admin/projetos`
   - Clique em **SEED-001** (Conferência Tech)
   - Vá na aba **"Equipe"**
   - Sub-aba **"Sugestões"** deve mostrar profissionais com SCORE
   - ✅ Deve aparecer Carlos (Fotografia/Videomaker) com score alto
   - ✅ Deve aparecer João (Segurança/Recepção) com score alto

3. **Testar Sugestões de Fornecedores**:
   - Ainda no SEED-001
   - Vá na aba **"Equipamentos"**
   - Clique em "Solicitar Cotação" em qualquer equipamento
   - ✅ Deve mostrar fornecedores relevantes (ex: Som = SP Som & Luz)
   - ✅ Fornecedores devem ter SCORE e distância

4. **Testar Tab Persistence**:
   - Na aba "Equipe", adicione um profissional
   - Delete ele
   - ✅ Deve PERMANECER na aba "Equipe" (não voltar para "Informações")

## 🐛 SE DER ERRO

### Erro: "function get_suggested_suppliers does not exist"
**Solução**: Rode a migration 025_supplier_suggestions.sql no Supabase

### Erro: "Projeto não possui localização definida"
**Solução**:
- O geocoding falhou
- Vá em `/admin/projetos/SEED-001`
- Verifique se tem latitude/longitude
- Se não tiver, rode manualmente a geocodificação

### Sugestões aparecem vazias
**Possíveis causas**:
1. Profissionais/Fornecedores não foram geocodificados
2. Projeto não foi geocodificado
3. Distância muito restritiva (mas agora é 999999km!)

**Como verificar**:
```sql
-- No Supabase SQL Editor
SELECT * FROM get_geocoding_stats();
```

Deve mostrar 100% de profissionais, fornecedores e eventos com coordenadas.

## 📊 RESULTADOS ESPERADOS

### Projeto SEED-001 (Conferência Tech)
**Profissionais Sugeridos**:
- Carlos Silva (Fotografia, Videomaker) - Score alto (~75-85)
- João Oliveira (Segurança, Recepção) - Score alto (~70-80)
- Pedro Almeida (Som, Audiovisual) - Score médio (~50-60)

**Fornecedores Sugeridos**:
- Para "Som": **SP Som & Luz** - Score altíssimo (~90+)
- Para "Iluminação": **SP Som & Luz** - Score altíssimo (~90+)
- Para "Audiovisual": **Tech AV Soluções** - Score altíssimo (~90+)
- Para "Palco": **Mega Tendas** - Score alto (~80+)
- Para "Ar Condicionado": **Clima Conforto** - Score alto (~80+)

### Projeto SEED-002 (Casamento)
**Profissionais Sugeridos**:
- Carlos Silva (Fotografia) - Score alto
- Maria Santos (DJ, Iluminação) - Score altíssimo (~90+)
- Ana Costa (Garçom, Barman) - Score altíssimo (~90+)

**Fornecedores Sugeridos**:
- Para "Buffet": **Buffet Gourmet SP** - Score altíssimo (~90+)
- Para "Decoração": **Móveis & Decoração** - Score altíssimo (~90+)
- Para "Flores": **Móveis & Decoração** - Score alto (~80+)
- Para "Tendas": **Mega Tendas** - Score altíssimo (~90+)

## 🎯 PRÓXIMOS PASSOS (SE TUDO FUNCIONAR)

1. **Testar convites**: Enviar convites para profissionais
2. **Testar cotações**: Solicitar cotações de fornecedores
3. **Ver notificações**: Verificar se chegam emails
4. **Montar equipe**: Adicionar profissionais ao projeto
5. **Enviar proposta**: Gerar e enviar proposta para cliente

## 📝 CHECKLIST

- [ ] Migration 025 rodada no Supabase
- [ ] Seed script executado (`npm run seed`)
- [ ] Geocodificação completada (aguardar 1 minuto)
- [ ] Login com erickrussomat@gmail.com
- [ ] SEED-001 acessível
- [ ] Aba "Equipe" > "Sugestões" mostrando profissionais
- [ ] Scores aparecem nos cards
- [ ] Aba "Equipamentos" mostrando lista
- [ ] "Solicitar Cotação" abre modal com fornecedores
- [ ] Fornecedores têm scores e badges
- [ ] Tab persistence funciona (deletar membro mantém na aba)

## 🔍 DEBUG

Para ver os dados no banco:

```sql
-- Ver profissionais criados
SELECT full_name, categories, city, latitude, longitude
FROM professionals
WHERE email = 'erickrussomat@gmail.com';

-- Ver fornecedores criados
SELECT company_name, equipment_types, city, latitude, longitude
FROM equipment_suppliers
WHERE email = 'erickrussomat@gmail.com';

-- Ver projetos criados
SELECT project_number, event_name, venue_city, latitude, longitude
FROM event_projects
WHERE project_number LIKE 'SEED%';

-- Testar sugestões de profissionais
SELECT full_name, city, total_score, distance_km
FROM get_suggested_professionals(
    -23.5505,  -- Lat de SP
    -46.6333,  -- Lon de SP
    '2025-11-15'::DATE,
    ARRAY['Fotografia', 'Videomaker'],
    999999,
    0,
    100
);

-- Testar sugestões de fornecedores
SELECT company_name, city, total_score, distance_km, equipment_types
FROM get_suggested_suppliers(
    -23.5505,  -- Lat de SP
    -46.6333,  -- Lon de SP
    ARRAY['Som', 'Iluminação'],
    999999,
    0,
    100
);
```

---

**TUDO PRONTO!** 🎉

Rode a migration, depois `npm run seed`, e veja a mágica acontecer! ✨
