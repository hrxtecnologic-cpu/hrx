/**
 * =====================================================
 * Service Order Email Service
 * =====================================================
 * Envia emails de OS para profissionais e fornecedores
 * =====================================================
 */

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { logger } from '@/lib/logger';
import { ServiceOrderProfessionalEmail } from '@/lib/resend/templates/ServiceOrderProfessionalEmail';
import { ServiceOrderSupplierEmail } from '@/lib/resend/templates/ServiceOrderSupplierEmail';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendOSEmailsOptions {
  serviceOrderId: string;
}

interface SendOSEmailsResult {
  success: boolean;
  message: string;
  emailsSent: {
    professionals: number;
    suppliers: number;
  };
  errors?: string[];
}

/**
 * Envia emails de OS para todos os envolvidos
 */
export async function sendServiceOrderEmails(
  options: SendOSEmailsOptions
): Promise<SendOSEmailsResult> {
  try {
    const { serviceOrderId } = options;

    logger.info('Iniciando envio de emails de OS', { serviceOrderId });

    // 1. Buscar OS completa
    const { data: serviceOrder, error: osError } = await supabase
      .from('service_orders')
      .select('*')
      .eq('id', serviceOrderId)
      .single();

    if (osError || !serviceOrder) {
      return {
        success: false,
        message: 'OS não encontrada',
        emailsSent: { professionals: 0, suppliers: 0 },
      };
    }

    // 2. Buscar profissionais alocados
    const { data: team } = await supabase
      .from('project_team')
      .select(`
        *,
        professional:professionals(
          id,
          full_name,
          email,
          phone
        )
      `)
      .eq('project_id', serviceOrder.project_id)
      .in('status', ['confirmed', 'allocated']);

    // 3. Buscar fornecedores
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
      .eq('project_id', serviceOrder.project_id)
      .in('status', ['selected', 'confirmed'])
      .not('selected_supplier_id', 'is', null);

    const errors: string[] = [];
    let professionalEmailsSent = 0;
    let supplierEmailsSent = 0;

    // 4. Enviar emails para profissionais
    if (team && team.length > 0) {
      logger.info('Enviando emails para profissionais', { count: team.length });

      for (const member of team) {
        if (!member.professional || !member.professional.email) {
          logger.warn('Profissional sem email', { memberId: member.id });
          continue;
        }

        try {
          // Buscar atribuições específicas para este profissional
          const assignment = (serviceOrder.team_assignments || []).find(
            (a: any) => a.professional_name === member.professional.full_name
          );

          // Buscar checklist específico para este profissional
          const { data: tasks } = await supabase
            .from('service_order_tasks')
            .select('title')
            .eq('service_order_id', serviceOrderId)
            .eq('assigned_to_id', member.professional_id)
            .order('sequence_order');

          const checklistItems = tasks?.map((t) => t.title) || [];

          // Montar dados do email
          const emailData = {
            professionalName: member.professional.full_name,
            professionalEmail: member.professional.email,
            osNumber: serviceOrder.os_number,
            projectNumber: serviceOrder.project_id, // Buscar o project_number depois
            eventName: serviceOrder.title.replace('OS - ', ''),
            eventType: 'Evento', // Buscar do projeto
            eventDate: serviceOrder.event_date,
            eventStartTime: serviceOrder.event_start_time || '18:00',
            eventEndTime: serviceOrder.event_end_time || '23:00',
            venueName: serviceOrder.venue_name || 'Local do evento',
            venueAddress: serviceOrder.venue_address,
            venueCity: serviceOrder.venue_city,
            venueState: serviceOrder.venue_state,
            clientName: serviceOrder.client_name,
            clientPhone: serviceOrder.client_phone,
            yourRole: member.role || member.category,
            arrivalTime: assignment?.arrival_time || serviceOrder.recommended_arrival_time || '14:00',
            briefing: serviceOrder.ai_briefing,
            responsibilities: assignment?.responsibilities || [
              `Executar tarefas como ${member.role}`,
              'Manter comunicação com a equipe',
              'Seguir o checklist de tarefas',
            ],
            equipmentAssigned: assignment?.equipment_assigned || [],
            checklistItems: checklistItems.length > 0 ? checklistItems : [
              'Chegar no horário designado',
              'Verificar equipamentos',
              'Executar tarefas designadas',
              'Manter comunicação com coordenação',
            ],
            recommendations: serviceOrder.ai_recommendations
              ? serviceOrder.ai_recommendations.split('\n\n')
              : [],
            alerts: serviceOrder.ai_alerts ? serviceOrder.ai_alerts.split('\n\n') : [],
            distanceKm: serviceOrder.distance_from_base_km,
            travelTimeMinutes: serviceOrder.estimated_travel_time_minutes,
          };

          // Enviar email
          const { error: emailError } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'HRX Eventos <noreply@hrxeventos.com.br>',
            to: [member.professional.email],
            subject: `OS ${serviceOrder.os_number} - ${serviceOrder.title.replace('OS - ', '')}`,
            react: ServiceOrderProfessionalEmail(emailData),
          });

          if (emailError) {
            logger.error('Erro ao enviar email para profissional', emailError);
            errors.push(
              `${member.professional.full_name}: ${emailError.message}`
            );
          } else {
            professionalEmailsSent++;
            logger.info('Email enviado para profissional', {
              professional: member.professional.full_name,
              email: member.professional.email,
            });

            // Registrar email enviado
            await supabase.from('project_emails').insert({
              project_id: serviceOrder.project_id,
              recipient_email: member.professional.email,
              recipient_name: member.professional.full_name,
              recipient_type: 'professional',
              email_type: 'other',
              subject: `OS ${serviceOrder.os_number}`,
              template_used: 'ServiceOrderProfessionalEmail',
              status: 'sent',
              sent_at: new Date().toISOString(),
            });
          }
        } catch (error: any) {
          logger.error('Erro ao processar email para profissional', error);
          errors.push(`${member.professional.full_name}: ${error.message}`);
        }
      }
    }

    // 5. Enviar emails para fornecedores
    if (equipment && equipment.length > 0) {
      // Agrupar equipamentos por fornecedor
      const supplierGroups = new Map<string, any>();

      equipment.forEach((item: any) => {
        if (!item.supplier) return;

        const supplierId = item.supplier.id;
        if (!supplierGroups.has(supplierId)) {
          supplierGroups.set(supplierId, {
            supplier: item.supplier,
            items: [],
          });
        }

        supplierGroups.get(supplierId)?.items.push({
          name: item.name,
          quantity: item.quantity,
          specifications: item.description,
        });
      });

      logger.info('Enviando emails para fornecedores', {
        count: supplierGroups.size,
      });

      for (const [supplierId, group] of supplierGroups) {
        try {
          if (!group.supplier.email) {
            logger.warn('Fornecedor sem email', { supplierId });
            continue;
          }

          // Buscar atribuições específicas para este fornecedor
          const supplierAssignment = (serviceOrder.supplier_assignments || []).find(
            (a: any) => a.supplier === group.supplier.company_name
          );

          // Montar dados do email
          const emailData = {
            supplierName: group.supplier.contact_name || group.supplier.company_name,
            supplierEmail: group.supplier.email,
            osNumber: serviceOrder.os_number,
            projectNumber: serviceOrder.project_id,
            eventName: serviceOrder.title.replace('OS - ', ''),
            eventDate: serviceOrder.event_date,
            eventStartTime: serviceOrder.event_start_time || '18:00',
            eventEndTime: serviceOrder.event_end_time || '23:00',
            venueName: serviceOrder.venue_name || 'Local do evento',
            venueAddress: serviceOrder.venue_address,
            venueCity: serviceOrder.venue_city,
            venueState: serviceOrder.venue_state,
            deliveryTime:
              supplierAssignment?.delivery_time ||
              serviceOrder.recommended_arrival_time ||
              '14:00',
            pickupTime: supplierAssignment?.pickup_time,
            equipmentList: group.items,
            specialInstructions: supplierAssignment?.special_instructions,
            contactName: 'Coordenação HRX',
            contactPhone: '(21) 99995-2457',
            setupDuration: serviceOrder.estimated_setup_duration_minutes,
          };

          // Enviar email
          const { error: emailError } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'HRX Eventos <noreply@hrxeventos.com.br>',
            to: [group.supplier.email],
            subject: `OS ${serviceOrder.os_number} - Entrega de Equipamentos`,
            react: ServiceOrderSupplierEmail(emailData),
          });

          if (emailError) {
            logger.error('Erro ao enviar email para fornecedor', emailError);
            errors.push(`${group.supplier.company_name}: ${emailError.message}`);
          } else {
            supplierEmailsSent++;
            logger.info('Email enviado para fornecedor', {
              supplier: group.supplier.company_name,
              email: group.supplier.email,
            });

            // Registrar email enviado
            await supabase.from('project_emails').insert({
              project_id: serviceOrder.project_id,
              recipient_email: group.supplier.email,
              recipient_name: group.supplier.company_name,
              recipient_type: 'supplier',
              email_type: 'other',
              subject: `OS ${serviceOrder.os_number} - Entrega`,
              template_used: 'ServiceOrderSupplierEmail',
              status: 'sent',
              sent_at: new Date().toISOString(),
            });
          }
        } catch (error: any) {
          logger.error('Erro ao processar email para fornecedor', error);
          errors.push(`Fornecedor: ${error.message}`);
        }
      }
    }

    // 6. Atualizar status da OS
    await supabase
      .from('service_orders')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .eq('id', serviceOrderId);

    // 7. Log de envio
    await supabase.from('service_order_logs').insert({
      service_order_id: serviceOrderId,
      action_type: 'email_sent',
      description: `Emails enviados: ${professionalEmailsSent} profissionais, ${supplierEmailsSent} fornecedores`,
      performed_by: 'system',
      performed_by_type: 'system',
      metadata: {
        professionals: professionalEmailsSent,
        suppliers: supplierEmailsSent,
        errors: errors.length > 0 ? errors : undefined,
      },
    });

    logger.info('Envio de emails de OS concluído', {
      serviceOrderId,
      professionalEmailsSent,
      supplierEmailsSent,
      errors: errors.length,
    });

    return {
      success: true,
      message: 'Emails enviados com sucesso',
      emailsSent: {
        professionals: professionalEmailsSent,
        suppliers: supplierEmailsSent,
      },
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    logger.error('Erro ao enviar emails de OS', error);
    return {
      success: false,
      message: error.message || 'Erro ao enviar emails',
      emailsSent: { professionals: 0, suppliers: 0 },
    };
  }
}
