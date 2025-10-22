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
  { params }: { params: { id: string } }
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
    const body: AddEquipmentData = await req.json();

    // Validações
    if (!body.name || !body.category) {
      return NextResponse.json(
        { error: 'Nome e categoria são obrigatórios' },
        { status: 400 }
      );
    }

    if (!body.equipment_type) {
      return NextResponse.json(
        { error: 'Tipo de equipamento é obrigatório' },
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
    const { data: equipment, error: insertError } = await supabase
      .from('project_equipment')
      .insert([
        {
          project_id: projectId,
          equipment_type: body.equipment_type,
          category: body.category,
          subcategory: body.subcategory,
          name: body.name,
          description: body.description,
          quantity: body.quantity || 1,
          duration_days: body.duration_days || 1,
          specifications: body.specifications || {},
          notes: body.notes,
          status: 'requested',
        },
      ])
      .select()
      .single();

    if (insertError) {
      logger.error('Erro ao adicionar equipamento', {
        error: insertError.message,
        projectId,
        userId,
      });
      return NextResponse.json({ error: insertError.message }, { status: 500 });
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
    logger.error('Erro ao adicionar equipamento', { error: error.message });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// =============================================
// PATCH /api/admin/event-projects/[id]/equipment - Atualizar equipamento
// =============================================
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
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
      .eq('project_id', params.id)
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
      projectId: params.id,
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
  { params }: { params: { id: string } }
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
      .eq('project_id', params.id);

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
      projectId: params.id,
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
