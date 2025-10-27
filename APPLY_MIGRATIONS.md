# 🔄 Como Aplicar as Migrations

## Migration Pendente: Raio de Atuação

A migration `020_add_service_radius.sql` adiciona o campo `service_radius_km` na tabela `professionals`.

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o Dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (ícone de código)
4. Clique em **New Query**
5. Copie o conteúdo do arquivo `supabase/migrations/020_add_service_radius.sql`
6. Cole no editor
7. Clique em **Run** (ou pressione Ctrl+Enter)

### Opção 2: Via Supabase CLI

```bash
cd hrx

# Se ainda não inicializou o Supabase localmente
supabase init

# Linkar com o projeto remoto (apenas primeira vez)
supabase link --project-ref SEU_PROJECT_REF

# Aplicar migration
supabase db push

# OU aplicar apenas esta migration específica
supabase migration up --db-url "postgresql://user:pass@host:port/database"
```

### Opção 3: Via psql (PostgreSQL CLI)

```bash
# Conectar ao banco
psql "postgresql://postgres:PASSWORD@HOST:5432/postgres"

# Executar migration
\i supabase/migrations/020_add_service_radius.sql

# Verificar
\d professionals
```

---

## Conteúdo da Migration

```sql
-- Migration: Adiciona raio de atuação para profissionais
-- Criado em: 2025-10-27

ALTER TABLE professionals
ADD COLUMN service_radius_km INTEGER DEFAULT 50
CHECK (service_radius_km >= 5 AND service_radius_km <= 500);

COMMENT ON COLUMN professionals.service_radius_km IS
  'Raio máximo em km que o profissional aceita viajar para eventos (5-500km, padrão: 50km)';

CREATE INDEX idx_professionals_service_radius ON professionals(service_radius_km);
```

---

## Verificar se a Migration foi Aplicada

### Via SQL
```sql
-- Verificar se a coluna existe
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'professionals'
  AND column_name = 'service_radius_km';

-- Verificar se o índice foi criado
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'professionals'
  AND indexname = 'idx_professionals_service_radius';
```

### Via Supabase Dashboard
1. Vá em **Table Editor**
2. Selecione a tabela `professionals`
3. Procure pela coluna `service_radius_km`

---

## Reverter a Migration (se necessário)

```sql
-- Remover índice
DROP INDEX IF EXISTS idx_professionals_service_radius;

-- Remover coluna
ALTER TABLE professionals DROP COLUMN IF EXISTS service_radius_km;
```

---

## Próximos Passos Após Aplicar

1. **Testar o cadastro de profissional**:
   - Acesse `/cadastro-profissional-wizard`
   - Vá até o step de "Experiência e Disponibilidade"
   - Verifique se o componente de Raio de Atuação aparece
   - Complete o cadastro
   - Verifique no banco se o valor foi salvo

2. **Testar o matching**:
   ```bash
   curl -X POST http://localhost:3000/api/mapbox/matching \
     -H "Content-Type: application/json" \
     -d '{
       "latitude": -22.9068,
       "longitude": -43.1729,
       "maxDistanceKm": 50,
       "type": "professional"
     }'
   ```

3. **Atualizar profissionais existentes** (opcional):
   ```sql
   -- Setar raio padrão para profissionais sem valor
   UPDATE professionals
   SET service_radius_km = 50
   WHERE service_radius_km IS NULL;
   ```

---

## Troubleshooting

### Erro: "permission denied"
**Solução**: Use usuário com privilégios de ALTER TABLE (postgres ou service_role)

### Erro: "column already exists"
**Solução**: Migration já foi aplicada. Verificar com:
```sql
SELECT service_radius_km FROM professionals LIMIT 1;
```

### Erro: "constraint violation"
**Solução**: Dados existentes violam o CHECK constraint. Corrigir antes:
```sql
-- Ver valores inválidos
SELECT id, full_name, service_radius_km
FROM professionals
WHERE service_radius_km < 5 OR service_radius_km > 500;
```

---

## Status

- [x] Migration criada
- [ ] Migration aplicada no banco
- [x] Código integrado
- [x] Testes locais

**Após aplicar a migration, marque como concluído!** ✅
