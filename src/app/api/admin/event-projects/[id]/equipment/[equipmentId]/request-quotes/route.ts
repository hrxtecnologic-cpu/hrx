import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { sendEquipmentQuoteRequestEmail } from '@/lib/resend/emails';
import { randomBytes } from 'crypto';

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

    // Verificar se equipamento existe e buscar fornecedor selecionado
    const { data: equipment, error: equipmentError } = await supabase
      .from('project_equipment')
      .select(`
        id,
        name,
        category,
        equipment_type,
        description,
        quantity,
        duration_days,
        project_id,
        selected_supplier_id,
        supplier:equipment_suppliers!selected_supplier_id(
          id,
          company_name,
          contact_name,
          email
        )
      `)
      .eq('id', equipmentId)
      .eq('project_id', projectId)
      .single();

    if (equipmentError || !equipment) {
      return NextResponse.json(
        { error: 'Equipamento não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se tem fornecedor selecionado
    if (!equipment.selected_supplier_id || !equipment.supplier) {
      return NextResponse.json(
        { error: 'Equipamento não tem fornecedor selecionado' },
        { status: 400 }
      );
    }

    // Verificar se projeto existe e buscar dados completos
    const { data: project, error: projectError } = await supabase
      .from('event_projects')
      .select('id, project_number, status, event_name, event_date, event_type, venue_city, venue_state, is_urgent')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    // Gerar token único para a cotação
    const token = randomBytes(32).toString('hex');
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 7); // Válido por 7 dias

    // Criar solicitação de cotação
    const quotationData = {
      project_id: projectId,
      supplier_id: equipment.selected_supplier_id,
      token: token,
      status: 'pending',
      valid_until: validUntil.toISOString(),
      requested_items: [{
        equipment_id: equipment.id,
        name: equipment.name,
        category: equipment.category,
        quantity: equipment.quantity,
        duration_days: equipment.duration_days,
        description: equipment.description,
      }],
    };

    const { data: createdQuotation, error: insertError } = await supabase
      .from('supplier_quotations')
      .insert([quotationData])
      .select()
      .single();

    if (insertError) {
      logger.error('Erro ao criar solicitação de cotação', {
        error: insertError.message,
        errorCode: insertError.code,
        errorDetails: insertError.details,
        errorHint: insertError.hint,
        equipmentId,
        projectId,
        userId,
        quotationData,
      });
      return NextResponse.json(
        {
          error: insertError.message || insertError.details || 'Erro ao solicitar cotação',
          details: insertError
        },
        { status: 500 }
      );
    }

    // Atualizar status do equipamento
    await supabase
      .from('project_equipment')
      .update({ status: 'quoting' })
      .eq('id', equipmentId);

    logger.info('Cotação solicitada', {
      userId,
      projectId,
      equipmentId,
      equipmentName: equipment.name,
      supplierId: equipment.selected_supplier_id,
      supplierName: equipment.supplier.company_name,
    });

    // Enviar email para fornecedor
    const quoteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cotacao/${token}`;

    try {
      const emailResult = await sendEquipmentQuoteRequestEmail({
        supplierName: equipment.supplier.contact_name || equipment.supplier.company_name,
        supplierEmail: equipment.supplier.email,
        projectNumber: project.project_number,
        clientName: 'HRX Eventos', // Não expomos nome do cliente para fornecedor
        eventName: project.event_name,
        eventDate: project.event_date,
        eventType: project.event_type,
        venueCity: project.venue_city,
        venueState: project.venue_state,
        equipmentName: equipment.name,
        quantity: equipment.quantity,
        durationDays: equipment.duration_days,
        specifications: equipment.description || '',
        quoteUrl: quoteUrl,
        isUrgent: project.is_urgent || false,
      });

      if (emailResult.success) {
        logger.info('Email de cotação enviado', {
          emailId: emailResult.emailId,
          supplierEmail: equipment.supplier.email,
          quotationId: createdQuotation.id,
        });
      } else {
        logger.error('Erro ao enviar email de cotação', undefined, {
          error: emailResult.error,
          supplierEmail: equipment.supplier.email,
        });
      }
    } catch (emailError) {
      // Não falha a requisição se email falhar
      logger.error('Exceção ao enviar email de cotação', emailError instanceof Error ? emailError : undefined, {
        supplierEmail: equipment.supplier.email,
      });
    }

    return NextResponse.json({
      success: true,
      quotation: createdQuotation,
      supplierEmail: equipment.supplier.email,
      quoteUrl: quoteUrl,
      message: 'Solicitação de cotação enviada',
    });
  } catch (error: any) {
    logger.error('Erro ao solicitar cotações', { error: error.message });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
