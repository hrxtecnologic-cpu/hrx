import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { sendTeamCompleteEmail } from '@/lib/resend/emails';
import { eventsConflict } from '@/lib/conflicts';

// GET - Get allocations for a request
export async function GET(
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

    const { data, error } = await supabase
      .from('event_allocations')
      .select('*')
      .eq('request_id', id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error;
    }

    return NextResponse.json(data || {});
  } catch (error) {
    console.error('Erro ao buscar alocações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar alocações' },
      { status: 500 }
    );
  }
}

// POST - Save allocations for a request
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const { allocations } = await req.json();

    if (!allocations || !Array.isArray(allocations)) {
      return NextResponse.json(
        { error: 'Alocações inválidas' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // VALIDAÇÃO DE CONFLITOS: Verificar se profissionais já estão alocados em outros eventos
    // Buscar detalhes do evento atual
    const { data: currentRequest, error: currentError } = await supabase
      .from('contractor_requests')
      .select('start_date, end_date, start_time, end_time, event_name')
      .eq('id', id)
      .single();

    if (currentError || !currentRequest) {
      console.error('❌ Erro ao buscar evento atual:', currentError);
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    // Coletar todos os IDs de profissionais sendo alocados
    const professionalIds: string[] = [];
    allocations.forEach((allocation: any) => {
      if (allocation.selectedProfessionals && Array.isArray(allocation.selectedProfessionals)) {
        professionalIds.push(...allocation.selectedProfessionals);
      }
    });

    if (professionalIds.length > 0) {
      // Buscar todas as alocações existentes que envolvem esses profissionais
      const { data: existingAllocations, error: allocError } = await supabase
        .from('event_allocations')
        .select(`
          id,
          request_id,
          allocations,
          contractor_requests!inner (
            event_name,
            start_date,
            end_date,
            start_time,
            end_time
          )
        `)
        .neq('request_id', id); // Excluir o evento atual

      if (allocError) {
        console.error('❌ Erro ao verificar conflitos:', allocError);
        // Não falhar se erro ao verificar conflitos, apenas logar
      } else if (existingAllocations && existingAllocations.length > 0) {
        // Verificar cada alocação existente
        for (const existingAlloc of existingAllocations) {
          const otherRequest = existingAlloc.contractor_requests as any;

          // Verificar se há conflito de horário
          const hasConflict = eventsConflict(currentRequest, otherRequest);

          if (hasConflict) {
            // Verificar se algum profissional sendo alocado já está neste evento
            const existingAllocArray = existingAlloc.allocations as any[];
            if (Array.isArray(existingAllocArray)) {
              for (const alloc of existingAllocArray) {
                if (alloc.selectedProfessionals && Array.isArray(alloc.selectedProfessionals)) {
                  const conflictingProfessionals = alloc.selectedProfessionals.filter(
                    (profId: string) => professionalIds.includes(profId)
                  );

                  if (conflictingProfessionals.length > 0) {
                    // Encontrou conflito! Buscar nome do profissional para mensagem mais clara
                    const { data: professional } = await supabase
                      .from('professionals')
                      .select('full_name')
                      .eq('id', conflictingProfessionals[0])
                      .single();

                    return NextResponse.json(
                      {
                        error: 'Conflito de horário detectado',
                        details: `O profissional ${professional?.full_name || 'selecionado'} já está alocado no evento "${otherRequest.event_name}" no mesmo período (${new Date(otherRequest.start_date).toLocaleDateString('pt-BR')} - ${otherRequest.start_time}).`,
                        conflictingEvent: otherRequest.event_name,
                      },
                      { status: 409 }
                    );
                  }
                }
              }
            }
          }
        }
      }
    }

    // Verificar se já existe alocação
    const { data: existing } = await supabase
      .from('event_allocations')
      .select('id')
      .eq('request_id', id)
      .single();

    if (existing) {
      // Atualizar
      const { error } = await supabase
        .from('event_allocations')
        .update({
          allocations,
          updated_at: new Date().toISOString(),
        })
        .eq('request_id', id);

      if (error) throw error;
    } else {
      // Criar
      const { error } = await supabase
        .from('event_allocations')
        .insert([{
          request_id: id,
          allocations,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);

      if (error) throw error;
    }

    // Verificar se todas as posições foram preenchidas
    const { data: request } = await supabase
      .from('contractor_requests')
      .select('*')
      .eq('id', id)
      .single();

    let allPositionsFilled = false;

    if (request && request.professionals_needed) {
      const professionalsNeeded = request.professionals_needed as any[];
      allPositionsFilled = true;

      for (const needed of professionalsNeeded) {
        const allocation = allocations.find(
          (a: any) => a.category === needed.category && a.shift === needed.shift
        );

        if (!allocation || allocation.selectedProfessionals.length < needed.quantity) {
          allPositionsFilled = false;
          break;
        }
      }

      // Se todas as posições foram preenchidas, notificar o contratante
      if (allPositionsFilled) {
        const emailResult = await sendTeamCompleteEmail({
          contractorEmail: request.email,
          companyName: request.company_name,
          eventName: request.event_name,
          eventType: request.event_type,
          startDate: request.start_date,
          endDate: request.end_date,
          venueCity: request.venue_city,
          venueState: request.venue_state,
          professionalsNeeded,
          allocations,
        });

        if (!emailResult.success) {
          console.error('❌ Erro ao enviar email para contratante:', emailResult.error);
          // Não falhar a operação se o email não for enviado
        }
      }
    }

    return NextResponse.json({ success: true, allPositionsFilled });
  } catch (error) {
    console.error('Erro ao salvar alocações:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar alocações' },
      { status: 500 }
    );
  }
}
