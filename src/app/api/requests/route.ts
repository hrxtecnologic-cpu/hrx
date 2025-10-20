import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { requestSchema } from '@/lib/validations/contractor';
import { sendRequestEmails } from '@/lib/resend/emails';
import { z } from 'zod';

// Cliente Supabase com service_role para bypass do RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // 1. Verificar se usuário está logado (opcional)
    const { userId } = await auth();
    console.log('🔐 Usuário logado:', userId ? `Sim (${userId})` : 'Não (público)');

    // 2. Parse e valida o body
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

    // 2. Verifica se o contratante já existe (pelo CNPJ)
    const { data: existingContractor } = await supabase
      .from('contractors')
      .select('id')
      .eq('cnpj', validatedData.cnpj)
      .single();

    let contractorId: string;

    if (existingContractor) {
      // Contratante já existe, atualiza os dados
      const { data: updatedContractor, error: updateError } = await supabase
        .from('contractors')
        .update({
          company_name: validatedData.companyName,
          responsible_name: validatedData.responsibleName,
          responsible_role: validatedData.responsibleRole || null,
          email: validatedData.email,
          phone: validatedData.phone,
          company_address: validatedData.companyAddress || null,
          website: validatedData.website || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingContractor.id)
        .select('id')
        .single();

      if (updateError) {
        console.error('Erro ao atualizar contratante:', updateError);
        throw new Error('Erro ao atualizar dados do contratante');
      }

      contractorId = updatedContractor.id;
    } else {
      // Cria novo contratante
      const { data: newContractor, error: insertError } = await supabase
        .from('contractors')
        .insert({
          company_name: validatedData.companyName,
          cnpj: validatedData.cnpj,
          responsible_name: validatedData.responsibleName,
          responsible_role: validatedData.responsibleRole || null,
          email: validatedData.email,
          phone: validatedData.phone,
          company_address: validatedData.companyAddress || null,
          website: validatedData.website || null,
          status: 'active',
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Erro ao criar contratante:', insertError);
        throw new Error('Erro ao criar contratante no banco de dados');
      }

      contractorId = newContractor.id;
    }

    // 3. Cria a solicitação em contractor_requests (tabela correta do admin)
    const { data: newRequest, error: requestError } = await supabase
      .from('contractor_requests')
      .insert({
        // Vínculo com usuário (se logado)
        clerk_id: userId || null,

        // Dados da empresa
        company_name: validatedData.companyName,
        cnpj: validatedData.cnpj,
        responsible_name: validatedData.responsibleName,
        responsible_role: validatedData.responsibleRole || null,
        email: validatedData.email,
        phone: validatedData.phone,
        accepts_whatsapp: true, // Adicionar campo no form se necessário
        website: validatedData.website || null,
        company_address: validatedData.companyAddress || null,

        // Dados do evento
        event_name: validatedData.eventName,
        event_type: validatedData.eventType,
        event_description: validatedData.eventDescription || null,
        start_date: validatedData.startDate,
        end_date: validatedData.endDate,
        start_time: validatedData.startTime || null,
        end_time: validatedData.endTime || null,
        expected_attendance: validatedData.expectedAttendance || null,

        // Local
        venue_name: validatedData.venueName || null,
        venue_address: validatedData.venueAddress,
        venue_city: validatedData.venueCity,
        venue_state: validatedData.venueState,
        venue_zip: null,

        // Profissionais e equipamentos
        professionals_needed: validatedData.professionalsNeeded,
        needs_equipment: validatedData.needsEquipment,
        equipment_list: validatedData.equipmentList || [],
        equipment_other: validatedData.equipmentOther || null,
        equipment_notes: validatedData.equipmentNotes || null,

        // Orçamento e observações
        budget_range: validatedData.budgetRange || null,
        urgency: validatedData.urgency,
        additional_notes: validatedData.additionalNotes || null,

        // Status
        status: 'pending',
      })
      .select('id')
      .single();

    if (requestError) {
      console.error('Erro ao criar solicitação:', requestError);
      throw new Error('Erro ao criar solicitação no banco de dados');
    }

    console.log(
      `✅ Solicitação criada com sucesso: ${newRequest.id}`,
      userId ? `(vinculada ao usuário ${userId})` : '(pública, sem vínculo)'
    );

    // 4. Enviar emails (confirmação + notificação admin)
    try {
      const emailResult = await sendRequestEmails({
        contractor: {
          responsibleName: validatedData.responsibleName,
          email: validatedData.email,
          eventName: validatedData.eventName,
          requestNumber: newRequest.id.substring(0, 8), // Usar primeiros 8 chars do UUID
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
          venueAddress: validatedData.venueAddress,
          venueCity: validatedData.venueCity,
          venueState: validatedData.venueState,
          professionalsNeeded: validatedData.professionalsNeeded,
          needsEquipment: validatedData.needsEquipment,
          equipmentList: validatedData.equipmentList,
          budgetRange: validatedData.budgetRange,
          urgency: validatedData.urgency,
        },
        admin: {
          requestNumber: newRequest.id.substring(0, 8),
          requestId: newRequest.id,
          urgency: validatedData.urgency,
          companyName: validatedData.companyName,
          cnpj: validatedData.cnpj,
          responsibleName: validatedData.responsibleName,
          responsibleRole: validatedData.responsibleRole,
          email: validatedData.email,
          phone: validatedData.phone,
          companyAddress: validatedData.companyAddress,
          website: validatedData.website,
          eventName: validatedData.eventName,
          eventType: validatedData.eventType,
          eventTypeOther: validatedData.eventTypeOther,
          eventDescription: validatedData.eventDescription,
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
          startTime: validatedData.startTime,
          endTime: validatedData.endTime,
          expectedAttendance: validatedData.expectedAttendance,
          venueName: validatedData.venueName,
          venueAddress: validatedData.venueAddress,
          venueCity: validatedData.venueCity,
          venueState: validatedData.venueState,
          professionalsNeeded: validatedData.professionalsNeeded,
          needsEquipment: validatedData.needsEquipment,
          equipmentList: validatedData.equipmentList,
          equipmentOther: validatedData.equipmentOther,
          equipmentNotes: validatedData.equipmentNotes,
          budgetRange: validatedData.budgetRange,
          additionalNotes: validatedData.additionalNotes,
          createdAt: new Date().toISOString(),
        },
      });

      if (emailResult.errors.length > 0) {
        console.warn('⚠️ Alguns emails falharam:', emailResult.errors);
      } else {
        console.log('✅ Todos os emails foram enviados com sucesso');
      }
    } catch (emailError) {
      // Log o erro mas não falha a requisição
      console.error('❌ Erro ao enviar emails:', emailError);
    }

    // 5. Retorna sucesso com o ID da solicitação
    return NextResponse.json({
      success: true,
      requestId: newRequest.id,
      message: 'Solicitação enviada com sucesso!',
    });

  } catch (error) {
    console.error('Erro ao processar solicitação:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao processar solicitação',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
