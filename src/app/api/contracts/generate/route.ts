/**
 * =====================================================
 * API: Gerar Contrato PDF
 * =====================================================
 * Gera PDF do contrato após aprovação da proposta
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/api';
import { generateContract } from '@/lib/services/contract-service';

export const POST = withAdmin(async (userId: string, request: NextRequest) => {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'projectId é obrigatório' }, { status: 400 });
    }

    // Use the shared service
    const result = await generateContract({ projectId, userId });

    if (!result.success) {
      const statusCode =
        result.error === 'PROJECT_NOT_FOUND'
          ? 404
          : result.error === 'PROJECT_NOT_APPROVED'
            ? 400
            : 500;

      return NextResponse.json({ error: result.message }, { status: statusCode });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro ao gerar contrato:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});
