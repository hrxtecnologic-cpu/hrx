import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// Force dynamic route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =============================================
// PATCH /api/admin/event-projects/[id]/quotations/[quotationId] - Aceitar/Rejeitar cotação
// =============================================
export async function PATCH(
  req: Request,
  { params }: { params: { id: string; quotationId: string } }
) {
  try {
    // Verificar autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(userId, RateLimitPresets.API);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitError(rateLimitResult),
        { status: 429 }
      );
    }

    const projectId = params.id;
    const quotationId = params.quotationId;
    const body = await req.json();

    // Validar status
    const validStatuses = ['accepted', 'rejected'];
    if (!body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Status deve ser "accepted" ou "rejected"' },
        { status: 400 }
      );
    }

    // Buscar cotação
    const { data: quotation, error: quotationError } = await supabase
      .from('supplier_quotations')
      .select(`
        *,
        equipment:project_equipment(id, name, status),
        supplier:equipment_suppliers(id, company_name)
      `)
      .eq('id', quotationId)
      .eq('project_id', projectId)
      .single();

    if (quotationError || !quotation) {
      return NextResponse.json(
        { error: 'Cotação não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se cotação pode ser aceita/rejeitada
    const editableStatuses = ['received', 'pending', 'sent'];
    if (!editableStatuses.includes(quotation.status)) {
      return NextResponse.json(
        {
          error: `Não é possível modificar cotação com status "${quotation.status}"`,
        },
        { status: 400 }
      );
    }

    const updateData: any = {
      status: body.status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
    };

    if (body.rejection_reason && body.status === 'rejected') {
      updateData.rejection_reason = body.rejection_reason;
    }

    // Atualizar cotação
    const { data: updatedQuotation, error: updateError } = await supabase
      .from('supplier_quotations')
      .update(updateData)
      .eq('id', quotationId)
      .select()
      .single();

    if (updateError) {
      logger.error('Erro ao atualizar cotação', {
        error: updateError.message,
        quotationId,
        userId,
      });
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Se aceitou a cotação, atualizar status do equipamento
    if (body.status === 'accepted') {
      await supabase
        .from('project_equipment')
        .update({ status: 'quoted' })
        .eq('id', quotation.equipment_id);

      // Rejeitar outras cotações do mesmo equipamento
      await supabase
        .from('supplier_quotations')
        .update({
          status: 'rejected',
          rejection_reason: 'Outra cotação foi aceita',
          reviewed_at: new Date().toISOString(),
          reviewed_by: userId,
        })
        .eq('equipment_id', quotation.equipment_id)
        .neq('id', quotationId)
        .in('status', ['received', 'pending', 'sent']);
    }

    // Verificar se todos equipamentos do projeto foram cotados
    const { data: allEquipment } = await supabase
      .from('project_equipment')
      .select('id, status')
      .eq('project_id', projectId);

    const allQuoted = allEquipment?.every(
      (eq) => eq.status === 'quoted' || eq.status === 'approved'
    );

    // Se todos equipamentos foram cotados, atualizar status do projeto
    if (allQuoted && allEquipment && allEquipment.length > 0) {
      const { data: project } = await supabase
        .from('event_projects')
        .select('status')
        .eq('id', projectId)
        .single();

      if (project && project.status === 'quoting') {
        await supabase
          .from('event_projects')
          .update({ status: 'quoted' })
          .eq('id', projectId);

        logger.info('Projeto marcado como quoted - todos equipamentos cotados', {
          projectId,
        });
      }
    }

    logger.info('Cotação atualizada', {
      userId,
      projectId,
      quotationId,
      newStatus: body.status,
      supplier: quotation.supplier?.company_name,
      equipment: quotation.equipment?.name,
    });

    return NextResponse.json({
      success: true,
      quotation: updatedQuotation,
    });
  } catch (error: any) {
    logger.error('Erro ao atualizar cotação', { error: error.message });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// =============================================
// DELETE /api/admin/event-projects/[id]/quotations/[quotationId] - Cancelar cotação
// =============================================
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; quotationId: string } }
) {
  try {
    // Verificar autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(userId, RateLimitPresets.API);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitError(rateLimitResult),
        { status: 429 }
      );
    }

    const quotationId = params.quotationId;

    // Verificar se cotação existe e não foi aceita
    const { data: quotation, error: quotationError } = await supabase
      .from('supplier_quotations')
      .select('status')
      .eq('id', quotationId)
      .eq('project_id', params.id)
      .single();

    if (quotationError || !quotation) {
      return NextResponse.json(
        { error: 'Cotação não encontrada' },
        { status: 404 }
      );
    }

    if (quotation.status === 'accepted') {
      return NextResponse.json(
        { error: 'Não é possível cancelar cotação aceita' },
        { status: 400 }
      );
    }

    // Marcar como cancelada ao invés de deletar
    const { error } = await supabase
      .from('supplier_quotations')
      .update({
        status: 'cancelled',
        reviewed_at: new Date().toISOString(),
        reviewed_by: userId,
      })
      .eq('id', quotationId);

    if (error) {
      logger.error('Erro ao cancelar cotação', {
        error: error.message,
        quotationId,
        userId,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logger.info('Cotação cancelada', {
      userId,
      projectId: params.id,
      quotationId,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Erro ao cancelar cotação', { error: error.message });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
