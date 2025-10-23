import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/admin/event-projects/[id]/equipment/[equipmentId]/request-quotes
 *
 * Solicita cotações para um equipamento específico
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; equipmentId: string }> }
) {
  try {
    // Verificar autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(userId, RateLimitPresets.API_WRITE);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitError(rateLimitResult),
        { status: 429 }
      );
    }

    const { id: projectId, equipmentId } = await params;
    const body = await req.json();
    const { supplier_ids } = body;

    // Validações
    if (!supplier_ids || !Array.isArray(supplier_ids) || supplier_ids.length === 0) {
      return NextResponse.json(
        { error: 'Lista de fornecedores é obrigatória' },
        { status: 400 }
      );
    }

    // Verificar se equipamento existe
    const { data: equipment, error: equipmentError } = await supabase
      .from('project_equipment')
      .select('id, name, category, equipment_type, project_id')
      .eq('id', equipmentId)
      .eq('project_id', projectId)
      .single();

    if (equipmentError || !equipment) {
      return NextResponse.json(
        { error: 'Equipamento não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se projeto existe
    const { data: project, error: projectError } = await supabase
      .from('event_projects')
      .select('id, project_number, status')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    // Criar solicitações de cotação para cada fornecedor
    const quotationRequests = supplier_ids.map((supplierId: string) => ({
      project_id: projectId,
      equipment_id: equipmentId,
      supplier_id: supplierId,
      status: 'pending',
      requested_at: new Date().toISOString(),
    }));

    const { data: createdQuotations, error: insertError } = await supabase
      .from('supplier_quotations')
      .insert(quotationRequests)
      .select();

    if (insertError) {
      logger.error('Erro ao criar solicitações de cotação', {
        error: insertError,
        equipmentId,
        projectId,
        userId,
      });
      return NextResponse.json(
        { error: insertError.message || 'Erro ao solicitar cotações' },
        { status: 500 }
      );
    }

    logger.info('Cotações solicitadas', {
      userId,
      projectId,
      equipmentId,
      equipmentName: equipment.name,
      suppliersCount: supplier_ids.length,
      quotationsCreated: createdQuotations?.length || 0,
    });

    // TODO: Enviar emails para fornecedores
    // await sendQuoteRequestEmails(createdQuotations, equipment, project);

    return NextResponse.json({
      success: true,
      quotations: createdQuotations,
      message: `${createdQuotations?.length || 0} solicitações de cotação enviadas`,
    });
  } catch (error: any) {
    logger.error('Erro ao solicitar cotações', { error: error.message });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
