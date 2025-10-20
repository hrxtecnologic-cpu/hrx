# HRX - Plataforma de Profissionais para Eventos

Plataforma que conecta profissionais qualificados com organizadores de eventos, centralizando recrutamento, gestão de documentação, conformidade legal e operações completas.

## 🚀 Stack Tecnológica

- **Framework:** Next.js 15 (App Router)
- **Linguagem:** TypeScript
- **Autenticação:** Clerk
- **Banco de Dados:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **Deploy:** Vercel

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no [Clerk](https://clerk.com)
- Conta no [Supabase](https://supabase.com)
- Git

## 🛠️ Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/hrx.git
cd hrx
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# URLs personalizadas do Clerk
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/entrar
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/cadastrar
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## 🔐 Configuração do Clerk

### Passo 1: Criar aplicação no Clerk

1. Acesse [dashboard.clerk.com](https://dashboard.clerk.com)
2. Crie uma nova aplicação
3. Escolha "Next.js" como framework
4. Copie as chaves de API para o `.env.local`

### Passo 2: Configurar localização

No Clerk Dashboard:
1. Vá em **Customization** → **Localization**
2. Selecione **Portuguese (Brazil)** como idioma padrão

### Passo 3: Configurar Webhook (Clerk → Supabase)

1. No Clerk Dashboard, vá em **Webhooks**
2. Clique em **Add Endpoint**
3. Configure:
   - **Endpoint URL:** `https://seu-dominio.com/api/webhooks/clerk`
   - **Subscribe to events:**
     - ✓ `user.created`
     - ✓ `user.updated`
     - ✓ `user.deleted`
4. Copie o **Signing Secret** e adicione ao `.env.local` como `CLERK_WEBHOOK_SECRET`

> **⚠️ Importante:** Para desenvolvimento local, use [ngrok](https://ngrok.com) ou [Hookdeck](https://hookdeck.com) para expor seu localhost.

## 🗄️ Configuração do Supabase

### Passo 1: Criar projeto

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Crie um novo projeto
3. Copie a **Project URL** e **Service Role Key** para o `.env.local`

### Passo 2: Criar tabela de usuários

Execute o seguinte SQL no **SQL Editor** do Supabase:

```sql
-- Tabela de usuários (sincronizada via webhook do Clerk)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url VARCHAR(500),
  user_type VARCHAR(20), -- 'professional' | 'contractor' | null
  status VARCHAR(20) DEFAULT 'active', -- 'active' | 'inactive' | 'deleted'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_users_status ON users(status);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Passo 3: Criar tabela de profissionais

Execute também a migração da tabela de profissionais:

```sql
-- Execute o arquivo: supabase/migrations/002_professionals_table.sql
-- Ou copie e cole no SQL Editor do Supabase
```

O arquivo completo está em `supabase/migrations/002_professionals_table.sql`

### Passo 4: Configurar Supabase Storage

Para habilitar upload de documentos, execute as migrações de storage:

```sql
-- 1. Execute: supabase/storage/001_documents_bucket.sql
-- Cria o bucket professional-documents e políticas RLS

-- 2. Execute: supabase/migrations/003_add_portfolio_column.sql
-- Adiciona coluna de portfólio na tabela professionals
```

**Documentação completa**: Veja `SUPABASE_STORAGE_SETUP.md` para instruções detalhadas sobre configuração de storage.

### Passo 5: Configurar políticas RLS (opcional)

Por padrão, o webhook usa a `SERVICE_ROLE_KEY` que bypassa o RLS. Para produção, configure políticas adequadas.

## 🏃 Executar o projeto

### Modo desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

### Build de produção

```bash
npm run build
npm start
```

## 🎯 Fluxo de Autenticação

### 1. Usuário não autenticado

```
Landing Page (/)
  ↓
  Clica em "SOU PROFISSIONAL" ou "PRECISO CONTRATAR"
  ↓
Página de Cadastro (/cadastrar)
  ↓
  Preenche email/senha + verifica email
  ↓
Onboarding (/onboarding)
```

### 2. Onboarding (seleção de tipo)

```
Página de Onboarding
  ↓
  Escolhe: 👷 Profissional ou 🏢 Contratante
  ↓
  Metadata salva no Clerk (publicMetadata.userType)
  ↓
Redirect:
  - Profissional → /cadastro-profissional ✅
  - Contratante → /dashboard/contratante (futuro)
```

### 3. Webhook em background

```
Clerk dispara evento user.created
  ↓
Webhook recebe em /api/webhooks/clerk
  ↓
Verifica assinatura (Svix)
  ↓
Cria registro na tabela users (Supabase)
  ↓
Retorna 200 OK
```

## 📁 Estrutura de Pastas

```
hrx/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── webhooks/
│   │   │       └── clerk/
│   │   │           └── route.ts       # Webhook Clerk → Supabase
│   │   ├── cadastrar/
│   │   │   └── [[...cadastrar]]/
│   │   │       └── page.tsx           # Página de registro
│   │   ├── entrar/
│   │   │   └── [[...entrar]]/
│   │   │       └── page.tsx           # Página de login
│   │   ├── onboarding/
│   │   │   └── page.tsx               # Seleção de tipo de usuário
│   │   ├── layout.tsx                 # Layout root com ClerkProvider
│   │   └── page.tsx                   # Landing page
│   └── middleware.ts                  # Proteção de rotas
├── .env.local                         # Variáveis de ambiente (NÃO commitar)
├── .env.example                       # Exemplo de variáveis
├── package.json
└── README.md
```

## 🔒 Rotas Protegidas

### Rotas Públicas (não requerem login)

- `/` - Landing page
- `/entrar` - Login
- `/cadastrar` - Registro
- `/sobre`, `/servicos`, `/contato` - Institucionais
- `/termos`, `/privacidade` - Legais

### Rotas Protegidas (requerem login)

- `/onboarding` - Seleção de tipo de usuário
- `/dashboard/*` - Dashboards (futuro)
- `/cadastro-profissional` - Formulário profissional (futuro)
- `/solicitar-equipe` - Formulário contratante (futuro)

### Rotas Admin (requerem role 'admin')

- `/admin/*` - Backoffice (futuro)
- `/backoffice/*` - Gestão (futuro)

## 🎨 Design System

### Cores

- **Preto:** `#000000` - Background principal
- **Cinza 900:** `#1A1A1A` - Cards, containers
- **Cinza 800:** `#2A2A2A` - Inputs, hover states
- **Branco:** `#FFFFFF` - Texto principal
- **Vermelho 600:** `#DC2626` - CTAs, acentos
- **Vermelho 500:** `#EF4444` - Hover states

### Tipografia

- **Font:** Inter (Google Fonts)
- **Headings:** Bold (700)
- **Body:** Regular (400)
- **Buttons:** Semibold (600)

## 🧪 Testes

Para testar o fluxo de autenticação:

1. **Cadastro:**
   - Acesse `/cadastrar`
   - Crie uma conta com email
   - Verifique o email
   - Deve redirecionar para `/onboarding`

2. **Onboarding:**
   - Escolha "Sou Profissional" ou "Preciso Contratar"
   - Verifique que o `userType` foi salvo (Clerk Dashboard → Users → Public Metadata)

3. **Webhook:**
   - Verifique os logs do servidor (`npm run dev`)
   - Deve aparecer: `✅ Usuário criado: email@exemplo.com`
   - Verifique no Supabase se o usuário foi criado na tabela `users`

## ✅ Funcionalidades Implementadas

- [x] Sistema de autenticação completo (Clerk)
- [x] Login/Registro em português
- [x] Onboarding de usuários
- [x] Formulário de cadastro profissional completo
- [x] Validação com Zod + React Hook Form
- [x] Busca automática de endereço por CEP
- [x] Máscaras de input (CPF, telefone, CEP)
- [x] Upload de documentos (Supabase Storage)
- [x] Upload de portfólio de fotos
- [x] Validação de documentos (tamanho, tipo, RLS)
- [x] Sistema de emails (Resend)
- [x] Email de boas-vindas para profissionais
- [x] Notificações por email para admin
- [x] Landing page profissional

## 🚧 Próximos Passos

- [ ] Formulário de solicitação de equipe (contratantes)
- [ ] Dashboard profissional
- [ ] Dashboard contratante
- [ ] Backoffice admin

## 📝 Scripts Disponíveis

```bash
npm run dev       # Desenvolvimento com Turbopack
npm run build     # Build de produção
npm start         # Servidor de produção
npm run lint      # Linter ESLint
```

## 🐛 Troubleshooting

### Webhook não está funcionando

1. Verifique se o `CLERK_WEBHOOK_SECRET` está correto no `.env.local`
2. Verifique os logs do servidor para ver se o webhook está sendo chamado
3. Use uma ferramenta como ngrok para expor localhost em desenvolvimento
4. Verifique no Clerk Dashboard → Webhooks se o endpoint está ativo

### Erro de autenticação

1. Verifique se as chaves do Clerk estão corretas
2. Limpe o cache do navegador e cookies
3. Verifique se o middleware está configurado corretamente

### Usuário não aparece no Supabase

1. Verifique se a tabela `users` foi criada corretamente
2. Verifique se o `SUPABASE_SERVICE_ROLE_KEY` está correto
3. Verifique os logs do webhook para ver erros de inserção

## 📄 Licença

Proprietário - HRX © 2025

## 👥 Contato

- **Email:** contato@hrx.com.br
- **WhatsApp:** (21) 99999-9999

---

Desenvolvido com ❤️ pela equipe HRX
