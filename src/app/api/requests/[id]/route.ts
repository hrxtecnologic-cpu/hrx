import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { requestSchema } from '@/lib/validations/contractor';
import { z } from 'zod';

// Cliente Supabase com service_role para bypass do RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Buscar solicitação por ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    const { data, error } = await supabase
      .from('contractor_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se o usuário tem permissão para ver esta solicitação
    // (ou é o dono ou é admin)
    if (userId && data.clerk_id !== userId) {
      // Verificar se é admin
      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('clerk_id', userId)
        .single();

      if (!user || user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Sem permissão para acessar esta solicitação' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar solicitação:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar solicitação' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar solicitação
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se a solicitação existe e pertence ao usuário
    const { data: existingRequest } = await supabase
      .from('contractor_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      );
    }

    if (existingRequest.clerk_id !== userId) {
      return NextResponse.json(
        { error: 'Sem permissão para editar esta solicitação' },
        { status: 403 }
      );
    }

    // Parse e valida o body
    const body = await request.json();

    let validatedData;
    try {
      validatedData = requestSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Dados inválidos', details: error.issues },
          { status: 400 }
        );
      }
      throw error;
    }

    // Atualizar a solicitação
    const { data: updatedRequest, error: updateError } = await supabase
      .from('contractor_requests')
      .update({
        // Dados da empresa
        company_name: validatedData.companyName,
        cnpj: validatedData.cnpj,
        responsible_name: validatedData.responsibleName,
        responsible_role: validatedData.responsibleRole || null,
        email: validatedData.email,
        phone: validatedData.phone,
        accepts_whatsapp: validatedData.acceptsWhatsApp,
        website: validatedData.website || null,
        company_address: validatedData.companyAddress || null,

        // Dados do evento
        event_name: validatedData.eventName,
        event_type: validatedData.eventType,
        event_description: validatedData.eventDescription || null,
        start_date: validatedData.startDate,
        start_time: validatedData.startTime || null,
        end_date: validatedData.endDate,
        end_time: validatedData.endTime || null,

        // Local do evento
        venue_name: validatedData.venueName || null,
        venue_address: validatedData.venueAddress,
        venue_city: validatedData.venueCity,
        venue_state: validatedData.venueState,
        expected_attendance: validatedData.expectedAttendance || null,

        // Profissionais
        professionals_needed: validatedData.professionalsNeeded,

        // Equipamentos
        needs_equipment: validatedData.needsEquipment,
        equipment_list: validatedData.needsEquipment ? validatedData.equipmentList : [],
        equipment_other: validatedData.needsEquipment ? (validatedData.equipmentOther || null) : null,
        equipment_notes: validatedData.needsEquipment ? (validatedData.equipmentNotes || null) : null,

        // Orçamento e urgência
        budget_range: validatedData.budgetRange || null,
        urgency: validatedData.urgency,

        // Observações
        additional_notes: validatedData.additionalNotes || null,

        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar solicitação:', updateError);
      throw new Error('Erro ao atualizar solicitação no banco de dados');
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest,
    });
  } catch (error) {
    console.error('Erro ao atualizar solicitação:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}
