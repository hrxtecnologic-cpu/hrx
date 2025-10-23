import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/admin/event-projects/[id]/request-quotes
 *
 * Solicita cotações para TODOS os equipamentos do projeto
 * Cria uma cotação por fornecedor selecionado com requested_items JSON
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: projectId } = await params;
    const body = await req.json();
    const { supplier_ids, requested_items } = body;

    // Validações
    if (!supplier_ids || !Array.isArray(supplier_ids) || supplier_ids.length === 0) {
      return NextResponse.json(
        { error: 'Lista de fornecedores é obrigatória' },
        { status: 400 }
      );
    }

    if (!requested_items || !Array.isArray(requested_items) || requested_items.length === 0) {
      return NextResponse.json(
        { error: 'Lista de equipamentos é obrigatória' },
        { status: 400 }
      );
    }

    // Verificar se projeto existe
    const { data: project, error: projectError } = await supabase
      .from('event_projects')
      .select('id, project_number, status, client_name, event_name')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    // Gerar tokens únicos e criar solicitações de cotação
    const quotationRequests = supplier_ids.map((supplierId: string) => ({
      project_id: projectId,
      supplier_id: supplierId,
      token: randomBytes(32).toString('hex'), // Token único para acesso público
      requested_items: requested_items, // Array JSON com todos os equipamentos
      status: 'pending',
      valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
      created_at: new Date().toISOString(),
    }));

    // Inserir cotações (com upsert para evitar duplicatas)
    const { data: createdQuotations, error: insertError } = await supabase
      .from('supplier_quotations')
      .upsert(quotationRequests, {
        onConflict: 'project_id,supplier_id',
        ignoreDuplicates: false
      })
      .select();

    if (insertError) {
      logger.error('Erro ao criar solicitações de cotação', {
        error: insertError,
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
      projectNumber: project.project_number,
      suppliersCount: supplier_ids.length,
      equipmentCount: requested_items.length,
      quotationsCreated: createdQuotations?.length || 0,
    });

    // TODO: Enviar emails para fornecedores com link público
    // await sendQuoteRequestEmails(createdQuotations, requested_items, project);

    return NextResponse.json({
      success: true,
      quotations: createdQuotations,
      message: `${createdQuotations?.length || 0} cotações solicitadas com sucesso!`,
    });
  } catch (error: any) {
    logger.error('Erro ao solicitar cotações', { error: error.message });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
