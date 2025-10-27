# 🔐 Configuração do Custom Session Token no Clerk

## ⚠️ AÇÃO OBRIGATÓRIA

Este arquivo contém instruções **ESSENCIAIS** para o funcionamento correto do sistema de autenticação.

---

## 📋 O QUE É SESSION TOKEN CUSTOMIZADO?

O Session Token (JWT) do Clerk armazena informações do usuário que são acessíveis sem fazer chamadas à API. Por padrão, o Clerk inclui apenas informações básicas. Com customização, podemos adicionar `publicMetadata` diretamente no token.

### **Benefícios:**
- ⚡ **Performance:** Evita chamadas à API do Clerk
- 🚀 **Velocidade:** Middleware mais rápido (não busca user completo)
- 💰 **Economia:** Reduz rate limiting
- ✅ **Confiabilidade:** Dados sempre disponíveis no token

---

## 🛠️ PASSO A PASSO DE CONFIGURAÇÃO

### **1. Acesse o Clerk Dashboard**

**Desenvolvimento:**
- URL: https://dashboard.clerk.com/apps/app_2pGD1rC9Z8YrAlr8wDFUzNWGo26/sessions
- Projeto: `hrx-dev` (coherent-muskrat-29.clerk.accounts.dev)

**Produção:**
- URL: https://dashboard.clerk.com
- Domínio: clerk.hrxeventos.com.br

---

### **2. Navegue até Sessions**

1. No painel lateral, clique em **"Sessions"**
2. Role até a seção **"Customize session token"**

---

### **3. Configure o Template JWT**

Cole o seguinte código JSON no editor:

\`\`\`json
{
  "metadata": "{{user.public_metadata}}"
}
\`\`\`

**⚠️ IMPORTANTE:** Use exatamente este formato! Não adicione claims extras sem consultar a documentação sobre o limite de 1.2KB.

---

### **4. Salve as Alterações**

Clique no botão **"Save"** ou **"Apply changes"**

---

### **5. Aguarde a Propagação**

- Novos logins: **imediato**
- Sessões existentes: até a próxima renovação do token (~1 hora)
- Para forçar: peça aos usuários que façam logout/login

---

## 🧪 COMO TESTAR

### **Opção 1: Via Código**

Adicione este código temporário em qualquer página Server Component:

\`\`\`typescript
import { auth } from '@clerk/nextjs/server';

export default async function TestPage() {
  const { sessionClaims } = await auth();

  return (
    <pre>
      {JSON.stringify(sessionClaims?.metadata, null, 2)}
    </pre>
  );
}
\`\`\`

**Resultado esperado:**
\`\`\`json
{
  "userType": "professional",
  "role": "admin",
  "isAdmin": true,
  "onboardingComplete": true
}
\`\`\`

---

### **Opção 2: Via API de Debug**

Acesse: `http://localhost:3000/api/debug-auth`

Deve retornar:
\`\`\`json
{
  "authenticated": true,
  "userId": "user_xxx",
  "sessionClaims": {
    "metadata": {
      "userType": "professional",
      "onboardingComplete": true
    }
  }
}
\`\`\`

---

## ❌ PROBLEMAS COMUNS

### **1. `sessionClaims.metadata` está undefined**

**Causa:** Session token não foi configurado no Clerk Dashboard

**Solução:**
1. Verifique se salvou as mudanças no Dashboard
2. Faça logout e login novamente
3. Limpe cookies do navegador

---

### **2. `sessionClaims.metadata` está vazio `{}`**

**Causa:** O usuário não tem `publicMetadata` definido

**Solução:**
1. Certifique-se de que o onboarding foi completado
2. Verifique no Clerk Dashboard se o user tem metadata
3. Use a API `/api/user/metadata` para atualizar

---

### **3. Erro "Cookie size exceeded"**

**Causa:** Metadata muito grande (limite: 1.2KB)

**Solução:**
- Remova campos desnecessários do metadata
- Armazene dados grandes no seu banco de dados
- Mantenha apenas flags e IDs no metadata

---

## 📊 ESTRUTURA DO METADATA

### **Campos Obrigatórios:**
\`\`\`typescript
{
  userType: 'professional' | 'contractor' | 'supplier';  // Tipo de usuário
  onboardingComplete: boolean;                          // Onboarding finalizado?
}
\`\`\`

### **Campos Opcionais:**
\`\`\`typescript
{
  role: 'admin' | 'user';                               // Permissões
  isAdmin: boolean;                                     // Atalho para verificação
  professionalRegistered: boolean;                      // Cadastro profissional completo?
  supplierRegistered: boolean;                          // Cadastro fornecedor completo?
  onboardingStep: number;                               // Step atual (se incompleto)
}
\`\`\`

---

## 🔒 SEGURANÇA

### **✅ PODE colocar no Session Token:**
- Tipo de usuário (userType)
- Status de onboarding
- Roles/permissões
- Flags booleanas
- IDs de referência

### **❌ NUNCA coloque no Session Token:**
- Senhas ou tokens
- Dados financeiros sensíveis
- Informações pessoais (CPF, RG, etc)
- Dados que mudam frequentemente

**Lembre-se:** O Session Token é enviado no cookie a cada requisição e pode ser decodificado (não é criptografado, apenas assinado).

---

## 📚 DOCUMENTAÇÃO OFICIAL

- [Customize Session Token](https://clerk.com/docs/guides/sessions/customize-session-tokens)
- [Session Token Size Limits](https://clerk.com/docs/guides/sessions/session-tokens#size-limits)
- [Public Metadata](https://clerk.com/docs/guides/users/extending#public-metadata)

---

## 🆘 SUPORTE

Se encontrar problemas:

1. Verifique os logs do console do navegador
2. Verifique os logs do servidor Next.js
3. Consulte a documentação do Clerk
4. Entre em contato com o suporte: support@clerk.com

---

**Última atualização:** 2025-01-21
**Responsável:** Equipe HRX Tech
