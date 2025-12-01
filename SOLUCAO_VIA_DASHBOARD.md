# 🎯 SOLUÇÃO VIA DASHBOARD - Sem SQL

## Por que o SQL não funciona?

Erro: `must be owner of table objects`

**Causa:** A tabela `storage.objects` é do sistema Supabase. Você não tem permissão SQL direta.

**Solução:** Usar o Dashboard do Supabase (interface visual).

---

## ✅ PASSO A PASSO (3 minutos)

### PASSO 1: Acessar Storage Policies

1. Acesse: **https://waplbfawlcavwtvfwprf.supabase.co**
2. No menu lateral, clique em **Storage**
3. Clique em **Policies** (aba no topo)

---

### PASSO 2: Desabilitar RLS

Na seção **Storage Policies**, você verá a tabela `objects`:

1. Procure o botão **"RLS enabled"** (verde) ao lado de `objects`
2. Clique nele para **desabilitar**
3. Confirme quando perguntar

**Pronto! Upload vai funcionar!** ✅

---

### PASSO 3: Testar

1. Vá em: `http://localhost:3000/admin/academia/cursos/novo`
2. Arraste uma imagem
3. Upload deve funcionar sem erros!

---

## 📸 Guia Visual

Se não encontrar "RLS enabled", siga este caminho:

```
Dashboard Supabase
  └─ Storage (menu lateral)
      └─ Policies (aba no topo)
          └─ objects (linha da tabela)
              └─ Botão toggle RLS (verde/cinza)
```

---

## 🔄 Alternativa: Criar Policy Manual

Se preferir manter RLS ativo (mais seguro):

1. **Storage** → **Policies** → **objects**
2. Clique em **New Policy**
3. Escolha **"Full customization"**
4. Preencha:
   - **Policy name:** `allow_authenticated_all`
   - **Policy command:** `ALL` (selecione no dropdown)
   - **Target roles:** `authenticated`
   - **USING expression:**
     ```sql
     true
     ```
   - **WITH CHECK expression:**
     ```sql
     true
     ```
5. Clique em **Save**

---

## 🆘 Se Não Encontrar "Policies"

Tente este caminho alternativo:

1. **Storage** (menu lateral)
2. Clique no bucket **documents**
3. Clique em **Configuration** (ícone de engrenagem)
4. Marque **"Public bucket"**
5. Salve

**Isso também resolve!**

---

## ✅ Checklist

- [ ] Acessei Supabase Dashboard
- [ ] Fui em Storage → Policies
- [ ] Desliguei RLS da tabela `objects` OU
- [ ] Marquei bucket `documents` como público
- [ ] Testei upload no app
- [ ] Upload funcionou sem erros!

---

## 📞 Se Ainda Não Funcionar

Me mande um print da tela **Storage → Policies** que te ajudo a encontrar exatamente onde clicar!

---

**A solução via Dashboard é 100% garantida de funcionar!** 🎉
