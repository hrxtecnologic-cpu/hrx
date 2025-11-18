import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth';
import { sendQuoteAcceptedEmail, sendQuoteRejectedEmail } from '@/lib/resend/emails';
import { logger } from '@/lib/logger';

/**
 * POST /api/admin/projects/[id]/quotations/[quotationId]/accept
 *
 * Aceita um orçamento e atualiza o projeto
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; quotationId: string }> }
) {
  try {
    // ========== Rate Limiting ==========
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(ip, RateLimitPresets.API_WRITE);
    if (!rateLimitResult.success) {
      return NextResponse.json(createRateLimitError(rateLimitResult), {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
        }
      });
    }

    // ========== Autenticação ==========
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se é admin
    const { isAdmin: userIsAdmin } = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    const { id: projectId, quotationId } = await params;
    const supabase = await createAdminClient();

    // Buscar o orçamento aceito
    const { data: quotation, error: quotationError } = await supabase
      .from('supplier_quotations')
      .select('*')
      .eq('id', quotationId)
      .eq('project_id', projectId)
      .maybeSingle();

    if (quotationError || !quotation) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      );
    }

    if (quotation.status !== 'submitted') {
      return NextResponse.json(
        { error: 'Apenas orçamentos enviados podem ser aceitos' },
        { status: 400 }
      );
    }

    // Atualizar status do orçamento aceito
    const { error: updateAcceptedError } = await supabase
      .from('supplier_quotations')
      .update({
        status: 'accepted',
        responded_at: new Date().toISOString(),
      })
      .eq('id', quotationId);

    if (updateAcceptedError) {
      return NextResponse.json(
        { error: 'Erro ao aceitar orçamento' },
        { status: 500 }
      );
    }

    // Rejeitar todos os outros orçamentos do mesmo projeto
    const { error: rejectOthersError } = await supabase
      .from('supplier_quotations')
      .update({ status: 'rejected' })
      .eq('project_id', projectId)
      .eq('status', 'submitted')
      .neq('id', quotationId);

    if (rejectOthersError) {
    }

    // Atualizar custos do projeto com valores do orçamento aceito
    const totalEquipmentCost = quotation.total_price || 0;

    // Buscar projeto para recalcular custos totais
    const { data: project, error: projectFetchError } = await supabase
      .from('event_projects')
      .select('total_team_cost, profit_margin, project_number')
      .eq('id', projectId)
      .maybeSingle();

    if (projectFetchError) {
    }

    // Calcular custos totais
    const totalTeamCost = project?.total_team_cost || 0;
    const totalCost = totalTeamCost + totalEquipmentCost;
    const profitMargin = project?.profit_margin || 30;
    const totalClientPrice = totalCost * (1 + profitMargin / 100);

    // Atualizar projeto com novos custos
    const { error: updateProjectError } = await supabase
      .from('event_projects')
      .update({
        total_equipment_cost: totalEquipmentCost,
        total_cost: totalCost,
        total_client_price: totalClientPrice,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (updateProjectError) {
      // Não falha a requisição, apenas loga o erro
    } else {
    }

    // Enviar email para fornecedor aceito
    try {
      const acceptedEmailResult = await sendQuoteAcceptedEmail({
        supplierName: (quotation as Record<string, unknown>).supplier?.contact_name || (quotation as Record<string, unknown>).supplier?.company_name || 'Fornecedor',
        supplierEmail: (quotation as Record<string, unknown>).supplier?.email || '',
        quoteRequestId: project.project_number,
        clientName: 'HRX Eventos',
        eventDate: new Date().toISOString(), // Buscar do projeto se necessário
        acceptedPrice: quotation.total_price || 0,
      });

      if (acceptedEmailResult.success) {
        logger.info('Email de aceite enviado', {
          emailId: acceptedEmailResult.emailId,
          quotationId,
          supplierEmail: (quotation as Record<string, unknown>).supplier?.email,
        });
      }
    } catch (emailError) {
      logger.error('Erro ao enviar email de aceite', emailError instanceof Error ? emailError : undefined);
    }

    // Enviar emails para fornecedores rejeitados
    const { data: rejectedQuotations } = await supabase
      .from('supplier_quotations')
      .select(`
        id,
        supplier:equipment_suppliers!supplier_id(
          id,
          company_name,
          contact_name,
          email
        )
      `)
      .eq('project_id', projectId)
      .eq('status', 'rejected')
      .neq('id', quotationId);

    if (rejectedQuotations && rejectedQuotations.length > 0) {
      for (const rejected of rejectedQuotations) {
        try {
          if ((rejected as Record<string, unknown>).supplier?.email) {
            const rejectedEmailResult = await sendQuoteRejectedEmail({
              supplierName: (rejected as Record<string, unknown>).supplier?.contact_name || (rejected as Record<string, unknown>).supplier?.company_name || 'Fornecedor',
              supplierEmail: (rejected as Record<string, unknown>).supplier.email,
              quoteRequestId: project.project_number,
              clientName: 'HRX Eventos',
              reason: 'Selecionamos outro fornecedor para este projeto',
            });

            if (rejectedEmailResult.success) {
              logger.info('Email de rejeição enviado', {
                emailId: rejectedEmailResult.emailId,
                quotationId: rejected.id,
                supplierEmail: (rejected as Record<string, unknown>).supplier.email,
              });
            }
          }
        } catch (emailError) {
          logger.error('Erro ao enviar email de rejeição', emailError instanceof Error ? emailError : undefined, {
            quotationId: rejected.id,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Orçamento aceito com sucesso',
      updatedCosts: {
        totalEquipmentCost,
        totalCost,
        totalClientPrice,
      },
      emailsSent: {
        accepted: 1,
        rejected: rejectedQuotations?.length || 0,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
