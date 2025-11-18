/**
 * =====================================================
 * API: Enviar Contrato para Assinatura Digital
 * =====================================================
 * Gera token JWT e envia email com link de assinatura
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/api';
import { sendContractForSignature } from '@/lib/services/contract-signature-service';

export const POST = withAdmin(
  async (
    userId: string,
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id: contractId } = await context.params;

      // Use the shared service
      const result = await sendContractForSignature(contractId);

      if (!result.success) {
        const statusCode =
          result.error === 'CONTRACT_NOT_FOUND'
            ? 404
            : result.error === 'ALREADY_SIGNED' || result.error === 'NO_EMAIL'
              ? 400
              : 500;

        return NextResponse.json({ error: result.message }, { status: statusCode });
      }

      return NextResponse.json(result);
    } catch (error: unknown) {
      console.error('Erro ao enviar contrato:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  }
);
