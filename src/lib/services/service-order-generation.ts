/**
 * =====================================================
 * Service Order Generation with AI (GPT-4)
 * =====================================================
 * Serviço inteligente para gerar Ordens de Serviço completas
 * usando GPT-4 + Mapbox para análise de logística
 * =====================================================
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { getDirections, geocodeAddress } from '@/lib/mapbox';
import { logger } from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Sede HRX (configurado via .env.local)
const HRX_BASE_LOCATION = {
  latitude: parseFloat(process.env.HRX_BASE_LATITUDE || '-22.9068'),
  longitude: parseFloat(process.env.HRX_BASE_LONGITUDE || '-43.1729'),
  address: process.env.HRX_BASE_ADDRESS || 'Sede HRX Eventos, Rio de Janeiro, RJ',
};

interface GenerateOSOptions {
  contractId: string;
  projectId: string;
}

interface GenerateOSResult {
  success: boolean;
  message: string;
  serviceOrder?: {
    id: string;
    osNumber: string;
    status: string;
  };
  error?: string;
}

/**
 * Gera uma OS completa usando IA
 */
export async function generateServiceOrder(
  options: GenerateOSOptions
): Promise<GenerateOSResult> {
  try {
    const { contractId, projectId } = options;

    logger.info('Iniciando geração de OS com IA', { contractId, projectId });

    // 1. Buscar dados completos do projeto
    const { data: project, error: projectError } = await supabase
      .from('event_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return {
        success: false,
        message: 'Projeto não encontrado',
        error: 'PROJECT_NOT_FOUND',
      };
    }

    // 2. Buscar contrato
    const { data: contract } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (!contract) {
      return {
        success: false,
        message: 'Contrato não encontrado',
        error: 'CONTRACT_NOT_FOUND',
      };
    }

    // 3. Buscar equipe do projeto
    const { data: team } = await supabase
      .from('project_team')
      .select(`
        *,
        professional:professionals(
          id,
          full_name,
          email,
          phone,
          categories,
          subcategories
        )
      `)
      .eq('project_id', projectId)
      .in('status', ['confirmed', 'allocated']);

    // 4. Buscar equipamentos do projeto
    const { data: equipment } = await supabase
      .from('project_equipment')
      .select(`
        *,
        supplier:equipment_suppliers(
          id,
          company_name,
          contact_name,
          email,
          phone
        )
      `)
      .eq('project_id', projectId)
      .in('status', ['selected', 'confirmed']);

    // 5. Análise de logística com Mapbox
    let logisticsData: any = {
      distance_km: 0,
      travel_time_minutes: 0,
      traffic_analysis: {},
    };

    if (project.latitude && project.longitude) {
      try {
        const directions = await getDirections({
          origin: [HRX_BASE_LOCATION.longitude, HRX_BASE_LOCATION.latitude],
          destination: [project.longitude, project.latitude],
        });

        if (directions) {
          logisticsData = {
            distance_km: (directions.distance / 1000).toFixed(2),
            travel_time_minutes: Math.ceil(directions.duration / 60),
            traffic_analysis: {
              typical_duration: directions.duration,
              distance: directions.distance,
              route_geometry: directions.geometry,
            },
          };
        }
      } catch (mapboxError) {
        logger.error('Erro ao calcular rota com Mapbox', mapboxError as Error);
      }
    }

    // 6. Preparar dados para a IA
    const contractData = contract.contract_data || {};
    const teamMembers = (team || []).map((member: any) => ({
      role: member.role,
      category: member.category,
      subcategory: member.subcategory,
      quantity: member.quantity,
      duration_days: member.duration_days,
      professional: member.professional
        ? {
            name: member.professional.full_name,
            email: member.professional.email,
            phone: member.professional.phone,
          }
        : null,
    }));

    const equipmentList = (equipment || []).map((item: any) => ({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      duration_days: item.duration_days,
      supplier: item.supplier
        ? {
            company: item.supplier.company_name,
            contact: item.supplier.contact_name,
            phone: item.supplier.phone,
          }
        : null,
    }));

    // 7. Gerar briefing com GPT-4
    logger.info('Gerando briefing com GPT-4', { projectId });

    const aiPrompt = `Você é um especialista em gestão de eventos e logística. Gere uma Ordem de Serviço (OS) COMPLETA, DETALHADA e PROFISSIONAL para o seguinte evento:

**INFORMAÇÕES DO EVENTO:**
- Nome: ${project.event_name}
- Tipo: ${project.event_type}
- Data: ${project.event_date}
- Horário: ${project.start_time || 'A definir'} às ${project.end_time || 'A definir'}
- Público esperado: ${project.expected_attendance || 'Não especificado'}

**LOCAL:**
- Nome: ${project.venue_name}
- Endereço: ${project.venue_address}, ${project.venue_city}/${project.venue_state}
- Coordenadas: ${project.latitude}, ${project.longitude}

**LOGÍSTICA:**
- Distância da base HRX: ${logisticsData.distance_km} km
- Tempo de deslocamento: ${logisticsData.travel_time_minutes} minutos
- Base de saída: ${HRX_BASE_LOCATION.address}

**EQUIPE ALOCADA:**
${teamMembers.map((m: any) => `- ${m.quantity}x ${m.role} (${m.category}) - ${m.duration_days} dia(s)${m.professional ? ` - ${m.professional.name}` : ''}`).join('\n')}

**EQUIPAMENTOS:**
${equipmentList.map((e: any) => `- ${e.quantity}x ${e.name} (${e.category}) - ${e.duration_days} dia(s)${e.supplier ? ` - Fornecedor: ${e.supplier.company}` : ''}`).join('\n')}

**OBSERVAÇÕES DO CLIENTE:**
${project.additional_notes || 'Nenhuma'}

**INSTRUÇÕES:**
Gere uma OS completa em formato JSON com a seguinte estrutura:

{
  "briefing": "Briefing executivo completo do evento (3-4 parágrafos detalhados explicando o evento, objetivos, público, e expectativas)",

  "recommendations": [
    "Recomendação inteligente 1 (ex: horários ideais, sugestões de otimização)",
    "Recomendação inteligente 2",
    "Recomendação inteligente 3"
  ],

  "alerts": [
    "Alerta importante 1 (ex: atenção especial ao trânsito, cuidados com equipamentos frágeis)",
    "Alerta importante 2"
  ],

  "recommended_arrival_time": "HH:MM (calcule considerando ${logisticsData.travel_time_minutes} min de deslocamento + 30min de margem + tempo de montagem)",

  "estimated_setup_duration_minutes": 120,
  "estimated_teardown_duration_minutes": 90,

  "timeline": [
    {
      "title": "Saída da Base HRX",
      "time": "HH:MM",
      "event_type": "departure",
      "description": "Descrição detalhada",
      "involved_roles": ["Coordenador", "Equipe Técnica"],
      "sequence": 1
    },
    {
      "title": "Chegada ao Local",
      "time": "HH:MM",
      "event_type": "arrival",
      "description": "Descrição detalhada",
      "involved_roles": ["Todos"],
      "sequence": 2
    },
    ... (continue com montagem, início do evento, fim, desmontagem, retorno)
  ],

  "checklist": [
    {
      "title": "Verificar equipamentos antes da saída",
      "category": "logistics",
      "assigned_to": "Coordenador",
      "priority": "critical",
      "estimated_duration": 30,
      "sequence": 1
    },
    ... (gere checklist COMPLETO de todas as fases: logística, montagem, operação, desmontagem)
  ],

  "team_assignments": [
    {
      "professional_name": "Nome do Profissional ou Categoria",
      "role": "Técnico de Som",
      "responsibilities": ["Responsabilidade 1", "Responsabilidade 2"],
      "equipment_assigned": ["Equipamento 1", "Equipamento 2"],
      "arrival_time": "HH:MM",
      "departure_time": "HH:MM"
    }
  ],

  "supplier_deliveries": [
    {
      "supplier": "Nome do Fornecedor",
      "items": ["Item 1", "Item 2"],
      "delivery_time": "HH:MM",
      "delivery_address": "Endereço completo",
      "contact": "Nome e telefone",
      "special_instructions": "Instruções especiais"
    }
  ],

  "emergency_contacts": [
    {
      "name": "Cliente",
      "role": "Contratante",
      "phone": "${project.client_phone}",
      "email": "${project.client_email}"
    },
    {
      "name": "Coordenador HRX",
      "role": "Responsável pelo Evento",
      "phone": "(21) 99995-2457",
      "email": "operacoes@hrxeventos.com.br"
    }
  ]
}

**IMPORTANTE:**
- Seja EXTREMAMENTE detalhado e profissional
- Calcule horários considerando deslocamento, montagem e margens de segurança
- Gere um checklist COMPLETO com todas as tarefas necessárias
- Considere aspectos de segurança, qualidade e satisfação do cliente
- Use linguagem clara e objetiva
- Retorne APENAS o JSON válido, sem markdown ou texto adicional`;

    let aiResponse;
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content:
              'Você é um especialista em gestão de eventos, logística e operações. Gere Ordens de Serviço completas, detalhadas e profissionais em formato JSON.',
          },
          { role: 'user', content: aiPrompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('GPT-4 não retornou resposta');
      }

      aiResponse = JSON.parse(responseText);
      logger.info('GPT-4 gerou briefing com sucesso', { projectId });
    } catch (aiError: any) {
      logger.error('Erro ao gerar briefing com GPT-4', aiError);
      // Fallback: gerar OS básica sem IA
      aiResponse = generateBasicOS(project, teamMembers, equipmentList, logisticsData);
    }

    // 8. Criar OS no banco de dados
    const osData = {
      project_id: projectId,
      contract_id: contractId,
      title: `OS - ${project.event_name}`,
      status: 'pending',

      // Datas
      event_date: project.event_date,
      event_start_time: project.start_time,
      event_end_time: project.end_time,

      // Briefing da IA
      ai_briefing: aiResponse.briefing,
      ai_recommendations: aiResponse.recommendations?.join('\n\n') || null,
      ai_alerts: aiResponse.alerts?.join('\n\n') || null,

      // Local
      venue_name: project.venue_name,
      venue_address: project.venue_address,
      venue_city: project.venue_city,
      venue_state: project.venue_state,
      venue_latitude: project.latitude,
      venue_longitude: project.longitude,

      // Logística
      estimated_setup_duration_minutes: aiResponse.estimated_setup_duration_minutes,
      estimated_teardown_duration_minutes: aiResponse.estimated_teardown_duration_minutes,
      recommended_arrival_time: aiResponse.recommended_arrival_time,
      distance_from_base_km: logisticsData.distance_km,
      estimated_travel_time_minutes: logisticsData.travel_time_minutes,
      traffic_analysis: logisticsData.traffic_analysis,

      // Contatos
      client_name: project.client_name,
      client_email: project.client_email,
      client_phone: project.client_phone,

      // Dados estruturados
      team_assignments: aiResponse.team_assignments || [],
      equipment_list: equipmentList,
      supplier_assignments: aiResponse.supplier_deliveries || [],
      checklist: aiResponse.checklist || [],
      timeline: aiResponse.timeline || [],

      // Observações
      special_instructions: project.additional_notes,

      generated_by: 'ai_gpt4',
    };

    const { data: serviceOrder, error: insertError } = await supabase
      .from('service_orders')
      .insert(osData)
      .select()
      .single();

    if (insertError || !serviceOrder) {
      logger.error('Erro ao criar OS no banco', insertError);
      return {
        success: false,
        message: 'Erro ao salvar OS no banco de dados',
        error: 'DATABASE_ERROR',
      };
    }

    // 9. Criar tarefas individuais
    if (aiResponse.checklist && aiResponse.checklist.length > 0) {
      const tasks = aiResponse.checklist.map((task: any, index: number) => ({
        service_order_id: serviceOrder.id,
        title: task.title,
        description: task.description || null,
        category: task.category || 'other',
        assigned_to_type: task.assigned_to_type || 'hrx_team',
        assigned_to_name: task.assigned_to || null,
        priority: task.priority || 'normal',
        sequence_order: task.sequence || index + 1,
        estimated_duration_minutes: task.estimated_duration || null,
      }));

      await supabase.from('service_order_tasks').insert(tasks);
    }

    // 10. Criar timeline
    if (aiResponse.timeline && aiResponse.timeline.length > 0) {
      const timelineEvents = aiResponse.timeline.map((event: any) => ({
        service_order_id: serviceOrder.id,
        title: event.title,
        description: event.description || null,
        event_type: event.event_type,
        scheduled_time: event.time,
        estimated_duration_minutes: event.duration || null,
        involved_roles: event.involved_roles || [],
        sequence_order: event.sequence,
      }));

      await supabase.from('service_order_timeline').insert(timelineEvents);
    }

    // 11. Log de criação
    await supabase.from('service_order_logs').insert({
      service_order_id: serviceOrder.id,
      action_type: 'created',
      description: 'OS gerada automaticamente pelo sistema com IA GPT-4',
      performed_by: 'ai_system',
      performed_by_type: 'ai',
    });

    logger.info('OS criada com sucesso', {
      osId: serviceOrder.id,
      osNumber: serviceOrder.os_number,
      projectId,
    });

    return {
      success: true,
      message: 'Ordem de Serviço gerada com sucesso',
      serviceOrder: {
        id: serviceOrder.id,
        osNumber: serviceOrder.os_number,
        status: serviceOrder.status,
      },
    };
  } catch (error: any) {
    logger.error('Erro ao gerar OS', error);
    return {
      success: false,
      message: error.message || 'Erro interno ao gerar OS',
      error: 'INTERNAL_ERROR',
    };
  }
}

/**
 * Gera OS básica caso a IA falhe
 */
function generateBasicOS(project: any, team: any[], equipment: any[], logistics: any) {
  return {
    briefing: `Ordem de Serviço para o evento ${project.event_name} (${project.event_type}), agendado para ${project.event_date}. Local: ${project.venue_name}, ${project.venue_address}.`,
    recommendations: [
      `Chegar com ${logistics.travel_time_minutes + 30} minutos de antecedência para montagem`,
      'Conferir todos os equipamentos antes da saída',
      'Manter contato constante com o cliente durante o evento',
    ],
    alerts: [
      'Verificar condições climáticas antes da saída',
      'Confirmar disponibilidade de energia e infraestrutura no local',
    ],
    recommended_arrival_time: '14:00',
    estimated_setup_duration_minutes: 120,
    estimated_teardown_duration_minutes: 90,
    timeline: [],
    checklist: [],
    team_assignments: team.map((m) => ({
      professional_name: m.professional?.name || m.role,
      role: m.role,
      responsibilities: ['Executar tarefas designadas'],
      equipment_assigned: [],
      arrival_time: '14:00',
      departure_time: '23:00',
    })),
    supplier_deliveries: [],
  };
}
