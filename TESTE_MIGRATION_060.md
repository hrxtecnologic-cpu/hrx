# 🧪 TESTE: Migration 060 foi executada?

## Como verificar:

1. Acesse: https://waplbfawlcavwtvfwprf.supabase.co
2. Vá em **Database** → **Tables**
3. Clique na tabela **`users`**
4. Vá em **Columns** (ou **Structure**)
5. Procure a coluna **`is_admin`**

---

## ✅ Se a coluna `is_admin` EXISTE:

Significa que a migration foi executada. O erro 500 é outra coisa.

---

## ❌ Se a coluna `is_admin` NÃO EXISTE:

**É por isso que está dando erro 500!**

Execute AGORA:

1. **SQL Editor** → **New Query**
2. Cole isso:

```sql
-- Adicionar coluna is_admin
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- Marcar seus emails como admin
UPDATE users
SET is_admin = true
WHERE email IN ('hrxtecnologic@gmail.com', 'simulaioab@gmail.com');

-- Verificar
SELECT email, is_admin FROM users WHERE is_admin = true;
```

3. Clique em **Run**

---

## ✅ Depois de executar:

- Recarregue a página do app
- Tente criar o curso novamente
- Deve funcionar!

---

**Me confirma se a coluna `is_admin` existe ou não!**
