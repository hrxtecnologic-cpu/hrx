/**
 * =====================================================
 * Contract Service
 * =====================================================
 * Shared logic for contract generation
 * Can be called from both authenticated and public routes
 * =====================================================
 */

import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface GenerateContractOptions {
  projectId: string;
  userId?: string; // Optional - for audit logging
}

interface GenerateContractResult {
  success: boolean;
  message: string;
  contract?: {
    id: string;
    contractNumber: string;
    projectId: string;
    status: string;
    totalValue: number;
    createdAt: string;
  };
  contractData?: any;
  error?: string;
}

export async function generateContract(
  options: GenerateContractOptions
): Promise<GenerateContractResult> {
  try {
    const { projectId, userId = 'system' } = options;

    if (!projectId) {
      return { success: false, message: 'projectId é obrigatório', error: 'MISSING_PROJECT_ID' };
    }

    // Use admin client to bypass RLS
    const supabase = supabaseAdmin;

    // 1. Buscar projeto completo
    const { data: project, error: projectError } = await supabase
      .from('event_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return { success: false, message: 'Projeto não encontrado', error: 'PROJECT_NOT_FOUND' };
    }

    // Verificar se projeto foi aprovado
    if (project.status !== 'approved') {
      return {
        success: false,
        message: 'Contrato só pode ser gerado após aprovação da proposta',
        error: 'PROJECT_NOT_APPROVED',
      };
    }

    // 2. Buscar equipe
    const { data: team } = await supabase
      .from('project_team')
      .select(`
        *,
        professional:professionals(
          full_name,
          categories
        )
      `)
      .eq('project_id', projectId);

    // 3. Buscar equipamentos
    const { data: equipment } = await supabase
      .from('project_equipment')
      .select('*')
      .eq('project_id', projectId);

    // 4. Preparar dados do contrato
    const teamMembers = (team || []).map((member: any) => ({
      category: member.category || member.professional?.categories?.[0] || 'Profissional',
      quantity: member.quantity || 1,
      dailyRate: member.daily_rate || 0,
      durationDays: member.duration_days || 1,
      total: member.total_cost || 0,
    }));

    const equipmentItems = (equipment || []).map((item: any) => ({
      name: item.name,
      category: item.category,
      quantity: item.quantity || 1,
      durationDays: item.duration_days || 1,
      dailyRate: item.daily_rate || 0,
      total: item.total_cost || 0,
    }));

    const totalTeam = teamMembers.reduce((sum, m) => sum + m.total, 0);
    const totalEquipment = equipmentItems.reduce((sum, e) => sum + e.total, 0);
    const totalValue = project.total_client_price || totalTeam + totalEquipment;

    const contractData = {
      contractNumber: '', // Será gerado pelo trigger
      projectNumber: project.project_number,
      clientName: project.client_name,
      clientEmail: project.client_email || '',
      clientPhone: project.client_phone,
      clientCompany: project.client_company,
      clientCnpj: project.client_cnpj,
      eventName: project.event_name,
      eventDate: project.event_date,
      eventType: project.event_type,
      venueName: project.venue_name,
      venueAddress: project.venue_address,
      venueCity: project.venue_city,
      venueState: project.venue_state,
      teamMembers,
      equipment: equipmentItems,
      totalTeam,
      totalEquipment,
      totalValue,
      paymentTerms: '50% antecipado, 50% após o evento',
      specialClauses: project.additional_notes || '',
      generatedAt: new Date().toISOString(),
    };

    // 5. Verificar se já existe contrato para este projeto
    const { data: existingContract } = await supabase
      .from('contracts')
      .select('id, contract_number, pdf_url, status')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingContract && existingContract.status !== 'cancelled') {
      return {
        success: true,
        message: 'Contrato já existe para este projeto',
        contract: {
          id: existingContract.id,
          contractNumber: existingContract.contract_number,
          projectId: projectId,
          status: existingContract.status,
          totalValue: totalValue,
          createdAt: existingContract.created_at || new Date().toISOString(),
        },
      };
    }

    // 6. Criar registro do contrato no banco
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .insert({
        project_id: projectId,
        contract_type: 'service_agreement',
        status: 'draft',
        contract_data: contractData,
        total_value: totalValue,
        payment_terms: contractData.paymentTerms,
        special_clauses: contractData.specialClauses,
        created_by: userId,
      })
      .select()
      .single();

    if (contractError || !contract) {
      console.error('Erro ao criar contrato:', contractError);
      return {
        success: false,
        message: 'Erro ao criar registro do contrato',
        error: 'DATABASE_ERROR',
      };
    }

    // 7. Log de auditoria
    await supabase.from('contract_audit_log').insert({
      contract_id: contract.id,
      action: 'generated',
      performed_by: userId,
    });

    return {
      success: true,
      message: 'Contrato gerado com sucesso',
      contract: {
        id: contract.id,
        contractNumber: contract.contract_number,
        projectId: contract.project_id,
        status: contract.status,
        totalValue: contract.total_value,
        createdAt: contract.created_at,
      },
      contractData,
    };
  } catch (error: any) {
    console.error('[contract-service] Erro ao gerar contrato:', error);
    return {
      success: false,
      message: error.message || 'Erro interno do servidor',
      error: 'INTERNAL_ERROR',
    };
  }
}
