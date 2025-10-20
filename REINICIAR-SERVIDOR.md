# 🔄 Procedimento de Reinicialização Completa

## ✅ A API FUNCIONA! (testei com curl)

O problema é **cache do navegador/Turbopack**.

---

## 🚀 FAÇA ISSO AGORA (em ordem):

### 1. PARE O SERVIDOR
No terminal onde está rodando `npm run dev`:
- Pressione **Ctrl + C**
- Se não funcionar, feche o terminal completamente

### 2. LIMPE O CACHE DO NAVEGADOR
Escolha UMA opção:

**OPÇÃO A - Aba Anônima (mais fácil):**
- Pressione `Ctrl + Shift + N` (Chrome)
- OU `Ctrl + Shift + P` (Firefox)
- Isso ignora todo cache

**OPÇÃO B - Limpar Cache:**
- Pressione `Ctrl + Shift + Delete`
- Marque "Cached images and files"
- Período: "Last hour" ou "All time"
- Clique em "Clear data"

### 3. REINICIE O SERVIDOR
Abra um NOVO terminal:

```bash
cd C:\Users\erick\HRX_OP\hrx
npm run dev
```

Aguarde a mensagem:
```
✓ Ready in Xms
○ Local: http://localhost:3000
```

### 4. ACESSE NOVAMENTE
- Abra: http://localhost:3000/cadastro-profissional
- Use a **aba anônima** se fez opção A
- OU faça **hard refresh**: `Ctrl + Shift + R`

### 5. TESTE O CADASTRO
Use dados do arquivo `test-professional-registration.md`

---

## 🔍 COMO VERIFICAR SE FUNCIONOU

### No Terminal (logs do servidor):
Procure por:
```
✅ Profissional cadastrado: [email]
✅ Email de boas-vindas enviado para: [email]
✅ Notificação enviada para admin
```

### No Console do Navegador (F12):
- **NÃO** deve ter erro 404 em `/api/professionals`
- Pode ter erro 401 se não estiver logado (normal)

### No Supabase:
- Table `professionals` deve ter novo registro
- Storage `professional-documents` deve ter arquivos

---

## ⚠️ SE AINDA DER ERRO 404

### Verifique no terminal se o servidor está REALMENTE rodando:
```bash
curl http://localhost:3000/api/professionals
```

**Resposta esperada:**
```json
{"error":"Não autenticado"}
```

Se retornar isso, a API FUNCIONA! É cache do navegador.

### Último recurso - Reinício agressivo:

```bash
# Parar tudo
taskkill /F /IM node.exe 2>nul

# Limpar tudo
cd C:\Users\erick\HRX_OP\hrx
rm -rf .next .turbo node_modules/.cache

# Reiniciar
npm run dev
```

---

## 📝 Checklist

Antes de testar, verifique:

- [ ] Servidor parado completamente
- [ ] Cache do navegador limpo OU usando aba anônima
- [ ] Servidor reiniciado (npm run dev)
- [ ] Aguardou "Ready" aparecer
- [ ] Usuário logado no Clerk
- [ ] Usuário tem userType=professional no Clerk
- [ ] SQL fix-rls-simple.sql foi executado no Supabase

---

## 🎯 Por que isso acontece?

O **Turbopack** (novo bundler do Next.js 15) às vezes não invalida cache corretamente quando:
- Alteramos validações (Zod schemas)
- Modificamos API routes
- Mudamos variáveis de ambiente

A solução é **sempre reiniciar servidor + limpar cache do navegador** após mudanças grandes.

---

## ✅ Teste Rápido da API (via terminal):

```bash
# Teste 1: Verificar se API responde
curl http://localhost:3000/api/professionals

# Teste 2: Verificar se upload responde
curl http://localhost:3000/api/upload

# Ambos devem retornar erro de autenticação (é esperado)
```

---

**IMPORTANTE:** Use **aba anônima** para testar. Isso evita 99% dos problemas de cache!
