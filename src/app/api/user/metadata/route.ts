import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function PATCH(req: Request) {
  try {
    // Verificar autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Obter dados do body
    const { userType } = await req.json();

    // Validar userType
    if (!userType || !['professional', 'contractor'].includes(userType)) {
      return NextResponse.json(
        { error: 'userType inválido. Deve ser "professional" ou "contractor"' },
        { status: 400 }
      );
    }

    // Atualizar metadata do usuário no Clerk (server-side)
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        userType,
        onboardingCompleted: true,
      },
    });

    console.log(`✅ Metadata atualizado para usuário: ${userId} - tipo: ${userType}`);

    return NextResponse.json({
      success: true,
      userType,
    });
  } catch (error) {
    console.error('Erro ao atualizar metadata:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar dados do usuário' },
      { status: 500 }
    );
  }
}
