import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Rotas públicas (não requerem autenticação)
const isPublicRoute = createRouteMatcher([
  '/',
  '/entrar(.*)',
  '/cadastrar(.*)',
  '/sobre',
  '/servicos',
  '/contato',
  '/termos',
  '/privacidade',
  '/solicitar-equipe(.*)',
  '/cadastrar-profissional(.*)',
  '/cadastrar-contratante(.*)',
  '/api/webhooks(.*)',
  '/api/send(.*)',
  '/api/send-test(.*)',
  '/api/contact(.*)',
  '/api/requests(.*)',
  '/api/contractors(.*)',
  // '/api/professionals(.*)' <- REMOVIDO: precisa autenticação
  // '/api/upload(.*)' <- REMOVIDO: precisa autenticação
  // '/api/user/check-registration' <- Precisa autenticação mas não é pública
]);

// Rotas de dashboard (requerem autenticação mas não admin)
const isDashboardRoute = createRouteMatcher([
  '/dashboard/profissional(.*)',
  '/dashboard/contratante(.*)',
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

console.log('[Middleware] Admin emails configurados:', ADMIN_EMAILS);

export default clerkMiddleware(async (auth, req) => {
  // Protege rotas admin
  if (isAdminRoute(req)) {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      // Não autenticado - redireciona para login
      return NextResponse.redirect(new URL('/entrar', req.url));
    }

    // Buscar usuário completo do Clerk para ter acesso ao email
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase() || '';

    console.log('[Middleware] 🔍 Verificando admin:', {
      userId: userId.substring(0, 10),
      email: userEmail,
      role: sessionClaims?.publicMetadata?.role,
      adminEmails: ADMIN_EMAILS,
    });

    const isAdmin =
      ADMIN_EMAILS.includes(userEmail) ||
      sessionClaims?.publicMetadata?.role === 'admin';

    if (!isAdmin) {
      console.log('[Middleware] ❌ Acesso negado - não é admin:', userEmail);
      return NextResponse.redirect(new URL('/403', req.url));
    }

    console.log('[Middleware] ✅ Acesso admin permitido:', userEmail);
  }

  // Protege rotas de dashboard (requer autenticação)
  if (isDashboardRoute(req)) {
    const { userId } = await auth();

    if (!userId) {
      // Não autenticado - redireciona para login
      return NextResponse.redirect(new URL('/entrar', req.url));
    }

    console.log('[Middleware] ✅ Acesso ao dashboard permitido');
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
