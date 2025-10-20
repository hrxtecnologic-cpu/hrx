# Setup do Banco de Dados - HRX System

## 🎯 Passo a Passo para Configurar o Supabase

### 1. Acessar o SQL Editor do Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione seu projeto HRX
4. No menu lateral, clique em **SQL Editor** (ícone de código)

### 2. Executar o Script de Correção/Criação de Tabelas

**IMPORTANTE:** Use o script `002_fix_existing_tables.sql` que atualiza tabelas existentes e cria as novas.

1. No SQL Editor, clique em **New Query**
2. Abra o arquivo `supabase/migrations/002_fix_existing_tables.sql`
3. Copie **TODO o conteúdo** do arquivo
4. Cole no SQL Editor do Supabase
5. Clique em **RUN** (ou pressione Ctrl+Enter)

**Este script é inteligente e:**
- ✅ Adiciona colunas faltantes em tabelas existentes
- ✅ Cria novas tabelas que não existem
- ✅ Não quebra dados existentes
- ✅ Insere categorias e tipos de evento padrão

### 3. Verificar se as Tabelas Foram Criadas

Após executar o script, você deve ver a mensagem "Success. No rows returned".

Para verificar, execute este comando:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Você deve ver estas tabelas:
- ✅ categories
- ✅ contractor_requests
- ✅ event_allocations
- ✅ event_types
- ✅ notifications
- ✅ professionals
- ✅ users

### 4. Verificar Dados Padrão

Para verificar se as categorias e tipos de evento foram inseridos:

```sql
-- Ver categorias
SELECT * FROM categories ORDER BY name;

-- Ver tipos de evento
SELECT * FROM event_types ORDER BY name;
```

Você deve ver:
- **15 categorias** de profissionais
- **15 tipos de evento**

## 🔒 Configurar Row Level Security (RLS) - OPCIONAL

Por padrão, o RLS está **desabilitado** para facilitar o desenvolvimento.

Se quiser habilitar segurança posteriormente:

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Criar políticas básicas (exemplo para admins)
CREATE POLICY "Admin tem acesso total" ON professionals
  FOR ALL USING (true);
```

## ✅ Pronto!

Depois de executar o script, seu sistema estará pronto para:

1. ✅ Cadastrar profissionais via `/cadastro-profissional`
2. ✅ Receber solicitações via `/solicitar-equipe`
3. ✅ Gerenciar tudo no admin em `/admin`
4. ✅ Alocar profissionais aos eventos
5. ✅ Enviar notificações automáticas

## 🐛 Solução de Problemas

### Erro: "relation already exists"
- **Solução**: Algumas tabelas já existem. Você pode:
  - Ignorar o erro (não afeta o funcionamento)
  - OU deletar as tabelas existentes primeiro (CUIDADO: perde dados)

### Erro: "permission denied"
- **Solução**: Verifique se você está logado como proprietário do projeto

### Erro: "syntax error"
- **Solução**: Certifique-se de copiar TODO o conteúdo do arquivo SQL

## 📊 Próximos Passos

1. Testar cadastro de profissional
2. Testar solicitação de equipe
3. Acessar o admin e aprovar cadastros
4. Alocar profissionais aos eventos
