# 🎨 Customização Visual dos Componentes Clerk

## 📋 VISÃO GERAL

Este documento contém instruções para customizar a aparência dos componentes de autenticação do Clerk (SignIn, SignUp, UserButton, etc.) para combinar com o design da HRX.

---

## 🎨 CORES DA HRX

\`\`\`css
/* Cores principais */
--hrx-red: #DC2626;        /* red-600 */
--hrx-red-hover: #EF4444;  /* red-500 */
--hrx-red-dark: #B91C1C;   /* red-700 */

/* Background */
--hrx-bg-black: #000000;
--hrx-bg-zinc-950: #09090b;
--hrx-bg-zinc-900: #18181b;

/* Borders */
--hrx-border-zinc-800: #27272a;
--hrx-border-zinc-700: #3f3f46;

/* Text */
--hrx-text-white: #ffffff;
--hrx-text-zinc-400: #a1a1aa;
--hrx-text-zinc-500: #71717a;
\`\`\`

---

## 🛠️ MÉTODO 1: Customização via `appearance` Prop

### **1. Atualizar componentes SignIn e SignUp**

**Arquivo:** `src/app/entrar/[[...entrar]]/page.tsx`

\`\`\`typescript
import { SignIn } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <SignIn
        appearance={{
          baseTheme: undefined, // Remove tema padrão
          variables: {
            colorPrimary: '#DC2626',        // HRX Red
            colorDanger: '#EF4444',
            colorSuccess: '#22C55E',
            colorWarning: '#F59E0B',

            // Background
            colorBackground: '#09090b',     // zinc-950
            colorInputBackground: '#18181b', // zinc-900

            // Text
            colorText: '#ffffff',
            colorTextSecondary: '#a1a1aa',  // zinc-400

            // Borders
            borderRadius: '0.5rem',         // rounded-lg
            colorInputText: '#ffffff',
          },
          elements: {
            // Container principal
            card: 'bg-zinc-900 border border-zinc-800 shadow-2xl',

            // Header
            headerTitle: 'text-white text-2xl font-bold',
            headerSubtitle: 'text-zinc-400',

            // Form
            formButtonPrimary:
              'bg-red-600 hover:bg-red-500 text-white font-semibold transition-all',

            // Inputs
            formFieldInput:
              'bg-zinc-800 border-zinc-700 text-white focus:border-red-600',
            formFieldLabel: 'text-zinc-300',

            // Links
            footerActionLink: 'text-red-600 hover:text-red-500',

            // Social buttons
            socialButtonsBlockButton:
              'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white',

            // Divider
            dividerLine: 'bg-zinc-800',
            dividerText: 'text-zinc-500',

            // Footer
            footer: 'hidden', // Esconde "Secured by Clerk"
          },
        }}
      />
    </div>
  );
}
\`\`\`

---

### **2. Atualizar UserButton (Header)**

Para o botão de usuário no header:

\`\`\`typescript
import { UserButton } from '@clerk/nextjs';

<UserButton
  appearance={{
    elements: {
      avatarBox: 'w-10 h-10 border-2 border-red-600',
      userButtonPopoverCard: 'bg-zinc-900 border border-zinc-800',
      userButtonPopoverActionButton:
        'text-white hover:bg-zinc-800',
      userButtonPopoverActionButtonText: 'text-white',
      userButtonPopoverFooter: 'hidden',
    },
  }}
/>
\`\`\`

---

## 🛠️ MÉTODO 2: Customização Global

### **Criar arquivo de configuração global**

**Arquivo:** `src/app/layout.tsx`

\`\`\`typescript
import { ClerkProvider } from '@clerk/nextjs';
import { ptBR } from '@clerk/localizations';

const clerkAppearance = {
  variables: {
    colorPrimary: '#DC2626',
    colorBackground: '#09090b',
    colorInputBackground: '#18181b',
    colorText: '#ffffff',
    colorTextSecondary: '#a1a1aa',
    borderRadius: '0.5rem',
  },
  elements: {
    card: 'bg-zinc-900 border border-zinc-800',
    formButtonPrimary: 'bg-red-600 hover:bg-red-500',
    formFieldInput: 'bg-zinc-800 border-zinc-700 text-white',
    footer: 'hidden',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      localization={ptBR}
      appearance={clerkAppearance}
    >
      <html lang="pt-BR">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
\`\`\`

---

## 🌍 LOCALIZAÇÃO (Português)

### **Instalar pacote de localização**

\`\`\`bash
npm install @clerk/localizations
\`\`\`

### **Aplicar localização**

\`\`\`typescript
import { ClerkProvider } from '@clerk/nextjs';
import { ptBR } from '@clerk/localizations';

<ClerkProvider localization={ptBR}>
  {children}
</ClerkProvider>
\`\`\`

---

## 🎭 TEMAS PRÉ-DEFINIDOS

O Clerk oferece temas base que podem ser customizados:

\`\`\`typescript
import { dark } from '@clerk/themes';

<SignIn
  appearance={{
    baseTheme: dark, // ou 'light', 'neobrutalism', 'shadesOfPurple'
    variables: {
      // Suas customizações aqui
    }
  }}
/>
\`\`\`

**Temas disponíveis:**
- `dark` - Tema escuro padrão
- `light` - Tema claro padrão
- `neobrutalism` - Estilo neobrutalist
- `shadesOfPurple` - Tons de roxo

---

## 📱 CUSTOMIZAÇÃO RESPONSIVA

\`\`\`typescript
appearance={{
  elements: {
    card: 'w-full max-w-md mx-auto',
    formButtonPrimary: 'w-full py-3',
    socialButtonsBlockButton: 'w-full',
  },
}}
\`\`\`

---

## 🔧 CLASSES DISPONÍVEIS PARA CUSTOMIZAÇÃO

### **Estrutura geral:**
- `card` - Container principal
- `header` - Cabeçalho
- `headerTitle` - Título
- `headerSubtitle` - Subtítulo
- `main` - Conteúdo principal
- `footer` - Rodapé

### **Formulários:**
- `form` - Form container
- `formFieldInput` - Input fields
- `formFieldLabel` - Labels
- `formFieldAction` - Ação do campo (ex: "Forgot password?")
- `formButtonPrimary` - Botão principal
- `formButtonReset` - Botão de reset

### **Social login:**
- `socialButtonsBlockButton` - Botões de login social
- `socialButtonsBlockButtonText` - Texto dos botões

### **Outros:**
- `dividerLine` - Linha divisória
- `dividerText` - Texto "ou"
- `footerActionLink` - Links do footer
- `identityPreview` - Preview de identidade

---

## 🎨 EXEMPLO COMPLETO COM TEMA HRX

\`\`\`typescript
// src/lib/clerk-theme.ts
export const hrxClerkTheme = {
  variables: {
    // Primary color
    colorPrimary: '#DC2626',
    colorDanger: '#EF4444',
    colorSuccess: '#22C55E',
    colorWarning: '#F59E0B',
    colorNeutral: '#71717a',

    // Backgrounds
    colorBackground: '#000000',
    colorInputBackground: '#18181b',

    // Text
    colorText: '#ffffff',
    colorTextSecondary: '#a1a1aa',
    colorTextOnPrimaryBackground: '#ffffff',

    // Borders
    borderRadius: '0.5rem',

    // Fonts
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '1rem',
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  elements: {
    // Layout
    rootBox: 'flex items-center justify-center min-h-screen',
    card: 'bg-zinc-900 border-2 border-zinc-800 shadow-2xl rounded-xl p-8 w-full max-w-md',

    // Header
    headerTitle: 'text-white text-3xl font-bold mb-2',
    headerSubtitle: 'text-zinc-400 text-base',

    // Logo
    logoBox: 'h-16 mb-6',
    logoImage: 'h-full w-auto',

    // Form
    form: 'space-y-4',
    formFieldInput:
      'w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all',
    formFieldLabel: 'text-zinc-300 text-sm font-medium mb-2 block',
    formFieldAction: 'text-red-600 hover:text-red-500 text-sm transition-colors',

    // Buttons
    formButtonPrimary:
      'w-full py-3 px-6 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',

    // Social
    socialButtonsBlockButton:
      'w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-medium rounded-lg transition-all',
    socialButtonsBlockButtonText: 'text-white',

    // Divider
    dividerLine: 'bg-zinc-800',
    dividerText: 'text-zinc-500 text-sm',

    // Links
    footerActionLink: 'text-red-600 hover:text-red-500 font-medium transition-colors',

    // Alert/Error
    alertText: 'text-red-400',

    // Hide Clerk branding
    footer: 'hidden',
    footerPagesLink: 'hidden',
  },
};
\`\`\`

**Uso:**

\`\`\`typescript
import { hrxClerkTheme } from '@/lib/clerk-theme';

<SignIn appearance={hrxClerkTheme} />
\`\`\`

---

## 📚 REFERÊNCIAS

- [Appearance Prop Documentation](https://clerk.com/docs/guides/customizing-clerk/appearance-prop/overview)
- [Variables Reference](https://clerk.com/docs/guides/customizing-clerk/appearance-prop/variables)
- [Elements Reference](https://clerk.com/docs/guides/customizing-clerk/appearance-prop/layout)
- [Themes](https://clerk.com/docs/guides/customizing-clerk/appearance-prop/themes)

---

**Última atualização:** 2025-01-21
**Responsável:** Equipe HRX Tech
