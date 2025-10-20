import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { eventsConflict } from '@/lib/conflicts';

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

    // Buscar detalhes do evento atual
    const { data: currentRequest, error: requestError } = await supabase
      .from('contractor_requests')
      .select('start_date, end_date, start_time, end_time, event_name')
      .eq('id', id)
      .single();

    if (requestError || !currentRequest) {
      console.error('❌ Erro ao buscar solicitação:', requestError);
      return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 });
    }

    // Buscar todas as alocações existentes (exceto do evento atual)
    const { data: allAllocations, error: allocError } = await supabase
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
      .neq('request_id', id);

    if (allocError) {
      console.error('❌ Erro ao buscar alocações:', allocError);
      return NextResponse.json({ error: 'Erro ao buscar alocações' }, { status: 500 });
    }

    // Construir mapa de conflitos: professionalId -> { eventName, dates, times }
    const conflicts: Record<string, {
      eventName: string;
      startDate: string;
      endDate: string;
      startTime: string;
      endTime: string;
    }> = {};

    if (allAllocations && allAllocations.length > 0) {
      for (const allocation of allAllocations) {
        const otherRequest = allocation.contractor_requests as any;

        // Verificar se os eventos têm conflito de horário
        const hasConflict = eventsConflict(currentRequest, otherRequest);

        if (!hasConflict) {
          continue; // Sem conflito, próximo
        }

        // Há conflito de data E horário - marcar profissionais
        const allocationsArray = allocation.allocations as any[];
        if (Array.isArray(allocationsArray)) {
          for (const alloc of allocationsArray) {
            if (alloc.selectedProfessionals && Array.isArray(alloc.selectedProfessionals)) {
              for (const profId of alloc.selectedProfessionals) {
                // Guardar apenas o primeiro conflito encontrado para cada profissional
                if (!conflicts[profId]) {
                  conflicts[profId] = {
                    eventName: otherRequest.event_name,
                    startDate: otherRequest.start_date,
                    endDate: otherRequest.end_date,
                    startTime: otherRequest.start_time,
                    endTime: otherRequest.end_time,
                  };
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ conflicts });
  } catch (error) {
    console.error('❌ Erro ao verificar conflitos:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar conflitos' },
      { status: 500 }
    );
  }
}
