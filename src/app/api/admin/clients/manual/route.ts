/**
 * =====================================================
 * API: Cadastro Manual de Clientes e Projetos (Admin)
 * =====================================================
 * Cria cliente e projeto manualmente
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAdmin } from '@/lib/api';

export const POST = withAdmin(async (userId: string, request: NextRequest) => {
  try {
    const data = await request.json();

    const {
      client_name,
      client_email,
      client_phone,
      client_company,
      event_name,
      event_type,
      event_description,
      event_date,
      start_time,
      expected_attendance,
      venue_address,
      venue_city,
      venue_state,
      client_budget,
      is_urgent,
      additional_notes,
      professionals,
      equipment,
    } = data;

    // Validações
    if (!client_name || !client_email || !client_phone) {
      return NextResponse.json(
        { error: 'Dados do cliente são obrigatórios' },
        { status: 400 }
      );
    }

    if (!event_name || !event_type || !event_description) {
      return NextResponse.json(
        { error: 'Dados do evento são obrigatórios' },
        { status: 400 }
      );
    }

    if (!professionals || professionals.length === 0) {
      return NextResponse.json(
        { error: 'Adicione pelo menos um profissional' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Gerar número do projeto
    const projectNumber = `PRJ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;

    // Criar projeto
    const { data: project, error: projectError } = await supabase
      .from('event_projects')
      .insert({
        project_number: projectNumber,
        client_name,
        client_email,
        client_phone,
        client_company,
        event_name,
        event_type,
        event_description,
        event_date,
        start_time,
        expected_attendance,
        venue_address,
        venue_city,
        venue_state,
        client_budget,
        is_urgent: is_urgent || false,
        additional_notes,
        status: 'new',
        created_by_admin: true,
        created_by_admin_id: userId,
      })
      .select()
      .single();

    if (projectError) {
      console.error('[manual-client] Erro ao criar projeto:', projectError);
      return NextResponse.json(
        { error: 'Erro ao criar projeto', details: projectError.message },
        { status: 500 }
      );
    }

    console.log('[manual-client] Projeto criado:', project.id);

    // Adicionar profissionais ao projeto
    if (professionals && professionals.length > 0) {
      const teamMembers = professionals.map((prof: any) => ({
        project_id: project.id,
        category: prof.category,
        subcategory: prof.category_group,
        quantity: prof.quantity,
        role: prof.requirements || '',
        status: 'pending',
      }));

      const { error: teamError } = await supabase
        .from('project_team')
        .insert(teamMembers);

      if (teamError) {
        console.error('[manual-client] Erro ao adicionar profissionais:', teamError);
      }
    }

    // Adicionar equipamentos ao projeto
    if (equipment && equipment.length > 0) {
      const equipmentItems = equipment.map((equip: any) => ({
        project_id: project.id,
        category: equip.equipment_group,
        equipment_type: equip.equipment_type,
        quantity: equip.quantity,
        daily_rate: equip.estimated_daily_rate || 0,
        description: equip.notes || '',
        status: 'pending',
      }));

      const { error: equipmentError } = await supabase
        .from('project_equipment')
        .insert(equipmentItems);

      if (equipmentError) {
        console.error('[manual-client] Erro ao adicionar equipamentos:', equipmentError);
      }
    }

    return NextResponse.json({
      success: true,
      projectId: project.id,
      projectNumber: project.project_number,
    });
  } catch (error: any) {
    console.error('[manual-client] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
});
