import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { RequestEquipmentQuotesData } from '@/types/event-project';
import { sendEquipmentQuoteRequestEmail } from '@/lib/resend/emails';

// Force dynamic route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =============================================
// POST /api/admin/event-projects/[id]/request-quotes - Solicitar cotações
// =============================================
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Aguardar params (Next.js 15)
    const { id: projectId } = await params;

    // Verificar autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Rate limiting (solicitação de cotações é uma operação de escrita)
    const rateLimitResult = await rateLimit(userId, RateLimitPresets.API_WRITE);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitError(rateLimitResult),
        { status: 429 }
      );
    }
    const body: RequestEquipmentQuotesData = await req.json();

    // Validações
    if (!body.equipment_id) {
      return NextResponse.json(
        { error: 'ID do equipamento é obrigatório' },
        { status: 400 }
      );
    }

    if (!body.supplier_ids || body.supplier_ids.length === 0) {
      return NextResponse.json(
        { error: 'Selecione pelo menos um fornecedor' },
        { status: 400 }
      );
    }

    if (!body.deadline) {
      return NextResponse.json(
        { error: 'Prazo de resposta é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar projeto
    const { data: project, error: projectError } = await supabase
      .from('event_projects')
      .select('*, equipment:project_equipment!inner(*)')
      .eq('id', projectId)
      .eq('equipment.id', body.equipment_id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Projeto ou equipamento não encontrado' },
        { status: 404 }
      );
    }

    // Buscar fornecedores
    const { data: suppliers, error: suppliersError } = await supabase
      .from('equipment_suppliers')
      .select('id, company_name, contact_name, email, phone')
      .in('id', body.supplier_ids)
      .eq('status', 'active');

    if (suppliersError || !suppliers || suppliers.length === 0) {
      return NextResponse.json(
        { error: 'Fornecedores não encontrados ou inativos' },
        { status: 404 }
      );
    }

    // Buscar equipamento específico
    const { data: equipment, error: equipmentError } = await supabase
      .from('project_equipment')
      .select('*')
      .eq('id', body.equipment_id)
      .single();

    if (equipmentError || !equipment) {
      return NextResponse.json(
        { error: 'Equipamento não encontrado' },
        { status: 404 }
      );
    }

    // Formatar deadline para exibição
    const deadlineDate = new Date(body.deadline);
    const deadlineFormatted = deadlineDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Disparar cotações para cada fornecedor
    const results = [];

    for (const supplier of suppliers) {
      try {
        // Criar registro de cotação pendente
        const { data: quotation, error: quotationError } = await supabase
          .from('supplier_quotations')
          .insert([
            {
              project_id: projectId,
              equipment_id: body.equipment_id,
              supplier_id: supplier.id,
              supplier_price: 0, // Será preenchido pelo fornecedor
              hrx_price: 0,
              profit_margin_applied: project.profit_margin,
              profit_amount: 0,
              status: 'pending',
              deadline: body.deadline,
            },
          ])
          .select()
          .single();

        if (quotationError) {
          logger.error(`Erro ao criar cotação para ${supplier.company_name}`, {
            error: quotationError.message,
            supplierId: supplier.id,
            projectId,
          });
          results.push({
            supplier: supplier.company_name,
            success: false,
            error: quotationError.message,
          });
          continue;
        }

        // Enviar email
        try {
          const emailResult = await sendEquipmentQuoteRequestEmail({
            supplierName: supplier.contact_name || supplier.company_name,
            supplierEmail: supplier.email,
            projectNumber: project.project_number,
            clientName: project.client_name,
            eventName: project.event_name,
            eventDate: project.event_date || 'A definir',
            eventLocation: `${project.venue_city} - ${project.venue_state}`,
            equipmentName: equipment.name,
            equipmentCategory: equipment.category,
            equipmentQuantity: equipment.quantity,
            equipmentDuration: equipment.duration_days,
            equipmentDescription: equipment.description || '',
            deadline: deadlineFormatted,
            quotationId: quotation.id,
          });

          // Registrar envio do email
          await supabase.from('project_emails').insert({
            project_id: projectId,
            quotation_id: quotation.id,
            recipient_email: supplier.email,
            recipient_name: supplier.company_name,
            recipient_type: 'supplier',
            email_type: 'quote_request',
            status: emailResult.success ? 'sent' : 'failed',
            resend_id: emailResult.emailId,
            error_message: emailResult.error,
            sent_at: emailResult.success ? new Date().toISOString() : null,
          });

          // Atualizar status da cotação
          if (emailResult.success) {
            await supabase
              .from('supplier_quotations')
              .update({
                status: 'sent',
                sent_at: new Date().toISOString(),
              })
              .eq('id', quotation.id);
          }

          results.push({
            supplier: supplier.company_name,
            success: emailResult.success,
            emailId: emailResult.emailId,
            error: emailResult.error,
          });
        } catch (emailError: any) {
          logger.error(`Erro ao enviar email para ${supplier.company_name}`, {
            error: emailError.message,
            supplierId: supplier.id,
          });
          results.push({
            supplier: supplier.company_name,
            success: false,
            error: emailError.message,
          });
        }
      } catch (error: any) {
        logger.error(`Erro ao processar fornecedor ${supplier.company_name}`, {
          error: error.message,
        });
        results.push({
          supplier: supplier.company_name,
          success: false,
          error: error.message,
        });
      }
    }

    // Atualizar status do equipamento para 'quoting'
    const successCount = results.filter((r) => r.success).length;
    if (successCount > 0) {
      await supabase
        .from('project_equipment')
        .update({ status: 'quoting' })
        .eq('id', body.equipment_id);

      // Se projeto estava em 'analyzing', mudar para 'quoting'
      if (project.status === 'analyzing' || project.status === 'new') {
        await supabase
          .from('event_projects')
          .update({ status: 'quoting' })
          .eq('id', projectId);
      }
    }

    logger.info('Cotações solicitadas', {
      userId,
      projectId,
      equipmentId: body.equipment_id,
      totalSent: successCount,
      totalFailed: results.length - successCount,
    });

    return NextResponse.json({
      success: true,
      totalSent: successCount,
      totalFailed: results.length - successCount,
      results,
    });
  } catch (error: any) {
    logger.error('Erro ao solicitar cotações', { error: error.message });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
