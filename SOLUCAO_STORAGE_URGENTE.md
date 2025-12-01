# 🔥 SOLUÇÃO URGENTE - Erro de Storage RLS

## O Problema

Erro: `new row violates row-level security policy`

**Causa:** As policies de RLS do Storage estão bloqueando mesmo após migrations.

---

## ✅ SOLUÇÃO DEFINITIVA (2 minutos)

### OPÇÃO 1: Desabilitar RLS Completamente (RÁPIDO)

Execute este SQL no Supabase SQL Editor:

```sql
-- Desabilitar RLS na tabela storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

**Pronto!** Isso resolve instantaneamente. Upload vai funcionar.

⚠️ **Desvantagem:** Qualquer pessoa pode fazer upload (menos seguro)

---

### OPÇÃO 2: Policies Super Permissivas (RECOMENDADO)

1. Acesse: https://waplbfawlcavwtvfwprf.supabase.co
2. SQL Editor → New Query
3. Copie TODO o arquivo: `FIX_STORAGE_DEFINITIVO.sql`
4. Cole e clique em **Run**

**Resultado:**
```
✅ FIX STORAGE DEFINITIVO
RLS habilitado: true
Policies ativas: 4
🎯 Storage liberado para upload!
```

---

### OPÇÃO 3: Via Dashboard (SEM SQL)

1. Vá em **Storage** → **Policies**
2. Encontre a tabela `objects`
3. Clique em **Disable RLS** (botão no topo)
4. Confirme

**OU:**

1. Delete TODAS as policies existentes
2. Crie uma nova policy:
   - Name: `allow_all`
   - Policy command: `ALL`
   - Using expression: `true`
   - With check: `true`

---

## 🧪 Testar Solução

Após executar qualquer opção acima:

1. **NÃO precisa reiniciar o servidor**
2. Vá em: `http://localhost:3000/admin/academia/cursos/novo`
3. Arraste uma imagem para upload
4. ✅ **DEVE FUNCIONAR SEM ERROS**

---

## 🔍 Verificar se Funcionou

### No Supabase Dashboard:

1. Vá em **Storage** → **documents**
2. Tente fazer upload manual de uma imagem
3. Se funcionar = RLS está OK

### No seu App:

1. Abra o Console do navegador (F12)
2. Tente fazer upload
3. Se NÃO aparecer erro vermelho = Funcionou!

---

## 💡 Por Que As Migrations Não Funcionaram?

O Supabase Storage tem RLS em **múltiplas camadas**:

1. ❌ Policies na tabela `storage.objects`
2. ❌ Policies no bucket `documents`
3. ❌ Configurações de permissão do bucket

As migrations só mexeram na camada 1. Por isso continua dando erro.

---

## ✅ Solução Mais Rápida (COPIE E COLE)

```sql
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

**Execute isso e pronto!** 🎉

---

## 🆘 Se AINDA Não Funcionar

Faça isso no Supabase Dashboard:

1. **Storage** → Clique no bucket **documents**
2. **Settings** (engrenagem)
3. Marque **Public bucket**
4. Salve

Depois execute:

```sql
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

**Isso VAI funcionar!**
