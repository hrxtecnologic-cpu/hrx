# Quick Start - HRX Platform

Guia rápido para começar a desenvolver no projeto HRX.

## 1. Configuração Inicial (5 minutos)

### Passo 1: Clonar e instalar dependências

```bash
git clone https://github.com/seu-usuario/hrx.git
cd hrx
npm install
```

### Passo 2: Configurar variáveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env.local
```

### Passo 3: Configurar Clerk (obrigatório para rodar)

1. Acesse [dashboard.clerk.com](https://dashboard.clerk.com)
2. Crie uma nova aplicação
3. Copie as chaves e cole no `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Passo 4: Rodar o projeto

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## 2. Configuração do Supabase (opcional - para uploads)

> ⚠️ **Nota**: O projeto funciona sem Supabase, mas uploads de documentos não estarão disponíveis.

### Passo 1: Criar projeto no Supabase

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Crie um novo projeto
3. Aguarde a criação (2-3 minutos)

### Passo 2: Copiar chaves

Vá em **Settings** → **API** e copie:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Passo 3: Executar migrações

No **SQL Editor** do Supabase, execute:

1. `supabase/migrations/001_users_table.sql`
2. `supabase/migrations/002_professionals_table.sql`
3. `supabase/storage/001_documents_bucket.sql`
4. `supabase/migrations/003_add_portfolio_column.sql`

### Passo 4: Configurar webhook do Clerk

1. No Clerk Dashboard → **Webhooks**
2. Adicione endpoint: `https://seu-dominio.com/api/webhooks/clerk`
3. Subscribe a: `user.created`, `user.updated`, `user.deleted`
4. Copie o **Signing Secret** para `.env.local`:

```env
CLERK_WEBHOOK_SECRET=whsec_...
```

> 💡 **Dica**: Use [ngrok](https://ngrok.com) para testar webhooks localmente

## 3. Estrutura do Projeto

```
hrx/
├── src/
│   ├── app/                    # Pages (App Router)
│   │   ├── api/                # API Routes
│   │   ├── cadastrar/          # Sign Up
│   │   ├── entrar/             # Sign In
│   │   ├── onboarding/         # User Type Selection
│   │   └── cadastro-profissional/  # Professional Form
│   ├── components/             # React Components
│   ├── lib/                    # Utilities
│   │   ├── validations/        # Zod Schemas
│   │   └── supabase/           # Supabase Utils
│   └── middleware.ts           # Auth Middleware
├── supabase/
│   ├── migrations/             # SQL Migrations
│   └── storage/                # Storage Config
└── .env.local                  # Environment Variables
```

## 4. Fluxo de Desenvolvimento

### Criar uma nova funcionalidade:

1. **Criar schema de validação** (se necessário):
   ```typescript
   // src/lib/validations/meu-schema.ts
   import { z } from 'zod';

   export const meuSchema = z.object({
     campo: z.string().min(3),
   });
   ```

2. **Criar componente** (se necessário):
   ```typescript
   // src/components/MeuComponente.tsx
   'use client';

   export function MeuComponente() {
     return <div>Meu Componente</div>;
   }
   ```

3. **Criar página**:
   ```typescript
   // src/app/minha-rota/page.tsx
   export default function MinhaRota() {
     return <div>Minha Rota</div>;
   }
   ```

4. **Criar API route** (se necessário):
   ```typescript
   // src/app/api/minha-api/route.ts
   import { NextResponse } from 'next/server';

   export async function GET() {
     return NextResponse.json({ message: 'OK' });
   }
   ```

## 5. Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Iniciar servidor de desenvolvimento
npm run build            # Build de produção
npm start                # Rodar build de produção
npm run lint             # Verificar código

# Componentes shadcn/ui
npx shadcn@latest add button     # Adicionar componente
npx shadcn@latest add form       # Adicionar form components
```

## 6. Testar Funcionalidades

### Testar autenticação:
1. Acesse `/cadastrar`
2. Crie uma conta
3. Verifique email
4. Faça login em `/entrar`

### Testar onboarding:
1. Após cadastro, você será redirecionado para `/onboarding`
2. Escolha "Profissional" ou "Contratante"
3. Verifique se foi redirecionado corretamente

### Testar formulário profissional:
1. Faça login como profissional
2. Acesse `/cadastro-profissional`
3. Preencha todos os campos
4. Teste upload de documentos (se Supabase estiver configurado)
5. Submeta o formulário

## 7. Troubleshooting

### Erro: "Clerk não configurado"
- Verifique se `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` está no `.env.local`
- Reinicie o servidor de desenvolvimento

### Erro: "Supabase não configurado"
- Isso é normal se você não configurou o Supabase ainda
- O projeto funciona normalmente, mas uploads não estarão disponíveis
- Configure seguindo o **Passo 2** acima

### Erro: "Module not found"
- Rode `npm install` novamente
- Limpe o cache: `rm -rf .next node_modules && npm install`

### Página em branco após login
- Verifique se o middleware está funcionando
- Verifique os logs do console (F12)
- Verifique se as rotas públicas estão corretas no `middleware.ts`

## 8. Recursos Adicionais

- **Documentação completa**: `README.md`
- **Configuração Supabase**: `SUPABASE_STORAGE_SETUP.md`
- **Clerk Docs**: [clerk.com/docs](https://clerk.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **shadcn/ui**: [ui.shadcn.com](https://ui.shadcn.com)

## 9. Próximos Passos

Depois de configurar tudo:

1. ✅ Explore o formulário profissional
2. ✅ Teste o fluxo de autenticação
3. ✅ Configure o Supabase (se precisar de uploads)
4. 📧 Implemente sistema de emails (próximo)
5. 📊 Crie dashboards (futuro)

---

**Precisa de ajuda?** Abra uma issue no GitHub ou consulte a documentação completa.
