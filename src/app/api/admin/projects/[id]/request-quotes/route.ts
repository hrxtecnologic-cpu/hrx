import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

/**
 * POST /api/admin/projects/[id]/request-quotes
 *
 * Solicita orçamentos de fornecedores para um projeto
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id: projectId } = await params;
    const { supplier_ids, equipment_items, valid_days = 7 } = await req.json();

    if (!supplier_ids || supplier_ids.length === 0) {
      return NextResponse.json(
        { error: 'Selecione pelo menos um fornecedor' },
        { status: 400 }
      );
    }

    if (!equipment_items || equipment_items.length === 0) {
      return NextResponse.json(
        { error: 'Adicione pelo menos um equipamento' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Buscar dados do projeto
    const { data: project, error: projectError } = await supabase
      .from('event_projects')
      .select('id, project_number, event_name, event_date, venue_address, venue_city, venue_state')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    // Buscar dados dos fornecedores
    const { data: suppliers, error: suppliersError } = await supabase
      .from('equipment_suppliers')
      .select('id, company_name, contact_name, email')
      .in('id', supplier_ids);

    if (suppliersError || !suppliers || suppliers.length === 0) {
      return NextResponse.json(
        { error: 'Fornecedores não encontrados' },
        { status: 404 }
      );
    }

    // Calcular data de validade
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + valid_days);

    // Criar solicitações de orçamento
    const quotations = suppliers.map(supplier => ({
      project_id: projectId,
      supplier_id: supplier.id,
      token: nanoid(32),
      requested_items: equipment_items,
      status: 'pending',
      valid_until: validUntil.toISOString(),
    }));

    const { data: createdQuotations, error: createError } = await supabase
      .from('supplier_quotations')
      .insert(quotations)
      .select();

    if (createError) {
      console.error('❌ Erro ao criar solicitações:', createError);
      return NextResponse.json(
        { error: 'Erro ao criar solicitações de orçamento' },
        { status: 500 }
      );
    }

    // TODO: Enviar emails para fornecedores
    // Por enquanto, apenas retorna sucesso
    console.log(`✅ ${createdQuotations.length} solicitações de orçamento criadas`);

    // Enviar emails em paralelo (não bloqueia resposta)
    Promise.all(
      createdQuotations.map(async (quotation, index) => {
        const supplier = suppliers[index];
        const quoteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/orcamento/${quotation.token}`;

        // TODO: Implementar envio de email
        console.log(`📧 Email para ${supplier.email}: ${quoteUrl}`);

        // Aqui você adicionaria a chamada para sendSupplierQuoteRequest()
      })
    ).catch(error => {
      console.error('❌ Erro ao enviar emails:', error);
    });

    return NextResponse.json({
      success: true,
      message: `Solicitações enviadas para ${createdQuotations.length} fornecedores`,
      quotations: createdQuotations,
    });
  } catch (error: any) {
    console.error('❌ Erro ao solicitar orçamentos:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
