import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Emails com acesso admin
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(e => e.length > 0);

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: currentUserId, sessionClaims } = await auth();

    if (!currentUserId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se o usuário atual é admin
    const client = await clerkClient();
    const currentUser = await client.users.getUser(currentUserId);
    const currentUserEmail = currentUser.emailAddresses[0]?.emailAddress?.toLowerCase() || '';

    const publicMetadata = sessionClaims?.publicMetadata as { role?: string } | undefined;
    const isAdmin = ADMIN_EMAILS.includes(currentUserEmail) || publicMetadata?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Obter dados da requisição
    const { role } = await request.json();
    const { userId: targetUserId } = await params;

    // Validar role
    if (!['admin', 'professional', 'contractor', null].includes(role)) {
      return NextResponse.json({ error: 'Role inválida' }, { status: 400 });
    }

    // Atualizar role do usuário alvo
    await client.users.updateUser(targetUserId, {
      publicMetadata: {
        role: role || undefined,
      },
    });


    return NextResponse.json({
      success: true,
      message: 'Role atualizada com sucesso',
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao atualizar role' },
      { status: 500 }
    );
  }
}
