import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

// Rota temporária para definir isAdmin no metadata
// Use: GET /api/admin/set-admin-metadata
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se é um dos emails admin
    const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0);

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase() || '';

    if (!ADMIN_EMAILS.includes(userEmail)) {
      return NextResponse.json({
        error: 'Acesso negado',
        message: 'Seu email não está na lista de admins',
        yourEmail: userEmail,
        adminEmails: ADMIN_EMAILS
      }, { status: 403 });
    }

    // Definir metadata de admin
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        isAdmin: true,
        role: 'admin',
        userType: 'admin',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Metadata de admin definido com sucesso!',
      userId,
      email: userEmail,
      metadata: {
        isAdmin: true,
        role: 'admin',
        userType: 'admin',
      }
    });

  } catch (error) {
    console.error('Erro ao definir metadata:', error);
    return NextResponse.json({
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
