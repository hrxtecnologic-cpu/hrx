import { resend, FROM_EMAIL, ADMIN_EMAIL } from './client';
import { SimpleWelcomeEmail } from './templates/SimpleWelcomeEmail';
import { AdminNotificationEmail } from './templates/AdminNotificationEmail';
import { ContractorConfirmationEmail } from './templates/ContractorConfirmationEmail';
import { AdminRequestNotificationEmail } from './templates/AdminRequestNotificationEmail';
import ContactNotificationEmail from './templates/ContactNotificationEmail';
import ContactConfirmationEmail from './templates/ContactConfirmationEmail';

interface SendProfessionalWelcomeEmailParams {
  professionalName: string;
  professionalEmail: string;
}

interface SendAdminNotificationEmailParams {
  professionalName: string;
  professionalEmail: string;
  professionalPhone: string;
  professionalCPF: string;
  categories: string[];
  hasExperience: boolean;
  yearsOfExperience?: string;
  city: string;
  state: string;
  documentsUploaded: string[];
  professionalId: string;
}

/**
 * Envia email de boas-vindas para o profissional
 */
export async function sendProfessionalWelcomeEmail({
  professionalName,
  professionalEmail,
}: SendProfessionalWelcomeEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: `HRX <${FROM_EMAIL}>`,
      to: [professionalEmail],
      subject: `Bem-vindo à HRX, ${professionalName}! 🎉`,
      react: <SimpleWelcomeEmail professionalName={professionalName} professionalEmail={professionalEmail} />,
    });

    if (error) {
      console.error('Erro ao enviar email de boas-vindas:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Email de boas-vindas enviado para: ${professionalEmail} (ID: ${data?.id})`);
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return { success: false, error: 'Erro ao enviar email' };
  }
}

/**
 * Envia notificação para admin sobre novo cadastro
 */
export async function sendAdminNotificationEmail(
  params: SendAdminNotificationEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: `HRX Sistema <${FROM_EMAIL}>`,
      to: [ADMIN_EMAIL],
      subject: `🆕 Novo Cadastro: ${params.professionalName} - ${params.city}/${params.state}`,
      react: <AdminNotificationEmail {...params} />,
    });

    if (error) {
      console.error('Erro ao enviar notificação para admin:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Notificação enviada para admin: ${ADMIN_EMAIL} (ID: ${data?.id})`);
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return { success: false, error: 'Erro ao enviar notificação' };
  }
}

/**
 * Envia ambos os emails (boas-vindas + notificação admin)
 */
export async function sendProfessionalRegistrationEmails(params: {
  professional: SendProfessionalWelcomeEmailParams;
  admin: SendAdminNotificationEmailParams;
}): Promise<{
  welcomeEmailSent: boolean;
  adminEmailSent: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  // Enviar email de boas-vindas
  const welcomeResult = await sendProfessionalWelcomeEmail(params.professional);
  if (!welcomeResult.success && welcomeResult.error) {
    errors.push(`Boas-vindas: ${welcomeResult.error}`);
  }

  // Enviar notificação para admin
  const adminResult = await sendAdminNotificationEmail(params.admin);
  if (!adminResult.success && adminResult.error) {
    errors.push(`Admin: ${adminResult.error}`);
  }

  return {
    welcomeEmailSent: welcomeResult.success,
    adminEmailSent: adminResult.success,
    errors,
  };
}

// =====================================================
// CONTRACTOR REQUEST EMAILS
// =====================================================

interface Professional {
  category: string;
  quantity: number;
  shift: string;
  requirements?: string;
}

interface SendContractorConfirmationEmailParams {
  responsibleName: string;
  email: string;
  eventName: string;
  requestNumber: string;
  startDate: string;
  endDate: string;
  venueAddress: string;
  venueCity: string;
  venueState: string;
  professionalsNeeded: Professional[];
  needsEquipment: boolean;
  equipmentList?: string[];
  budgetRange?: string;
  urgency: string;
}

interface SendAdminRequestNotificationEmailParams {
  requestNumber: string;
  requestId: string;
  urgency: string;
  companyName: string;
  cnpj: string;
  responsibleName: string;
  responsibleRole?: string;
  email: string;
  phone: string;
  companyAddress?: string;
  website?: string;
  eventName: string;
  eventType: string;
  eventTypeOther?: string;
  eventDescription?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  expectedAttendance?: number;
  venueName?: string;
  venueAddress: string;
  venueCity: string;
  venueState: string;
  professionalsNeeded: Professional[];
  needsEquipment: boolean;
  equipmentList?: string[];
  equipmentOther?: string;
  equipmentNotes?: string;
  budgetRange?: string;
  additionalNotes?: string;
  createdAt: string;
}

/**
 * Envia email de confirmação para o contratante
 */
export async function sendContractorConfirmationEmail(
  params: SendContractorConfirmationEmailParams
): Promise<{ success: boolean; error?: string; emailId?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: `HRX <${FROM_EMAIL}>`,
      to: [params.email],
      subject: `✅ Solicitação Recebida - ${params.eventName} - ${params.requestNumber}`,
      react: <ContractorConfirmationEmail {...params} />,
    });

    if (error) {
      console.error('Erro ao enviar confirmação para contratante:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Confirmação enviada para contratante: ${params.email} (ID: ${data?.id})`);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('Erro ao enviar confirmação:', error);
    return { success: false, error: 'Erro ao enviar email' };
  }
}

/**
 * Envia notificação para admin sobre nova solicitação
 */
export async function sendAdminRequestNotificationEmail(
  params: SendAdminRequestNotificationEmailParams
): Promise<{ success: boolean; error?: string; emailId?: string }> {
  try {
    const urgencyPrefix = {
      normal: '',
      urgent: '⚠️ URGENTE - ',
      very_urgent: '🚨 MUITO URGENTE - ',
    }[params.urgency] || '';

    const { data, error } = await resend.emails.send({
      from: `HRX Sistema <${FROM_EMAIL}>`,
      to: [ADMIN_EMAIL],
      subject: `${urgencyPrefix}🚨 Nova Solicitação ${params.requestNumber} - ${params.companyName}`,
      react: <AdminRequestNotificationEmail {...params} />,
    });

    if (error) {
      console.error('Erro ao enviar notificação de solicitação para admin:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Notificação de solicitação enviada para admin: ${ADMIN_EMAIL} (ID: ${data?.id})`);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('Erro ao enviar notificação de solicitação:', error);
    return { success: false, error: 'Erro ao enviar notificação' };
  }
}

/**
 * Envia ambos os emails (confirmação para contratante + notificação admin)
 */
export async function sendRequestEmails(params: {
  contractor: SendContractorConfirmationEmailParams;
  admin: SendAdminRequestNotificationEmailParams;
}): Promise<{
  contractorEmailSent: boolean;
  adminEmailSent: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  // Enviar confirmação para contratante
  const contractorResult = await sendContractorConfirmationEmail(params.contractor);
  if (!contractorResult.success && contractorResult.error) {
    errors.push(`Confirmação contratante: ${contractorResult.error}`);
  }

  // Enviar notificação para admin
  const adminResult = await sendAdminRequestNotificationEmail(params.admin);
  if (!adminResult.success && adminResult.error) {
    errors.push(`Notificação admin: ${adminResult.error}`);
  }

  return {
    contractorEmailSent: contractorResult.success,
    adminEmailSent: adminResult.success,
    errors,
  };
}

// =====================================================
// CONTACT FORM EMAILS
// =====================================================

interface SendContactNotificationEmailParams {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  submittedAt: string;
}

/**
 * Envia email de confirmação para quem enviou o contato
 */
export async function sendContactConfirmationEmail(params: {
  name: string;
  email: string;
  subject: string;
}): Promise<{ success: boolean; error?: string; emailId?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: `HRX <${FROM_EMAIL}>`,
      to: [params.email],
      subject: `Mensagem Recebida - ${params.subject}`,
      react: <ContactConfirmationEmail
        name={params.name}
        subject={params.subject}
      />,
    });

    if (error) {
      console.error('Erro ao enviar confirmação de contato:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Confirmação de contato enviada para: ${params.email} (ID: ${data?.id})`);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('Erro ao enviar confirmação de contato:', error);
    return { success: false, error: 'Erro ao enviar email' };
  }
}

/**
 * Envia notificação para admin sobre novo contato
 */
export async function sendContactNotificationEmail(
  params: SendContactNotificationEmailParams
): Promise<{ success: boolean; error?: string; emailId?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: `HRX Sistema <${FROM_EMAIL}>`,
      to: [ADMIN_EMAIL],
      subject: `📬 Novo Contato - ${params.subject}`,
      react: <ContactNotificationEmail {...params} />,
    });

    if (error) {
      console.error('Erro ao enviar notificação de contato para admin:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Notificação de contato enviada para admin: ${ADMIN_EMAIL} (ID: ${data?.id})`);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('Erro ao enviar notificação de contato:', error);
    return { success: false, error: 'Erro ao enviar notificação' };
  }
}

/**
 * Envia ambos os emails (confirmação + notificação admin)
 */
export async function sendContactEmails(params: {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}): Promise<{
  confirmationEmailSent: boolean;
  adminEmailSent: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  const submittedAt = new Date().toISOString();

  // Enviar confirmação para quem enviou o contato
  const confirmationResult = await sendContactConfirmationEmail({
    name: params.name,
    email: params.email,
    subject: params.subject,
  });

  if (!confirmationResult.success && confirmationResult.error) {
    errors.push(`Confirmação: ${confirmationResult.error}`);
  }

  // Enviar notificação para admin
  const adminResult = await sendContactNotificationEmail({
    ...params,
    submittedAt,
  });

  if (!adminResult.success && adminResult.error) {
    errors.push(`Notificação admin: ${adminResult.error}`);
  }

  return {
    confirmationEmailSent: confirmationResult.success,
    adminEmailSent: adminResult.success,
    errors,
  };
}

// =====================================================
// PROFESSIONAL ALLOCATION EMAILS
// =====================================================

interface SendProfessionalAllocationEmailParams {
  professionalName: string;
  professionalEmail: string;
  eventName: string;
  companyName: string;
  eventType: string;
  startDate: string;
  endDate?: string;
  venueName?: string;
  venueAddress?: string;
  venueCity: string;
  venueState: string;
}

/**
 * Envia email para profissional informando que foi selecionado para evento
 */
export async function sendProfessionalAllocationEmail(
  params: SendProfessionalAllocationEmailParams
): Promise<{ success: boolean; error?: string; emailId?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: `HRX <${FROM_EMAIL}>`,
      to: [params.professionalEmail],
      subject: `Você foi selecionado para trabalhar! - ${params.eventName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">Você foi selecionado para um evento!</h1>

          <p>Olá <strong>${params.professionalName}</strong>!</p>

          <p>Temos uma ótima notícia! Você foi selecionado para trabalhar no seguinte evento:</p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #111827;">${params.eventName}</h2>
            <p><strong>Empresa:</strong> ${params.companyName}</p>
            <p><strong>Tipo:</strong> ${params.eventType}</p>
            <p><strong>Data de Início:</strong> ${new Date(params.startDate).toLocaleDateString('pt-BR')}</p>
            ${params.endDate ? `<p><strong>Data de Término:</strong> ${new Date(params.endDate).toLocaleDateString('pt-BR')}</p>` : ''}
            ${params.venueName ? `<p><strong>Local:</strong> ${params.venueName}</p>` : ''}
            <p><strong>Cidade:</strong> ${params.venueCity}, ${params.venueState}</p>
            ${params.venueAddress ? `<p><strong>Endereço:</strong> ${params.venueAddress}</p>` : ''}
          </div>

          <p>Em breve nossa equipe entrará em contato com mais detalhes sobre o evento, incluindo horários, uniforme e outras informações importantes.</p>

          <p><strong>Importante:</strong> Acesse seu dashboard para confirmar sua disponibilidade!</p>

          <div style="margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/profissional"
               style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Acessar Meu Dashboard
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 40px;">
            Qualquer dúvida, entre em contato conosco.<br>
            <strong>HRX Tecnologia</strong><br>
            ${ADMIN_EMAIL}
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Erro ao enviar email de alocação:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Email de alocação enviado para: ${params.professionalEmail} (ID: ${data?.id})`);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('❌ Erro ao enviar email de alocação:', error);
    return { success: false, error: 'Erro ao enviar email' };
  }
}

interface SendTeamCompleteEmailParams {
  contractorEmail: string;
  companyName: string;
  eventName: string;
  eventType: string;
  startDate: string;
  endDate?: string;
  venueCity: string;
  venueState: string;
  professionalsNeeded: Array<{
    category: string;
    quantity: number;
    shift: string;
  }>;
  allocations: Array<{
    category: string;
    shift: string;
    selectedProfessionals: string[];
  }>;
}

/**
 * Envia email para contratante informando que toda a equipe foi alocada
 */
export async function sendTeamCompleteEmail(
  params: SendTeamCompleteEmailParams
): Promise<{ success: boolean; error?: string; emailId?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: `HRX <${FROM_EMAIL}>`,
      to: [params.contractorEmail],
      subject: `Equipe completa para seu evento: ${params.eventName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #16a34a;">Sua equipe está completa!</h1>

          <p>Olá, <strong>${params.companyName}</strong>!</p>

          <p>Temos uma ótima notícia! Conseguimos alocar todos os profissionais necessários para o seu evento:</p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #111827;">${params.eventName}</h2>
            <p><strong>Tipo:</strong> ${params.eventType}</p>
            <p><strong>Data de Início:</strong> ${new Date(params.startDate).toLocaleDateString('pt-BR')}</p>
            ${params.endDate ? `<p><strong>Data de Término:</strong> ${new Date(params.endDate).toLocaleDateString('pt-BR')}</p>` : ''}
            <p><strong>Local:</strong> ${params.venueCity}, ${params.venueState}</p>
          </div>

          <h3 style="color: #111827;">Profissionais Alocados:</h3>
          <ul style="list-style: none; padding: 0;">
            ${params.professionalsNeeded.map((needed) => {
              const allocation = params.allocations.find(
                (a) => a.category === needed.category && a.shift === needed.shift
              );
              return `
                <li style="background: #f9fafb; padding: 10px; margin: 8px 0; border-radius: 6px;">
                  <strong>${needed.category}</strong> - Turno ${needed.shift}
                  <br>
                  <span style="color: #16a34a;">✓ ${allocation?.selectedProfessionals.length || 0}/${needed.quantity} profissionais selecionados</span>
                </li>
              `;
            }).join('')}
          </ul>

          <p>Nossa equipe entrará em contato em breve com os detalhes finais e valores. Você também pode acompanhar o status da sua solicitação no dashboard:</p>

          <div style="margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/contratante"
               style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Acessar Meu Dashboard
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 40px;">
            Qualquer dúvida, entre em contato conosco.<br>
            <strong>HRX Tecnologia</strong><br>
            ${ADMIN_EMAIL}
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Erro ao enviar email de equipe completa:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Email de equipe completa enviado para: ${params.contractorEmail} (ID: ${data?.id})`);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('❌ Erro ao enviar email de equipe completa:', error);
    return { success: false, error: 'Erro ao enviar email' };
  }
}

interface SendProfessionalApprovalEmailParams {
  professionalName: string;
  professionalEmail: string;
}

/**
 * Envia email notificando profissional que foi aprovado
 */
export async function sendProfessionalApprovalEmail(
  params: SendProfessionalApprovalEmailParams
): Promise<{ success: boolean; error?: string; emailId?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: `HRX <${FROM_EMAIL}>`,
      to: [params.professionalEmail],
      subject: `🎉 Parabéns! Seu cadastro foi aprovado - HRX`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #111111;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px 20px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                  HRX
                </h1>
                <p style="margin: 10px 0 0 0; color: #fecaca; font-size: 14px; letter-spacing: 2px;">
                  RECURSOS HUMANOS
                </p>
              </div>

              <!-- Content -->
              <div style="padding: 40px 20px;">
                <div style="background-color: #1a1a1a; border: 1px solid #27272a; border-radius: 12px; padding: 30px;">
                  <h2 style="margin: 0 0 20px 0; color: #22c55e; font-size: 24px; text-align: center;">
                    🎉 Cadastro Aprovado!
                  </h2>

                  <p style="margin: 0 0 20px 0; color: #e4e4e7; font-size: 16px; line-height: 1.6;">
                    Olá <strong style="color: #ffffff;">${params.professionalName}</strong>,
                  </p>

                  <p style="margin: 0 0 20px 0; color: #e4e4e7; font-size: 16px; line-height: 1.6;">
                    Temos uma ótima notícia! Seu cadastro foi <strong style="color: #22c55e;">aprovado com sucesso</strong> pela nossa equipe.
                  </p>

                  <div style="background-color: #0f172a; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 8px;">
                    <p style="margin: 0; color: #e4e4e7; font-size: 15px; line-height: 1.6;">
                      A partir de agora você está apto para ser alocado em eventos e oportunidades de trabalho através da nossa plataforma.
                    </p>
                  </div>

                  <h3 style="margin: 30px 0 15px 0; color: #ffffff; font-size: 18px;">
                    Próximos Passos:
                  </h3>

                  <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #e4e4e7; font-size: 15px; line-height: 1.8;">
                    <li>Mantenha seu perfil sempre atualizado</li>
                    <li>Fique atento às notificações de alocação</li>
                    <li>Quando for selecionado para um evento, você receberá um email com todos os detalhes</li>
                  </ul>

                  <div style="text-align: center; margin: 30px 0 0 0;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                       style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Acessar Dashboard
                    </a>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div style="padding: 20px; text-align: center; border-top: 1px solid #27272a;">
                <p style="margin: 0 0 10px 0; color: #71717a; font-size: 14px;">
                  Bem-vindo à equipe HRX! 🚀
                </p>
                <p style="margin: 0; color: #52525b; font-size: 12px;">
                  © ${new Date().getFullYear()} HRX Tecnologia. Todos os direitos reservados.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Erro ao enviar email de aprovação:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Email de aprovação enviado para: ${params.professionalEmail} (ID: ${data?.id})`);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('❌ Erro ao enviar email de aprovação:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}
