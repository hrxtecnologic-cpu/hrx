# 🔐 Guia de 2FA (Two-Factor Authentication) para Administradores

## O que é 2FA?

Two-Factor Authentication (2FA) adiciona uma **segunda camada de segurança** além da senha:
1. **Algo que você sabe**: Senha
2. **Algo que você tem**: Código do celular (app autenticador)

---

## ⚠️ Por que Admins precisam de 2FA?

Admins têm acesso a:
- ✅ Aprovação de profissionais
- ✅ Dados sensíveis (documentos, CPF, endereços)
- ✅ Mudança de roles de usuários
- ✅ Configurações do sistema

**Sem 2FA**, uma senha vazada = **acesso total ao sistema**.

---

## 📱 Como Habilitar 2FA (via Clerk)

### Opção 1: Forçar 2FA para Todos os Admins (Recomendado)

#### 1. Configurar no Clerk Dashboard

1. Acesse https://dashboard.clerk.com
2. Vá em **User & Authentication** → **Multi-factor**
3. Habilite **Multi-factor authentication**
4. Escolha métodos:
   - ✅ **TOTP (Authenticator App)** - Recomendado (Google Authenticator, Authy)
   - ✅ **SMS** - Alternativa (menos seguro)
   - ❌ **Backup codes** - Para recuperação

5. Em **Enforcement**, selecione:
   - **Required for all users** (força para todos)
   - OU **Optional** e force via código (próximo passo)

#### 2. Forçar 2FA apenas para Admins (via código)

No código, verificar se admin tem 2FA habilitado:

```typescript
// src/lib/auth.ts
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function requireAdmin2FA() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Not authenticated');
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  // Verificar se é admin
  const isAdmin = user.publicMetadata?.role === 'admin';

  if (isAdmin) {
    // Verificar se 2FA está habilitado
    const has2FA = user.twoFactorEnabled;

    if (!has2FA) {
      throw new Error('Admins must enable 2FA');
    }
  }

  return { user, isAdmin };
}
```

Usar em páginas admin:

```typescript
// src/app/admin/layout.tsx
export default async function AdminLayout() {
  try {
    await requireAdmin2FA();
  } catch (error) {
    redirect('/admin/enable-2fa');
  }

  return <>{children}</>;
}
```

---

## 🛠️ Implementação: Página de Habilitação de 2FA

### Criar `src/app/admin/enable-2fa/page.tsx`

```typescript
'use client';

import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Smartphone, AlertCircle } from 'lucide-react';

export default function Enable2FAPage() {
  const { user } = useUser();

  const enable2FA = async () => {
    // Clerk abre modal de configuração de 2FA
    await user?.createTOTP();
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="max-w-2xl bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <Shield className="h-8 w-8 text-red-600" />
            2FA Obrigatório para Administradores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Alerta */}
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <h3 className="text-yellow-500 font-semibold mb-1">Ação Necessária</h3>
              <p className="text-zinc-300 text-sm">
                Para acessar o painel de administração, você precisa habilitar a autenticação de dois fatores (2FA).
              </p>
            </div>
          </div>

          {/* Explicação */}
          <div>
            <h3 className="text-white font-semibold mb-2">O que é 2FA?</h3>
            <p className="text-zinc-400 text-sm mb-4">
              Two-Factor Authentication (2FA) adiciona uma camada extra de segurança à sua conta.
              Além da senha, você precisará de um código gerado no seu celular.
            </p>
          </div>

          {/* Como funciona */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold">Como funciona:</h3>

            <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg">
              <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">1</div>
              <div>
                <p className="text-white font-medium">Instale um app autenticador</p>
                <p className="text-zinc-400 text-sm">Google Authenticator, Authy ou Microsoft Authenticator</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg">
              <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">2</div>
              <div>
                <p className="text-white font-medium">Escaneie o QR Code</p>
                <p className="text-zinc-400 text-sm">Use o app para escanear o código que aparecerá</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg">
              <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">3</div>
              <div>
                <p className="text-white font-medium">Digite o código de 6 dígitos</p>
                <p className="text-zinc-400 text-sm">Confirme com o código gerado no app</p>
              </div>
            </div>
          </div>

          {/* Apps Recomendados */}
          <div>
            <h3 className="text-white font-semibold mb-3">Apps Recomendados:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <a
                href="https://support.google.com/accounts/answer/1066447"
                target="_blank"
                className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition text-center"
              >
                <Smartphone className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-white text-sm font-medium">Google Authenticator</p>
                <p className="text-zinc-500 text-xs">iOS / Android</p>
              </a>

              <a
                href="https://authy.com/download/"
                target="_blank"
                className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition text-center"
              >
                <Smartphone className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-white text-sm font-medium">Authy</p>
                <p className="text-zinc-500 text-xs">iOS / Android / Desktop</p>
              </a>

              <a
                href="https://www.microsoft.com/en-us/security/mobile-authenticator-app"
                target="_blank"
                className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition text-center"
              >
                <Smartphone className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-white text-sm font-medium">Microsoft Authenticator</p>
                <p className="text-zinc-500 text-xs">iOS / Android</p>
              </a>
            </div>
          </div>

          {/* Botão de Ação */}
          <div className="pt-4">
            <Button
              onClick={enable2FA}
              className="w-full bg-red-600 hover:bg-red-500 text-white h-12 text-base"
            >
              <Shield className="h-5 w-5 mr-2" />
              Habilitar 2FA Agora
            </Button>
            <p className="text-center text-zinc-500 text-xs mt-3">
              Leva menos de 2 minutos
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🔄 Fluxo de Login com 2FA

### Como funciona na prática:

1. Admin acessa `/admin`
2. Sistema verifica se tem 2FA habilitado
3. **SEM 2FA**: Redireciona para `/admin/enable-2fa`
4. **COM 2FA**: Pede senha → Pede código do app → Acessa dashboard

---

## 📋 Checklist de Implementação

### Fase 1: Configuração (Hoje)
- [ ] Habilitar 2FA no Clerk Dashboard
- [ ] Configurar métodos (TOTP recomendado)
- [ ] Testar 2FA com sua própria conta

### Fase 2: Enforcement (Próxima Semana)
- [ ] Criar função `requireAdmin2FA()`
- [ ] Criar página `/admin/enable-2fa`
- [ ] Adicionar verificação no `AdminLayout`
- [ ] Testar com conta sem 2FA

### Fase 3: Comunicação (Antes de Forçar)
- [ ] Avisar todos os admins por email
- [ ] Dar prazo de 7 dias para habilitar
- [ ] Enviar tutorial em vídeo (opcional)
- [ ] Ativar enforcement

---

## 🆘 Recuperação de Acesso (Se Admin perder 2FA)

### Opção 1: Backup Codes (Recomendado)

Ao habilitar 2FA, o Clerk gera **10 códigos de backup**:
- Admin deve salvar em local seguro
- Cada código funciona apenas 1 vez
- Pode ser usado se perder o celular

### Opção 2: Reset Manual (Último Recurso)

Se admin perder acesso E códigos de backup:

1. Outro admin acessa Clerk Dashboard
2. Vai em **Users** → Encontra o admin
3. Clica em **Actions** → **Disable multi-factor**
4. Admin deve re-habilitar 2FA imediatamente

⚠️ **IMPORTANTE**: Log este evento de segurança!

```typescript
logger.security('2FA desabilitado manualmente', {
  targetUserId: 'user_abc',
  disabledBy: 'admin_xyz',
  reason: 'Perda de dispositivo',
});
```

---

## 📊 Monitoramento de 2FA

### Métricas para acompanhar:

```typescript
// Contar admins com/sem 2FA
const admins = await clerkClient.users.getUserList({
  limit: 500,
});

const adminsWithRole = admins.filter(u => u.publicMetadata?.role === 'admin');
const adminsWidth2FA = adminsWithRole.filter(u => u.twoFactorEnabled);

console.log(`Admins com 2FA: ${adminsWidth2FA.length}/${adminsWithRole.length}`);
```

### Dashboard Recomendado:

- Total de admins
- % com 2FA habilitado
- Admins sem 2FA (lista)
- Tentativas de login com 2FA
- Falhas de 2FA (possível ataque)

---

## ⚡ Testes de Segurança

### Testar bloqueio sem 2FA

1. Criar conta de teste com role `admin`
2. NÃO habilitar 2FA
3. Tentar acessar `/admin`
4. **Esperado**: Deve redirecionar para `/admin/enable-2fa`

### Testar login com 2FA

1. Habilitar 2FA na sua conta
2. Fazer logout
3. Fazer login novamente
4. **Esperado**: Deve pedir senha + código do app

---

## 💡 Dicas de Segurança

✅ **Faça**:
- Use Authy (faz backup na nuvem)
- Salve códigos de backup
- Use 2FA em contas pessoais (treinar)
- Teste regularmente

❌ **Não Faça**:
- Compartilhar códigos de backup
- Usar SMS como método principal
- Desabilitar 2FA "temporariamente"
- Tirar screenshot do QR code

---

## 🔗 Recursos Adicionais

- [Clerk 2FA Docs](https://clerk.com/docs/authentication/configuration/sign-up-sign-in-options#multi-factor-authentication)
- [Google Authenticator](https://support.google.com/accounts/answer/1066447)
- [Authy](https://authy.com)
- [OWASP 2FA Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html)

---

**Última atualização**: {{ DATA_DO_COMMIT }}
**Responsável**: Equipe HRX Eventos
