import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { sendSupplierQuoteRequest } from '@/lib/resend/emails';

// GET - Get equipment allocations for a request
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
      .from('equipment_allocations')
      .select('*')
      .eq('request_id', id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error;
    }

    return NextResponse.json(data || {});
  } catch (error) {
    console.error('Erro ao buscar alocações de equipamentos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar alocações de equipamentos' },
      { status: 500 }
    );
  }
}

// POST - Save equipment allocations for a request
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
    const { allocations, notes } = await req.json();

    if (!allocations || !Array.isArray(allocations)) {
      return NextResponse.json(
        { error: 'Alocações inválidas' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Buscar detalhes da solicitação
    const { data: request, error: requestError } = await supabase
      .from('contractor_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (requestError || !request) {
      console.error('❌ Erro ao buscar solicitação:', requestError);
      return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 });
    }

    // Verificar se já existe alocação
    const { data: existing } = await supabase
      .from('equipment_allocations')
      .select('id')
      .eq('request_id', id)
      .single();

    if (existing) {
      // Atualizar
      const { error } = await supabase
        .from('equipment_allocations')
        .update({
          allocations,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('request_id', id);

      if (error) throw error;
    } else {
      // Criar
      const { error } = await supabase
        .from('equipment_allocations')
        .insert([{
          request_id: id,
          allocations,
          notes: notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);

      if (error) throw error;
    }

    // Enviar emails para os fornecedores selecionados
    const supplierIds: string[] = [];
    allocations.forEach((allocation: any) => {
      if (allocation.supplierId) {
        if (!supplierIds.includes(allocation.supplierId)) {
          supplierIds.push(allocation.supplierId);
        }
      }
    });

    if (supplierIds.length > 0) {
      // Buscar detalhes dos fornecedores
      const { data: suppliers, error: suppliersError } = await supabase
        .from('equipment_suppliers')
        .select('id, contact_name, email')
        .in('id', supplierIds);

      if (suppliersError) {
        console.error('❌ Erro ao buscar fornecedores:', suppliersError);
      } else if (suppliers && suppliers.length > 0) {
        // Enviar email para cada fornecedor com seus equipamentos
        for (const supplier of suppliers) {
          const supplierEquipment = allocations.filter(
            (a: any) => a.supplierId === supplier.id
          );

          if (supplierEquipment.length > 0) {
            const equipmentList = supplierEquipment.map((item: any) => ({
              item: item.equipmentName || item.item || 'Equipamento',
              quantity: item.quantity || 1,
              estimatedBudget: item.estimatedBudget || 0,
            }));

            const emailResult = await sendSupplierQuoteRequest({
              supplierEmail: supplier.email,
              supplierName: supplier.contact_name,
              companyName: request.company_name,
              eventName: request.event_name,
              eventType: request.event_type,
              startDate: request.start_date,
              endDate: request.end_date,
              venueCity: request.venue_city,
              venueState: request.venue_state,
              venueName: request.venue_name,
              venueAddress: request.venue_address,
              equipmentList,
              additionalNotes: notes || undefined,
            });

            if (!emailResult.success) {
              console.error(`❌ Erro ao enviar email para fornecedor ${supplier.email}:`, emailResult.error);
              // Não falhar a operação se o email não for enviado
            }
          }
        }
      }
    }

    console.log('✅ Alocações de equipamentos salvas com sucesso');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar alocações de equipamentos:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar alocações de equipamentos' },
      { status: 500 }
    );
  }
}
