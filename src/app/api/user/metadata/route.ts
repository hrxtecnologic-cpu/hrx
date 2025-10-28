import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { updateUserMetadataSchema } from '@/lib/validations/event-project';
import { z } from 'zod';

export async function PATCH(req: Request) {
  try {
    // Verificar autenticação com retry (timing issue após login)
    let userId: string | null = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (!userId && attempts < maxAttempts) {
      attempts++;
      const authResult = await auth();
      userId = authResult.userId;

      if (!userId && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Aguarda 500ms
      }
    }

    if (!userId) {
      return NextResponse.json({
        error: 'Não autenticado. Por favor, faça login novamente.'
      }, { status: 401 });
    }

    // Obter dados do body
    const body = await req.json();

    // Validar dados com Zod (permite role como admin/professional/contractor/supplier)
    try {
      const validatedData = updateUserMetadataSchema.parse({
        role: body.userType, // Converte userType → role
        onboarding_completed: true,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Dados inválidos', details: error.issues },
          { status: 400 }
        );
      }
    }

    const { userType } = body;

    // Atualizar metadata do usuário no Clerk (server-side)
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        userType,
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({
      success: true,
      userType,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao atualizar dados do usuário', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
