import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { AddEquipmentData } from '@/types/event-project';

// Force dynamic route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =============================================
// POST /api/admin/event-projects/[id]/equipment - Adicionar equipamento
// =============================================
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string | null = null;
  let projectId: string | null = null;

  try {
    // Verificar autenticação
    const authResult = await auth();
    userId = authResult.userId;

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

    const resolvedParams = await params;
    projectId = resolvedParams.id;
    const body: any = await req.json();

    logger.info('📦 Request recebido para adicionar equipamento', {
      projectId,
      userId,
      body,
    });

    // Validações
    if (!body.name || !body.category) {
      logger.error('Validação falhou: nome ou categoria ausente', { body });
      return NextResponse.json(
        { error: 'Nome e categoria são obrigatórios' },
        { status: 400 }
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

    // Verificar se pode adicionar equipamentos neste status
    const editableStatuses = ['new', 'analyzing', 'quoting', 'quoted', 'proposed'];
    if (!editableStatuses.includes(project.status)) {
      return NextResponse.json(
        {
          error: `Não é possível adicionar equipamentos em projetos com status "${project.status}"`,
        },
        { status: 400 }
      );
    }

    // Adicionar equipamento
    const insertData = {
      project_id: projectId,
      selected_supplier_id: body.supplier_id || null, // ✅ Nome correto da coluna
      equipment_type: body.category, // equipment_type é obrigatório, usar category
      name: body.name,
      category: body.category,
      description: body.description || null,
      quantity: body.quantity || 1,
      duration_days: body.duration_days || 1,
      daily_rate: body.daily_rate || null,
      total_cost: body.daily_rate ? (body.quantity || 1) * (body.duration_days || 1) * body.daily_rate : null,
      status: 'requested', // ✅ Status padrão conforme tabela
    };

    logger.info('📝 Tentando inserir equipamento', { insertData });

    const { data: equipment, error: insertError } = await supabase
      .from('project_equipment')
      .insert([insertData])
      .select()
      .single();

    if (insertError) {
      logger.error('Erro ao adicionar equipamento', {
        error: insertError,
        errorMessage: insertError.message,
        errorDetails: insertError.details,
        errorCode: insertError.code,
        projectId,
        userId,
      });
      return NextResponse.json({
        error: insertError.message || insertError.details || 'Erro ao adicionar equipamento',
        details: insertError
      }, { status: 500 });
    }

    logger.info('Equipamento adicionado ao projeto', {
      userId,
      projectId,
      equipmentId: equipment.id,
      name: body.name,
      category: body.category,
    });

    return NextResponse.json({
      success: true,
      equipment,
    });
  } catch (error: any) {
    logger.error('Erro ao adicionar equipamento', {
      error: error.message,
      errorType: typeof error,
      errorString: String(error),
      stack: error.stack,
    });
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        message: error.message || String(error),
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// =============================================
// PATCH /api/admin/event-projects/[id]/equipment - Atualizar equipamento
// =============================================
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string | null = null;
  let projectId: string | null = null;

  try {
    // Verificar autenticação
    const authResult = await auth();
    userId = authResult.userId;

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

    const resolvedParams = await params;
    projectId = resolvedParams.id;
    const { searchParams } = new URL(req.url);
    const equipmentId = searchParams.get('equipment_id');

    if (!equipmentId) {
      return NextResponse.json(
        { error: 'ID do equipamento é obrigatório' },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Campos permitidos para atualização
    const allowedFields = [
      'name',
      'description',
      'quantity',
      'duration_days',
      'specifications',
      'notes',
      'status',
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar' },
        { status: 400 }
      );
    }

    // Atualizar equipamento
    const { data, error } = await supabase
      .from('project_equipment')
      .update(updateData)
      .eq('id', equipmentId)
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) {
      logger.error('Erro ao atualizar equipamento', {
        error: error.message,
        equipmentId,
        userId,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logger.info('Equipamento atualizado', {
      userId,
      projectId,
      equipmentId,
      updatedFields: Object.keys(updateData),
    });

    return NextResponse.json({ success: true, equipment: data });
  } catch (error: any) {
    logger.error('Erro ao atualizar equipamento', { error: error.message });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// =============================================
// DELETE /api/admin/event-projects/[id]/equipment - Remover equipamento
// =============================================
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string | null = null;
  let projectId: string | null = null;

  try {
    // Verificar autenticação
    const authResult = await auth();
    userId = authResult.userId;

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

    const resolvedParams = await params;
    projectId = resolvedParams.id;
    const { searchParams } = new URL(req.url);
    const equipmentId = searchParams.get('equipment_id');

    if (!equipmentId) {
      return NextResponse.json(
        { error: 'ID do equipamento é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se tem cotações associadas
    const { data: quotations, error: quotationsError } = await supabase
      .from('supplier_quotations')
      .select('id')
      .eq('equipment_id', equipmentId);

    if (quotationsError) {
      logger.error('Erro ao verificar cotações', {
        error: quotationsError.message,
        equipmentId,
      });
    }

    // Se tem cotações, não permitir deletar
    if (quotations && quotations.length > 0) {
      return NextResponse.json(
        {
          error: `Não é possível remover equipamento com ${quotations.length} cotação(ões) associada(s). Cancele as cotações primeiro.`,
        },
        { status: 400 }
      );
    }

    // Deletar equipamento
    const { error } = await supabase
      .from('project_equipment')
      .delete()
      .eq('id', equipmentId)
      .eq('project_id', projectId);

    if (error) {
      logger.error('Erro ao remover equipamento', {
        error: error.message,
        equipmentId,
        userId,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logger.info('Equipamento removido', {
      userId,
      projectId,
      equipmentId,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Erro ao remover equipamento', { error: error.message });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
