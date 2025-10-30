import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import '@/types/clerk';

// Rotas públicas (não requerem autenticação)
const isPublicRoute = createRouteMatcher([
  '/',
  '/entrar(.*)',
  '/cadastrar(.*)',
  '/onboarding(.*)', // Página de seleção de tipo de usuário (público)
  '/sobre',
  '/servicos',
  '/contato',
  '/termos',
  '/privacidade',
  '/orcamento(.*)', // Fornecedor responde orçamento (público)
  '/cadastro-profissional-wizard(.*)', // Wizard de cadastro profissional
  '/solicitar-evento-wizard(.*)', // Wizard de solicitação de evento/fornecedor
  '/api/webhooks(.*)',
  '/api/send(.*)',
  '/api/send-test(.*)',
  '/api/contact(.*)',
  '/api/requests(.*)',
  '/api/public(.*)', // APIs públicas (event-requests, quotations, etc)
  '/api/user/(.*)', // APIs de usuário fazem auth interna
  // '/api/contractors(.*)' <- REMOVIDO: agora precisa autenticação (auditoria 2025-10-24)
  // '/api/professionals(.*)' <- REMOVIDO: precisa autenticação
  // '/api/upload(.*)' <- REMOVIDO: precisa autenticação
]);

// Rotas de dashboard (requerem autenticação mas não admin)
const isDashboardRoute = createRouteMatcher([
  '/dashboard/profissional(.*)',
  '/dashboard/contratante(.*)',
  '/supplier(.*)', // Dashboard e rotas de fornecedor
]);

// Rotas administrativas (requerem role 'admin')
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/backoffice(.*)',
]);

// Emails com acesso admin (desenvolvimento)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(e => e.length > 0);

// Log apenas em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  console.log('[Middleware] Admin emails configurados:', ADMIN_EMAILS);
}

export default clerkMiddleware(async (auth, req) => {
  // Protege rotas admin
  if (isAdminRoute(req)) {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      // Não autenticado - redireciona para login
      return NextResponse.redirect(new URL('/entrar', req.url));
    }

    // Usar sessionClaims.metadata ao invés de buscar user completo (mais rápido!)
    const metadata = sessionClaims?.metadata;
    const isAdmin = metadata?.isAdmin === true || metadata?.role === 'admin';

    // Se não tem metadata.isAdmin definido, buscar email como fallback
    if (!isAdmin) {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase() || '';

      const isAdminByEmail = ADMIN_EMAILS.includes(userEmail);

      if (!isAdminByEmail) {
        // Log apenas em desenvolvimento para debug
        if (process.env.NODE_ENV === 'development') {
          console.log('[Middleware] ❌ Acesso negado:', userEmail);
        }
        return NextResponse.redirect(new URL('/403', req.url));
      }
    }
  }

  // Protege rotas de dashboard (requer autenticação)
  if (isDashboardRoute(req)) {
    const { userId } = await auth();

    if (!userId) {
      // Não autenticado - redireciona para login
      return NextResponse.redirect(new URL('/entrar', req.url));
    }
  }

  // Protege todas as outras rotas não-públicas
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Ignora Next.js internals e arquivos estáticos
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Sempre roda para rotas de API
    '/(api|trpc)(.*)',
  ],
};
