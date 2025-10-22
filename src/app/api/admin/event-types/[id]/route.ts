import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// PUT - Update event type
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verificar se outro registro já tem esse nome
    const { data: existing } = await supabase
      .from('event_types')
      .select('id')
      .eq('name', name)
      .neq('id', id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Já existe um tipo de evento com esse nome' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('event_types')
      .update({ name, description })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao atualizar tipo de evento:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar tipo de evento' },
      { status: 500 }
    );
  }
}

// DELETE - Delete event type
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    // ========== Buscar nome do tipo de evento antes de deletar ==========
    const { data: eventType, error: fetchError } = await supabase
      .from('event_types')
      .select('name')
      .eq('id', id)
      .single();

    if (fetchError || !eventType) {
      return NextResponse.json(
        { error: 'Tipo de evento não encontrado' },
        { status: 404 }
      );
    }

    // ========== Verificar se tipo de evento está em uso ==========
    // Event type é usado nas tabelas: contractor_requests e requests

    // Verificar contractor_requests
    const { data: contractorRequests, error: checkContractorError } = await supabase
      .from('contractor_requests')
      .select('id, event_name, event_type')
      .eq('event_type', eventType.name)
      .limit(1);

    if (checkContractorError) {
      throw checkContractorError;
    }

    // Verificar requests
    const { data: requests, error: checkRequestsError } = await supabase
      .from('requests')
      .select('id, event_name, event_type')
      .eq('event_type', eventType.name)
      .limit(1);

    if (checkRequestsError) {
      throw checkRequestsError;
    }

    const isInUse = (contractorRequests && contractorRequests.length > 0) ||
                    (requests && requests.length > 0);

    if (isInUse) {
      // Contar total de usos
      const { count: contractorCount } = await supabase
        .from('contractor_requests')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', eventType.name);

      const { count: requestsCount } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', eventType.name);

      const totalUses = (contractorCount || 0) + (requestsCount || 0);

      return NextResponse.json(
        {
          error: 'Tipo de evento em uso',
          message: `Este tipo de evento não pode ser deletado pois está sendo usado em ${totalUses} solicitação(ões).`,
          details: {
            totalUses,
            contractorRequests: contractorCount || 0,
            requests: requestsCount || 0,
            eventTypeName: eventType.name,
          }
        },
        { status: 409 }
      );
    }

    // ========== Deletar tipo de evento (não está em uso) ==========
    const { error } = await supabase
      .from('event_types')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: `Tipo de evento "${eventType.name}" deletado com sucesso`
    });
  } catch (error) {
    console.error('Erro ao deletar tipo de evento:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar tipo de evento' },
      { status: 500 }
    );
  }
}
