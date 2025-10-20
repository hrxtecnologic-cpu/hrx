import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { sendProfessionalAllocationEmail } from '@/lib/resend/emails';

// POST - Send notifications to allocated professionals
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
    const supabase = await createClient();

    // Buscar solicitação e alocações
    const [{ data: request }, { data: allocations }] = await Promise.all([
      supabase.from('contractor_requests').select('*').eq('id', id).single(),
      supabase.from('event_allocations').select('*').eq('request_id', id).single(),
    ]);

    if (!request) {
      return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 });
    }

    console.log('📋 Allocations found:', allocations);

    if (!allocations || !allocations.allocations) {
      console.log('❌ Nenhuma alocação salva ainda');
      return NextResponse.json({
        error: 'Você precisa salvar as alocações antes de notificar os profissionais',
        hint: 'Clique em "Salvar Alocações" primeiro'
      }, { status: 400 });
    }

    // Coletar todos os IDs de profissionais selecionados
    const professionalIds: string[] = [];
    allocations.allocations.forEach((allocation: any) => {
      if (allocation.selectedProfessionals) {
        professionalIds.push(...allocation.selectedProfessionals);
      }
    });

    console.log('👥 Professional IDs to notify:', professionalIds);

    if (professionalIds.length === 0) {
      console.log('❌ Nenhum profissional selecionado nas alocações');
      return NextResponse.json({
        error: 'Nenhum profissional foi selecionado nas alocações',
        hint: 'Selecione pelo menos um profissional e salve as alocações'
      }, { status: 400 });
    }

    // Buscar informações dos profissionais
    const { data: professionals } = await supabase
      .from('professionals')
      .select('id, full_name, email')
      .in('id', professionalIds);

    if (!professionals || professionals.length === 0) {
      return NextResponse.json({ error: 'Profissionais não encontrados' }, { status: 404 });
    }

    // Preparar notificações para salvar no banco
    const notifications = professionals.map(prof => ({
      professional_id: prof.id,
      request_id: id,
      type: 'event_allocation',
      title: `Você foi alocado para: ${request.event_name}`,
      message: `Olá ${prof.full_name}! Você foi selecionado para trabalhar no evento "${request.event_name}" da empresa ${request.company_name}.\n\nData: ${new Date(request.start_date).toLocaleDateString('pt-BR')}\nLocal: ${request.venue_city}, ${request.venue_state}\n\nEm breve você receberá mais detalhes.`,
      sent_at: new Date().toISOString(),
      read: false,
    }));

    // Salvar notificações no banco
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notificationError) {
      console.error('Erro ao salvar notificações:', notificationError);
      // Não falhar se erro ao salvar notificações, apenas logar
    }

    // Enviar emails usando as funções helper
    const emailPromises = professionals.map(async (prof) => {
      const result = await sendProfessionalAllocationEmail({
        professionalName: prof.full_name,
        professionalEmail: prof.email,
        eventName: request.event_name,
        companyName: request.company_name,
        eventType: request.event_type,
        startDate: request.start_date,
        endDate: request.end_date,
        venueName: request.venue_name,
        venueAddress: request.venue_address,
        venueCity: request.venue_city,
        venueState: request.venue_state,
      });

      return { ...result, email: prof.email };
    });

    const emailResults = await Promise.allSettled(emailPromises);
    const successfulEmails = emailResults.filter(
      r => r.status === 'fulfilled' && r.value.success
    ).length;

    console.log(`📧 Emails enviados: ${successfulEmails}/${professionals.length}`);

    return NextResponse.json({
      success: true,
      notified: professionals.length,
      emailsSent: successfulEmails,
      professionals: professionals.map(p => ({ id: p.id, name: p.full_name, email: p.email }))
    });
  } catch (error) {
    console.error('Erro ao enviar notificações:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar notificações' },
      { status: 500 }
    );
  }
}
