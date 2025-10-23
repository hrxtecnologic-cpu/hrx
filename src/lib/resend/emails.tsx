import { resend, FROM_EMAIL, ADMIN_EMAIL } from './client';
import { SimpleWelcomeEmail } from './templates/SimpleWelcomeEmail';
import { AdminNotificationEmail } from './templates/AdminNotificationEmail';
import { ContractorConfirmationEmail } from './templates/ContractorConfirmationEmail';
import { AdminRequestNotificationEmail } from './templates/AdminRequestNotificationEmail';
import ContactNotificationEmail from './templates/ContactNotificationEmail';
import ContactConfirmationEmail from './templates/ContactConfirmationEmail';
import { QuoteRequestEmail } from './templates/QuoteRequestEmail';
import { UrgentQuoteAdminEmail } from './templates/UrgentQuoteAdminEmail';
import { QuoteAcceptedEmail } from './templates/QuoteAcceptedEmail';
import { QuoteRejectedEmail } from './templates/QuoteRejectedEmail';

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
      subject: `🎉 Você foi selecionado para trabalhar! - ${params.eventName}`,
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
                    🎉 Você foi selecionado!
                  </h2>

                  <p style="margin: 0 0 20px 0; color: #e4e4e7; font-size: 16px; line-height: 1.6;">
                    Olá <strong style="color: #ffffff;">${params.professionalName}</strong>,
                  </p>

                  <p style="margin: 0 0 20px 0; color: #e4e4e7; font-size: 16px; line-height: 1.6;">
                    Temos uma ótima notícia! Você foi <strong style="color: #22c55e;">selecionado para trabalhar</strong> no seguinte evento:
                  </p>

                  <div style="background-color: #0f172a; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 8px;">
                    <h3 style="margin: 0 0 15px 0; color: #ffffff; font-size: 20px;">
                      ${params.eventName}
                    </h3>
                    <table style="width: 100%; margin: 0;">
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8; width: 140px;">Empresa:</td>
                        <td style="padding: 8px 0; color: #e4e4e7; font-weight: 600;">${params.companyName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8;">Tipo de Evento:</td>
                        <td style="padding: 8px 0; color: #e4e4e7;">${params.eventType}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8;">Data de Início:</td>
                        <td style="padding: 8px 0; color: #22c55e; font-weight: 600;">${new Date(params.startDate).toLocaleDateString('pt-BR')}</td>
                      </tr>
                      ${params.endDate ? `
                        <tr>
                          <td style="padding: 8px 0; color: #94a3b8;">Data de Término:</td>
                          <td style="padding: 8px 0; color: #22c55e; font-weight: 600;">${new Date(params.endDate).toLocaleDateString('pt-BR')}</td>
                        </tr>
                      ` : ''}
                      ${params.venueName ? `
                        <tr>
                          <td style="padding: 8px 0; color: #94a3b8;">Local:</td>
                          <td style="padding: 8px 0; color: #e4e4e7;">${params.venueName}</td>
                        </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8;">Cidade:</td>
                        <td style="padding: 8px 0; color: #e4e4e7;">${params.venueCity}, ${params.venueState}</td>
                      </tr>
                      ${params.venueAddress ? `
                        <tr>
                          <td style="padding: 8px 0; color: #94a3b8;">Endereço:</td>
                          <td style="padding: 8px 0; color: #e4e4e7;">${params.venueAddress}</td>
                        </tr>
                      ` : ''}
                    </table>
                  </div>

                  <div style="background-color: #0f172a; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 8px;">
                    <p style="margin: 0; color: #e4e4e7; font-size: 14px; line-height: 1.6;">
                      <strong style="color: #60a5fa;">📋 Importante:</strong> Nossa equipe entrará em contato em breve com mais detalhes sobre horários, uniforme e outras informações importantes.
                    </p>
                  </div>

                  <h3 style="margin: 30px 0 15px 0; color: #ffffff; font-size: 18px;">
                    Próximos Passos:
                  </h3>

                  <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #e4e4e7; font-size: 15px; line-height: 1.8;">
                    <li>Acesse seu dashboard para confirmar sua disponibilidade</li>
                    <li>Verifique todas as informações do evento</li>
                    <li>Fique atento às notificações e mensagens</li>
                    <li>Prepare-se para uma experiência incrível!</li>
                  </ul>

                  <div style="text-align: center; margin: 30px 0 0 0;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/profissional"
                       style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Acessar Meu Dashboard
                    </a>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div style="padding: 20px; text-align: center; border-top: 1px solid #27272a;">
                <p style="margin: 0 0 10px 0; color: #71717a; font-size: 14px;">
                  Qualquer dúvida, entre em contato conosco.
                </p>
                <p style="margin: 0 0 10px 0; color: #94a3b8; font-size: 14px; font-weight: 600;">
                  ${ADMIN_EMAIL}
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
      subject: `✅ Equipe completa para seu evento: ${params.eventName}`,
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
                  TECNOLOGIA EM EVENTOS
                </p>
              </div>

              <!-- Content -->
              <div style="padding: 40px 20px;">
                <div style="background-color: #1a1a1a; border: 1px solid #27272a; border-radius: 12px; padding: 30px;">
                  <h2 style="margin: 0 0 20px 0; color: #22c55e; font-size: 24px; text-align: center;">
                    ✅ Sua equipe está completa!
                  </h2>

                  <p style="margin: 0 0 20px 0; color: #e4e4e7; font-size: 16px; line-height: 1.6;">
                    Olá, <strong style="color: #ffffff;">${params.companyName}</strong>!
                  </p>

                  <p style="margin: 0 0 20px 0; color: #e4e4e7; font-size: 16px; line-height: 1.6;">
                    Temos uma ótima notícia! Conseguimos <strong style="color: #22c55e;">alocar todos os profissionais</strong> necessários para o seu evento.
                  </p>

                  <div style="background-color: #0f172a; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 8px;">
                    <h3 style="margin: 0 0 15px 0; color: #ffffff; font-size: 20px;">
                      ${params.eventName}
                    </h3>
                    <table style="width: 100%; margin: 0;">
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8; width: 140px;">Tipo de Evento:</td>
                        <td style="padding: 8px 0; color: #e4e4e7;">${params.eventType}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8;">Data de Início:</td>
                        <td style="padding: 8px 0; color: #22c55e; font-weight: 600;">${new Date(params.startDate).toLocaleDateString('pt-BR')}</td>
                      </tr>
                      ${params.endDate ? `
                        <tr>
                          <td style="padding: 8px 0; color: #94a3b8;">Data de Término:</td>
                          <td style="padding: 8px 0; color: #22c55e; font-weight: 600;">${new Date(params.endDate).toLocaleDateString('pt-BR')}</td>
                        </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8;">Local:</td>
                        <td style="padding: 8px 0; color: #e4e4e7;">${params.venueCity}, ${params.venueState}</td>
                      </tr>
                    </table>
                  </div>

                  <h3 style="margin: 30px 0 15px 0; color: #ffffff; font-size: 18px;">
                    👥 Profissionais Alocados:
                  </h3>

                  <div style="margin: 15px 0;">
                    ${params.professionalsNeeded.map((needed) => {
                      const allocation = params.allocations.find(
                        (a) => a.category === needed.category && a.shift === needed.shift
                      );
                      return `
                        <div style="background-color: #0f172a; border: 1px solid #27272a; padding: 15px; margin: 10px 0; border-radius: 8px;">
                          <p style="margin: 0 0 8px 0; color: #ffffff; font-size: 16px; font-weight: 600;">
                            ${needed.category} - Turno ${needed.shift}
                          </p>
                          <p style="margin: 0; color: #22c55e; font-size: 14px;">
                            ✓ ${allocation?.selectedProfessionals.length || 0}/${needed.quantity} profissionais selecionados
                          </p>
                        </div>
                      `;
                    }).join('')}
                  </div>

                  <div style="background-color: #0f172a; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 8px;">
                    <p style="margin: 0; color: #e4e4e7; font-size: 14px; line-height: 1.6;">
                      <strong style="color: #60a5fa;">📋 Próximos Passos:</strong> Nossa equipe entrará em contato em breve com os detalhes finais e valores. Você também pode acompanhar o status da sua solicitação no dashboard.
                    </p>
                  </div>

                  <div style="text-align: center; margin: 30px 0 0 0;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/contratante"
                       style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Acessar Meu Dashboard
                    </a>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div style="padding: 20px; text-align: center; border-top: 1px solid #27272a;">
                <p style="margin: 0 0 10px 0; color: #71717a; font-size: 14px;">
                  Qualquer dúvida, entre em contato conosco.
                </p>
                <p style="margin: 0 0 10px 0; color: #94a3b8; font-size: 14px; font-weight: 600;">
                  ${ADMIN_EMAIL}
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

interface SendSupplierQuoteRequestParams {
  supplierEmail: string;
  supplierName: string;
  companyName: string;
  eventName: string;
  eventType: string;
  startDate: string;
  endDate?: string;
  venueCity: string;
  venueState: string;
  venueName?: string;
  venueAddress?: string;
  equipmentList: Array<{
    item: string;
    quantity: number;
    estimatedBudget?: number;
  }>;
  additionalNotes?: string;
}

/**
 * Envia email para fornecedor solicitando orçamento de equipamentos
 */
interface SendProfessionalRejectionEmailParams {
  professionalName: string;
  professionalEmail: string;
  rejectionReason: string;
  documentsWithIssues?: string[];
}

/**
 * Envia email notificando profissional que foi rejeitado com feedback
 */
export async function sendProfessionalRejectionEmail(
  params: SendProfessionalRejectionEmailParams
): Promise<{ success: boolean; error?: string; emailId?: string }> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.hrxeventos.com.br';

    const { data, error } = await resend.emails.send({
      from: `HRX <${FROM_EMAIL}>`,
      to: [params.professionalEmail],
      subject: `Ajustes necessários no seu cadastro - HRX`,
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
                  <h2 style="margin: 0 0 20px 0; color: #f59e0b; font-size: 24px; text-align: center;">
                    ⚠️ Ajustes Necessários
                  </h2>

                  <p style="margin: 0 0 20px 0; color: #e4e4e7; font-size: 16px; line-height: 1.6;">
                    Olá <strong style="color: #ffffff;">${params.professionalName}</strong>,
                  </p>

                  <p style="margin: 0 0 20px 0; color: #e4e4e7; font-size: 16px; line-height: 1.6;">
                    Nossa equipe analisou seu cadastro e identificou alguns pontos que precisam ser ajustados antes da aprovação.
                  </p>

                  <div style="background-color: #0f172a; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px;">
                    <h3 style="margin: 0 0 10px 0; color: #f59e0b; font-size: 16px;">
                      Motivo da Pendência:
                    </h3>
                    <p style="margin: 0; color: #e4e4e7; font-size: 15px; line-height: 1.6; white-space: pre-line;">
                      ${params.rejectionReason}
                    </p>
                  </div>

                  ${params.documentsWithIssues && params.documentsWithIssues.length > 0 ? `
                    <div style="background-color: #1e1e1e; padding: 20px; margin: 20px 0; border-radius: 8px;">
                      <h3 style="margin: 0 0 15px 0; color: #ffffff; font-size: 16px;">
                        Documentos que precisam de atenção:
                      </h3>
                      <ul style="margin: 0; padding-left: 20px; color: #fbbf24; font-size: 15px; line-height: 1.8;">
                        ${params.documentsWithIssues.map(doc => `<li>${doc}</li>`).join('')}
                      </ul>
                    </div>
                  ` : ''}

                  <h3 style="margin: 30px 0 15px 0; color: #ffffff; font-size: 18px;">
                    O que fazer agora?
                  </h3>

                  <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #e4e4e7; font-size: 15px; line-height: 1.8;">
                    <li>Acesse seu perfil e faça as correções necessárias</li>
                    <li>Reenvie os documentos solicitados com melhor qualidade</li>
                    <li>Após os ajustes, sua documentação será reavaliada</li>
                  </ul>

                  <div style="text-align: center; margin: 30px 0 0 0;">
                    <a href="${appUrl}/cadastro-profissional"
                       style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Corrigir Cadastro Agora
                    </a>
                  </div>

                  <div style="background-color: #0f172a; padding: 15px; margin: 20px 0 0 0; border-radius: 8px; text-align: center;">
                    <p style="margin: 0; color: #94a3b8; font-size: 14px;">
                      💡 Dica: Certifique-se de que todos os documentos estejam legíveis e com boa iluminação.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div style="padding: 20px; text-align: center; border-top: 1px solid #27272a;">
                <p style="margin: 0 0 10px 0; color: #71717a; font-size: 14px;">
                  Precisando de ajuda? Entre em contato conosco.
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
      console.error('❌ Erro ao enviar email de rejeição:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Email de rejeição enviado para: ${params.professionalEmail} (ID: ${data?.id})`);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('❌ Erro ao enviar email de rejeição:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

export async function sendSupplierQuoteRequest(
  params: SendSupplierQuoteRequestParams
): Promise<{ success: boolean; error?: string; emailId?: string }> {
  try {
    // Calcular orçamento total estimado
    const totalEstimatedBudget = params.equipmentList.reduce(
      (sum, item) => sum + (item.estimatedBudget || 0),
      0
    );

    const { data, error} = await resend.emails.send({
      from: `HRX <${FROM_EMAIL}>`,
      to: [params.supplierEmail],
      subject: `📋 Solicitação de Orçamento - ${params.eventName}`,
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
                  TECNOLOGIA EM EVENTOS
                </p>
              </div>

              <!-- Content -->
              <div style="padding: 40px 20px;">
                <div style="background-color: #1a1a1a; border: 1px solid #27272a; border-radius: 12px; padding: 30px;">
                  <h2 style="margin: 0 0 20px 0; color: #3b82f6; font-size: 24px; text-align: center;">
                    📋 Solicitação de Orçamento
                  </h2>

                  <p style="margin: 0 0 20px 0; color: #e4e4e7; font-size: 16px; line-height: 1.6;">
                    Olá <strong style="color: #ffffff;">${params.supplierName}</strong>!
                  </p>

                  <p style="margin: 0 0 20px 0; color: #e4e4e7; font-size: 16px; line-height: 1.6;">
                    Estamos organizando um evento e precisamos de equipamentos. Gostaríamos de <strong style="color: #3b82f6;">solicitar um orçamento</strong> para os itens listados abaixo.
                  </p>

                  <div style="background-color: #0f172a; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 8px;">
                    <h3 style="margin: 0 0 15px 0; color: #ffffff; font-size: 18px;">
                      Detalhes do Evento
                    </h3>
                    <table style="width: 100%; margin: 0;">
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8; width: 140px;">Evento:</td>
                        <td style="padding: 8px 0; color: #e4e4e7; font-weight: 600;">${params.eventName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8;">Empresa:</td>
                        <td style="padding: 8px 0; color: #e4e4e7;">${params.companyName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8;">Tipo:</td>
                        <td style="padding: 8px 0; color: #e4e4e7;">${params.eventType}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8;">Data de Início:</td>
                        <td style="padding: 8px 0; color: #22c55e; font-weight: 600;">${new Date(params.startDate).toLocaleDateString('pt-BR')}</td>
                      </tr>
                      ${params.endDate ? `
                        <tr>
                          <td style="padding: 8px 0; color: #94a3b8;">Data de Término:</td>
                          <td style="padding: 8px 0; color: #22c55e; font-weight: 600;">${new Date(params.endDate).toLocaleDateString('pt-BR')}</td>
                        </tr>
                      ` : ''}
                      ${params.venueName ? `
                        <tr>
                          <td style="padding: 8px 0; color: #94a3b8;">Local:</td>
                          <td style="padding: 8px 0; color: #e4e4e7;">${params.venueName}</td>
                        </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8;">Cidade:</td>
                        <td style="padding: 8px 0; color: #e4e4e7;">${params.venueCity}, ${params.venueState}</td>
                      </tr>
                      ${params.venueAddress ? `
                        <tr>
                          <td style="padding: 8px 0; color: #94a3b8;">Endereço:</td>
                          <td style="padding: 8px 0; color: #e4e4e7;">${params.venueAddress}</td>
                        </tr>
                      ` : ''}
                    </table>
                  </div>

                  <div style="background-color: #0f172a; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px;">
                    <h3 style="margin: 0 0 15px 0; color: #fbbf24; font-size: 18px;">
                      📦 Equipamentos Necessários
                    </h3>
                    <table style="width: 100%; border-collapse: collapse;">
                      <thead>
                        <tr style="border-bottom: 2px solid #374151;">
                          <th style="text-align: left; padding: 10px 8px; color: #94a3b8; font-size: 14px;">Equipamento</th>
                          <th style="text-align: center; padding: 10px 8px; color: #94a3b8; font-size: 14px;">Qtd</th>
                          ${totalEstimatedBudget > 0 ? '<th style="text-align: right; padding: 10px 8px; color: #94a3b8; font-size: 14px;">Orç. Estimado</th>' : ''}
                        </tr>
                      </thead>
                      <tbody>
                        ${params.equipmentList.map(item => `
                          <tr style="border-bottom: 1px solid #27272a;">
                            <td style="padding: 10px 8px; color: #e4e4e7;">${item.item}</td>
                            <td style="text-align: center; padding: 10px 8px; color: #e4e4e7; font-weight: 600;">${item.quantity}</td>
                            ${totalEstimatedBudget > 0 && item.estimatedBudget ?
                              `<td style="text-align: right; padding: 10px 8px; color: #22c55e; font-weight: 600;">R$ ${item.estimatedBudget.toFixed(2)}</td>` :
                              totalEstimatedBudget > 0 ? '<td style="text-align: right; padding: 10px 8px; color: #71717a;">-</td>' : ''
                            }
                          </tr>
                        `).join('')}
                      </tbody>
                      ${totalEstimatedBudget > 0 ? `
                        <tfoot>
                          <tr style="border-top: 2px solid #f59e0b;">
                            <td colspan="2" style="padding: 12px 8px; text-align: right; color: #fbbf24; font-weight: 600;">Total Estimado:</td>
                            <td style="text-align: right; padding: 12px 8px; color: #22c55e; font-size: 18px; font-weight: bold;">R$ ${totalEstimatedBudget.toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      ` : ''}
                    </table>
                  </div>

                  ${params.additionalNotes ? `
                    <div style="background-color: #0f172a; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 8px;">
                      <p style="margin: 0 0 8px 0; color: #60a5fa; font-weight: 600;">📝 Observações Adicionais:</p>
                      <p style="margin: 0; color: #e4e4e7; line-height: 1.6;">${params.additionalNotes}</p>
                    </div>
                  ` : ''}

                  <div style="background-color: #0f172a; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
                    <p style="margin: 0 0 10px 0; color: #94a3b8; font-size: 14px;">
                      Por favor, envie sua proposta de orçamento para:
                    </p>
                    <p style="margin: 0; color: #3b82f6; font-size: 16px; font-weight: 600;">
                      ${ADMIN_EMAIL}
                    </p>
                  </div>

                  <p style="margin: 20px 0; color: #e4e4e7; font-size: 15px; text-align: center;">
                    Aguardamos seu retorno em breve! 🚀
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div style="padding: 20px; text-align: center; border-top: 1px solid #27272a;">
                <p style="margin: 0 0 10px 0; color: #71717a; font-size: 14px;">
                  Atenciosamente,
                </p>
                <p style="margin: 0 0 10px 0; color: #94a3b8; font-size: 14px; font-weight: 600;">
                  HRX Tecnologia
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
      console.error('❌ Erro ao enviar email para fornecedor:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Email de solicitação de orçamento enviado para: ${params.supplierEmail} (ID: ${data?.id})`);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('❌ Erro ao enviar email para fornecedor:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

// =====================================================
// QUOTE SYSTEM EMAILS (Sistema de Orçamentos)
// =====================================================

interface SendQuoteRequestEmailParams {
  supplierName: string;
  supplierEmail: string;
  quoteRequestId: string;
  clientName: string;
  eventDate?: string;
  eventType?: string;
  eventLocation?: string;
  items: {
    name: string;
    quantity: number;
    duration_days: number;
    description?: string;
  }[];
  deadline: string;
}

/**
 * Envia email de solicitação de orçamento para fornecedor
 */
export async function sendQuoteRequestEmail(
  params: SendQuoteRequestEmailParams
): Promise<{ success: boolean; error?: string; emailId?: string }> {
  try {
    const responseUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/fornecedor/orcamentos/${params.quoteRequestId}/responder`;

    const { data, error } = await resend.emails.send({
      from: `HRX <${FROM_EMAIL}>`,
      to: [params.supplierEmail],
      subject: `📋 Solicitação de Orçamento - ${params.clientName}`,
      react: <QuoteRequestEmail {...params} responseUrl={responseUrl} />,
    });

    if (error) {
      console.error('❌ Erro ao enviar solicitação de orçamento:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Solicitação de orçamento enviada para: ${params.supplierEmail} (ID: ${data?.id})`);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('❌ Erro ao enviar solicitação de orçamento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

interface SendUrgentQuoteAdminEmailParams {
  quoteRequestId: string;
  clientName: string;
  eventDate?: string;
  eventType?: string;
  eventLocation?: string;
  totalItems: number;
  description?: string;
  profitMargin: number;
}

/**
 * Envia email URGENTE para admin da HRX sobre nova solicitação de orçamento
 */
export async function sendUrgentQuoteAdminEmail(
  params: SendUrgentQuoteAdminEmailParams
): Promise<{ success: boolean; error?: string; emailId?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: `HRX Sistema <${FROM_EMAIL}>`,
      to: [ADMIN_EMAIL],
      subject: `🚨 URGENTE - Novo Orçamento ${params.quoteRequestId} - ${params.clientName}`,
      react: <UrgentQuoteAdminEmail {...params} />,
    });

    if (error) {
      console.error('❌ Erro ao enviar notificação urgente para admin:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Notificação urgente enviada para admin: ${ADMIN_EMAIL} (ID: ${data?.id})`);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('❌ Erro ao enviar notificação urgente:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

interface SendQuoteAcceptedEmailParams {
  supplierName: string;
  supplierEmail: string;
  quoteRequestId: string;
  clientName: string;
  eventDate?: string;
  eventType?: string;
  acceptedPrice: string;
  items: string[];
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
}

/**
 * Envia email notificando fornecedor que seu orçamento foi aceito
 */
export async function sendQuoteAcceptedEmail(
  params: SendQuoteAcceptedEmailParams
): Promise<{ success: boolean; error?: string; emailId?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: `HRX <${FROM_EMAIL}>`,
      to: [params.supplierEmail],
      subject: `✅ Orçamento Aceito! - ${params.clientName}`,
      react: <QuoteAcceptedEmail {...params} />,
    });

    if (error) {
      console.error('❌ Erro ao enviar email de orçamento aceito:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Email de orçamento aceito enviado para: ${params.supplierEmail} (ID: ${data?.id})`);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('❌ Erro ao enviar email de orçamento aceito:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

interface SendQuoteRejectedEmailParams {
  supplierName: string;
  supplierEmail: string;
  quoteRequestId: string;
  clientName: string;
  reason?: string;
}

/**
 * Envia email notificando fornecedor que seu orçamento NÃO foi aceito
 */
export async function sendQuoteRejectedEmail(
  params: SendQuoteRejectedEmailParams
): Promise<{ success: boolean; error?: string; emailId?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: `HRX <${FROM_EMAIL}>`,
      to: [params.supplierEmail],
      subject: `Atualização de Orçamento - ${params.clientName}`,
      react: <QuoteRejectedEmail {...params} />,
    });

    if (error) {
      console.error('❌ Erro ao enviar email de orçamento recusado:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Email de orçamento recusado enviado para: ${params.supplierEmail} (ID: ${data?.id})`);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('❌ Erro ao enviar email de orçamento recusado:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

// =====================================================
// EVENT PROJECT EMAILS (Sistema Unificado de Projetos)
// =====================================================

interface SendUrgentProjectAdminEmailParams {
  projectId: string;
  projectNumber: string;
  clientName: string;
  eventName: string;
  eventDate: string;
  eventType: string;
  venueAddress: string;
  profitMargin: number;
  teamCount: number;
  equipmentCount: number;
}

/**
 * Envia email URGENTE para admin da HRX sobre novo projeto urgente
 */
export async function sendUrgentProjectAdminEmail(
  params: SendUrgentProjectAdminEmailParams
): Promise<{ success: boolean; error?: string; emailId?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: `HRX Sistema <${FROM_EMAIL}>`,
      to: [ADMIN_EMAIL],
      subject: `🚨 URGENTE - Novo Projeto ${params.projectNumber} - ${params.clientName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #111111;">

              <!-- Alerta Urgente -->
              <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 25px 20px; text-align: center; border-bottom: 3px solid #f59e0b;">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold; text-transform: uppercase;">
                  🚨 PROJETO URGENTE 🚨
                </h1>
                <p style="margin: 8px 0 0 0; color: #fecaca; font-size: 14px; letter-spacing: 1px;">
                  Ação Imediata Necessária
                </p>
              </div>

              <!-- Header -->
              <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px 20px; text-align: center;">
                <h2 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">
                  Novo Projeto Urgente Criado
                </h2>
                <p style="margin: 8px 0 0 0; color: #fecaca; font-size: 14px;">
                  Cliente espera resposta rápida
                </p>
              </div>

              <!-- Content -->
              <div style="padding: 40px 20px;">
                <div style="background-color: #1a1a1a; border: 1px solid #dc2626; border-radius: 12px; padding: 30px;">

                  <h3 style="margin: 0 0 20px 0; color: #ffffff; font-size: 18px; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">
                    📋 Informações do Projeto
                  </h3>

                  <table style="width: 100%; margin: 0 0 20px 0;">
                    <tr>
                      <td style="padding: 10px 0; color: #94a3b8; width: 180px; border-bottom: 1px solid #27272a;">Número do Projeto:</td>
                      <td style="padding: 10px 0; color: #22c55e; font-weight: 700; font-size: 16px; border-bottom: 1px solid #27272a;">${params.projectNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #94a3b8; border-bottom: 1px solid #27272a;">Cliente:</td>
                      <td style="padding: 10px 0; color: #e4e4e7; font-weight: 600; border-bottom: 1px solid #27272a;">${params.clientName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #94a3b8; border-bottom: 1px solid #27272a;">Evento:</td>
                      <td style="padding: 10px 0; color: #e4e4e7; font-weight: 600; border-bottom: 1px solid #27272a;">${params.eventName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #94a3b8; border-bottom: 1px solid #27272a;">Tipo:</td>
                      <td style="padding: 10px 0; color: #e4e4e7; border-bottom: 1px solid #27272a;">${params.eventType}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #94a3b8; border-bottom: 1px solid #27272a;">Data:</td>
                      <td style="padding: 10px 0; color: #22c55e; font-weight: 600; border-bottom: 1px solid #27272a;">${params.eventDate}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #94a3b8;">Local:</td>
                      <td style="padding: 10px 0; color: #e4e4e7;">${params.venueAddress}</td>
                    </tr>
                  </table>

                  <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border: 2px solid #f59e0b; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #78350f; font-size: 13px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">
                      Margem de Lucro Estimada
                    </p>
                    <p style="margin: 0; color: #dc2626; font-size: 52px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                      ${params.profitMargin}%
                    </p>
                  </div>

                  <h3 style="margin: 25px 0 15px 0; color: #ffffff; font-size: 18px;">
                    📦 Recursos Solicitados
                  </h3>

                  <div style="margin: 15px 0;">
                    <div style="background-color: #0f172a; border: 1px solid #3b82f6; border-left: 4px solid #3b82f6; padding: 15px; margin: 8px 0; border-radius: 6px;">
                      <p style="margin: 0; color: #e4e4e7; font-size: 15px;">
                        👥 <strong style="color: #60a5fa;">Equipe:</strong> ${params.teamCount} profissional(is)
                      </p>
                    </div>
                    <div style="background-color: #0f172a; border: 1px solid #a855f7; border-left: 4px solid #a855f7; padding: 15px; margin: 8px 0; border-radius: 6px;">
                      <p style="margin: 0; color: #e4e4e7; font-size: 15px;">
                        🎪 <strong style="color: #c084fc;">Equipamentos:</strong> ${params.equipmentCount} item(ns)
                      </p>
                    </div>
                  </div>

                  <div style="margin: 30px 0; text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/projetos/${params.projectId}"
                       style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.4);">
                      🚀 VER PROJETO AGORA
                    </a>
                  </div>

                  <div style="background-color: #0f172a; border-left: 4px solid #22c55e; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <p style="margin: 0; color: #86efac; font-size: 14px; line-height: 1.6;">
                      💡 <strong>Dica:</strong> Projetos urgentes têm margem de lucro de 80% e devem ser priorizados!
                    </p>
                  </div>

                </div>
              </div>

              <!-- Footer -->
              <div style="padding: 20px; text-align: center; border-top: 1px solid #27272a;">
                <p style="margin: 0 0 5px 0; color: #71717a; font-size: 12px;">
                  Este é um email automático do sistema HRX
                </p>
                <p style="margin: 0; color: #52525b; font-size: 11px;">
                  ${ADMIN_EMAIL}
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Erro ao enviar notificação urgente de projeto para admin:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Notificação urgente de projeto enviada para admin: ${ADMIN_EMAIL} (ID: ${data?.id})`);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('❌ Erro ao enviar notificação urgente de projeto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

interface SendEquipmentQuoteRequestEmailParams {
  supplierName: string;
  supplierEmail: string;
  projectNumber: string;
  clientName: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  equipmentName: string;
  equipmentCategory: string;
  equipmentQuantity: number;
  equipmentDuration: number;
  equipmentDescription: string;
  deadline: string;
  quotationId: string;
}

/**
 * Envia email para fornecedor solicitando cotação de equipamento específico
 */
export async function sendEquipmentQuoteRequestEmail(
  params: SendEquipmentQuoteRequestEmailParams
): Promise<{ success: boolean; error?: string; emailId?: string }> {
  try {
    const responseUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/quotations/${params.quotationId}/respond?token=${encodeURIComponent(params.supplierEmail)}`;

    const { data, error } = await resend.emails.send({
      from: `HRX <${FROM_EMAIL}>`,
      to: [params.supplierEmail],
      subject: `📋 Cotação de Equipamento - ${params.eventName}`,
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
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                  📋 Solicitação de Cotação
                </h1>
                <p style="margin: 10px 0 0 0; color: #fecaca; font-size: 14px; letter-spacing: 1px;">
                  Projeto: ${params.projectNumber}
                </p>
              </div>

              <!-- Content -->
              <div style="padding: 40px 20px;">
                <div style="background-color: #1a1a1a; border: 1px solid #27272a; border-radius: 12px; padding: 30px;">

                  <p style="margin: 0 0 20px 0; color: #e4e4e7; font-size: 16px; line-height: 1.6;">
                    Olá, <strong style="color: #ffffff;">${params.supplierName}</strong>!
                  </p>

                  <p style="margin: 0 0 20px 0; color: #e4e4e7; font-size: 16px; line-height: 1.6;">
                    Gostaríamos de solicitar um <strong style="color: #3b82f6;">orçamento</strong> para o seguinte equipamento:
                  </p>

                  <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 8px;">
                    <p style="margin: 0 0 5px 0; color: #78350f; font-size: 12px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">
                      Prazo para Resposta
                    </p>
                    <p style="margin: 0; color: #78350f; font-size: 22px; font-weight: bold;">
                      ${params.deadline}
                    </p>
                  </div>

                  <h3 style="margin: 25px 0 15px 0; color: #ffffff; font-size: 18px; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">
                    Informações do Evento
                  </h3>

                  <table style="width: 100%; margin: 0 0 25px 0;">
                    <tr>
                      <td style="padding: 10px 0; color: #94a3b8; width: 120px; border-bottom: 1px solid #27272a;">Cliente:</td>
                      <td style="padding: 10px 0; color: #e4e4e7; font-weight: 600; border-bottom: 1px solid #27272a;">${params.clientName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #94a3b8; border-bottom: 1px solid #27272a;">Evento:</td>
                      <td style="padding: 10px 0; color: #e4e4e7; font-weight: 600; border-bottom: 1px solid #27272a;">${params.eventName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #94a3b8; border-bottom: 1px solid #27272a;">Data:</td>
                      <td style="padding: 10px 0; color: #22c55e; font-weight: 600; border-bottom: 1px solid #27272a;">${params.eventDate}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #94a3b8;">Local:</td>
                      <td style="padding: 10px 0; color: #e4e4e7;">${params.eventLocation}</td>
                    </tr>
                  </table>

                  <h3 style="margin: 25px 0 15px 0; color: #ffffff; font-size: 18px; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">
                    📦 Equipamento Solicitado
                  </h3>

                  <div style="background-color: #0f172a; border: 1px solid #3b82f6; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 15px 0;">
                    <h4 style="margin: 0 0 15px 0; color: #60a5fa; font-size: 18px; font-weight: 700;">
                      ${params.equipmentName}
                    </h4>
                    <table style="width: 100%;">
                      <tr>
                        <td style="padding: 6px 0; color: #94a3b8; width: 120px;">Categoria:</td>
                        <td style="padding: 6px 0; color: #e4e4e7;">${params.equipmentCategory}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #94a3b8;">Quantidade:</td>
                        <td style="padding: 6px 0; color: #22c55e; font-weight: 600; font-size: 16px;">${params.equipmentQuantity}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #94a3b8;">Duração:</td>
                        <td style="padding: 6px 0; color: #22c55e; font-weight: 600; font-size: 16px;">${params.equipmentDuration} dia(s)</td>
                      </tr>
                    </table>
                    ${params.equipmentDescription ? `
                      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #27272a;">
                        <p style="margin: 0 0 8px 0; color: #ffffff; font-weight: 600;">Detalhes:</p>
                        <p style="margin: 0; color: #e4e4e7; line-height: 1.6;">${params.equipmentDescription}</p>
                      </div>
                    ` : ''}
                  </div>

                  <h3 style="margin: 30px 0 15px 0; color: #ffffff; font-size: 18px;">
                    Como Responder:
                  </h3>

                  <ol style="margin: 0 0 25px 0; padding-left: 24px; color: #e4e4e7; font-size: 15px; line-height: 1.9;">
                    <li>Verifique a disponibilidade do equipamento para a data solicitada</li>
                    <li>Calcule seu melhor preço considerando quantidade e duração</li>
                    <li>Clique no botão abaixo para enviar sua proposta</li>
                  </ol>

                  <div style="margin: 30px 0; text-align: center;">
                    <a href="${responseUrl}"
                       style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.4);">
                      📝 ENVIAR COTAÇÃO
                    </a>
                  </div>

                  <div style="background-color: #0f172a; border-left: 4px solid #22c55e; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <p style="margin: 0; color: #86efac; font-size: 14px; line-height: 1.6;">
                      💡 <strong>Dica:</strong> Respostas rápidas aumentam suas chances de ser selecionado!
                    </p>
                  </div>

                  <div style="background-color: #0f172a; padding: 15px; margin: 20px 0; border-radius: 8px; text-align: center;">
                    <p style="margin: 0 0 5px 0; color: #94a3b8; font-size: 13px;">
                      Em caso de dúvidas, entre em contato:
                    </p>
                    <p style="margin: 0; color: #3b82f6; font-weight: 600;">
                      ${ADMIN_EMAIL}
                    </p>
                  </div>

                </div>
              </div>

              <!-- Footer -->
              <div style="padding: 20px; text-align: center; border-top: 1px solid #27272a;">
                <p style="margin: 0 0 10px 0; color: #71717a; font-size: 14px;">
                  Atenciosamente,
                </p>
                <p style="margin: 0 0 10px 0; color: #94a3b8; font-size: 14px; font-weight: 600;">
                  HRX Tecnologia em Eventos
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
      console.error('❌ Erro ao enviar solicitação de cotação de equipamento:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Solicitação de cotação de equipamento enviada para: ${params.supplierEmail} (ID: ${data?.id})`);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('❌ Erro ao enviar solicitação de cotação de equipamento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

// =====================================================
// PUBLIC EVENT REQUEST EMAILS (Formulário Público)
// =====================================================

interface SendEventRequestClientConfirmationParams {
  clientName: string;
  clientEmail: string;
  eventName: string;
  eventDate?: string;
  eventType: string;
  venueCity: string;
  venueState: string;
  projectNumber: string;
  professionalCount: number;
  equipmentCount: number;
  isUrgent: boolean;
}

/**
 * Envia email de confirmação para o cliente que solicitou evento via formulário público
 */
export async function sendEventRequestClientConfirmation(
  params: SendEventRequestClientConfirmationParams
): Promise<{ success: boolean; error?: string; emailId?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: `HRX <${FROM_EMAIL}>`,
      to: [params.clientEmail],
      subject: `✅ Solicitação Recebida - ${params.eventName} #${params.projectNumber}`,
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
                  TECNOLOGIA EM EVENTOS
                </p>
              </div>

              <!-- Content -->
              <div style="padding: 40px 20px;">
                <div style="background-color: #1a1a1a; border: 1px solid #27272a; border-radius: 12px; padding: 30px;">
                  <h2 style="margin: 0 0 20px 0; color: #22c55e; font-size: 24px; text-align: center;">
                    ✅ Solicitação Recebida com Sucesso!
                  </h2>

                  <p style="margin: 0 0 20px 0; color: #e4e4e7; font-size: 16px; line-height: 1.6;">
                    Olá <strong style="color: #ffffff;">${params.clientName}</strong>,
                  </p>

                  <p style="margin: 0 0 20px 0; color: #e4e4e7; font-size: 16px; line-height: 1.6;">
                    Recebemos sua solicitação de evento e já estamos trabalhando para preparar a melhor proposta para você!
                  </p>

                  ${params.isUrgent ? `
                    <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
                      <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 600;">
                        🚨 SOLICITAÇÃO URGENTE - PRIORIDADE MÁXIMA
                      </p>
                    </div>
                  ` : ''}

                  <div style="background-color: #0f172a; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 8px;">
                    <p style="margin: 0 0 10px 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: 600;">
                      Número do Projeto
                    </p>
                    <p style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                      #${params.projectNumber}
                    </p>
                  </div>

                  <h3 style="margin: 30px 0 15px 0; color: #ffffff; font-size: 18px;">
                    Detalhes da Solicitação:
                  </h3>

                  <table style="width: 100%; margin: 15px 0; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #27272a;">Evento:</td>
                      <td style="padding: 12px 0; color: #e4e4e7; border-bottom: 1px solid #27272a; text-align: right; font-weight: 600;">${params.eventName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #27272a;">Tipo:</td>
                      <td style="padding: 12px 0; color: #e4e4e7; border-bottom: 1px solid #27272a; text-align: right; font-weight: 600;">${params.eventType}</td>
                    </tr>
                    ${params.eventDate ? `
                      <tr>
                        <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #27272a;">Data:</td>
                        <td style="padding: 12px 0; color: #e4e4e7; border-bottom: 1px solid #27272a; text-align: right; font-weight: 600;">${new Date(params.eventDate).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    ` : ''}
                    <tr>
                      <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #27272a;">Local:</td>
                      <td style="padding: 12px 0; color: #e4e4e7; border-bottom: 1px solid #27272a; text-align: right; font-weight: 600;">${params.venueCity}, ${params.venueState}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; color: #94a3b8; border-bottom: 1px solid #27272a;">Profissionais:</td>
                      <td style="padding: 12px 0; color: #22c55e; border-bottom: 1px solid #27272a; text-align: right; font-weight: 600;">${params.professionalCount} categoria(s)</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; color: #94a3b8;">Equipamentos:</td>
                      <td style="padding: 12px 0; color: #22c55e; text-align: right; font-weight: 600;">${params.equipmentCount > 0 ? `${params.equipmentCount} tipo(s)` : 'Não solicitado'}</td>
                    </tr>
                  </table>

                  <h3 style="margin: 30px 0 15px 0; color: #ffffff; font-size: 18px;">
                    Próximos Passos:
                  </h3>

                  <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #e4e4e7; font-size: 15px; line-height: 1.8;">
                    <li>Nossa equipe está analisando sua solicitação</li>
                    <li>Faremos a seleção dos melhores profissionais</li>
                    <li>Prepararemos um orçamento detalhado</li>
                    <li>Entraremos em contato em breve com a proposta completa</li>
                  </ul>

                  <div style="background-color: #0f172a; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
                    <p style="margin: 0 0 10px 0; color: #94a3b8; font-size: 14px;">
                      Tempo estimado de resposta
                    </p>
                    <p style="margin: 0; color: #22c55e; font-size: 32px; font-weight: bold;">
                      ${params.isUrgent ? '2-4 horas' : '24 horas'}
                    </p>
                  </div>

                  <div style="background-color: #0f172a; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 8px;">
                    <p style="margin: 0; color: #e4e4e7; font-size: 14px; line-height: 1.6;">
                      💡 <strong>Dica:</strong> Guarde o número do projeto <strong style="color: #60a5fa;">#${params.projectNumber}</strong> para facilitar futuras consultas.
                    </p>
                  </div>

                </div>
              </div>

              <!-- Footer -->
              <div style="padding: 20px; text-align: center; border-top: 1px solid #27272a;">
                <p style="margin: 0 0 10px 0; color: #71717a; font-size: 14px;">
                  Tem alguma dúvida? Responda este email ou entre em contato:
                </p>
                <p style="margin: 0 0 10px 0; color: #94a3b8; font-size: 14px; font-weight: 600;">
                  ${ADMIN_EMAIL}
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
      console.error('❌ Erro ao enviar email de confirmação para cliente:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Email de confirmação enviado para cliente: ${params.clientEmail} (ID: ${data?.id})`);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('❌ Erro ao enviar email de confirmação:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

interface SendEventRequestAdminNotificationParams {
  projectId: string;
  projectNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany?: string;
  eventName: string;
  eventType: string;
  eventDate?: string;
  eventDescription: string;
  venueAddress: string;
  venueCity: string;
  venueState: string;
  expectedAttendance?: number;
  professionals: Array<{
    category_group: string;
    category: string;
    quantity: number;
    requirements?: string;
  }>;
  equipmentTypes: string[];
  equipmentNotes?: string;
  isUrgent: boolean;
  budgetRange?: string;
  additionalNotes?: string;
}

/**
 * Envia email de notificação para admin sobre nova solicitação de evento
 */
export async function sendEventRequestAdminNotification(
  params: SendEventRequestAdminNotificationParams
): Promise<{ success: boolean; error?: string; emailId?: string }> {
  try {
    const urgencyLabel = params.isUrgent ? '🚨 URGENTE - ' : '';

    const { data, error } = await resend.emails.send({
      from: `HRX Sistema <${FROM_EMAIL}>`,
      to: [ADMIN_EMAIL],
      subject: `${urgencyLabel}🎪 Nova Solicitação ${params.projectNumber} - ${params.clientName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
            <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff;">

              ${params.isUrgent ? `
                <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 20px; text-align: center;">
                  <h2 style="margin: 0; font-size: 24px;">🚨 SOLICITAÇÃO URGENTE 🚨</h2>
                  <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Resposta esperada em até 4 horas</p>
                </div>
              ` : ''}

              <!-- Header -->
              <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px 20px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                  Nova Solicitação de Evento
                </h1>
                <p style="margin: 10px 0 0 0; color: #fecaca; font-size: 16px; font-weight: 600;">
                  ${params.projectNumber}
                </p>
              </div>

              <!-- Content -->
              <div style="padding: 30px 20px;">

                <!-- Informações do Cliente -->
                <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 18px; border-bottom: 2px solid #dc2626; padding-bottom: 8px;">
                    👤 Informações do Cliente
                  </h2>
                  <table style="width: 100%;">
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; width: 140px;"><strong>Nome:</strong></td>
                      <td style="padding: 8px 0; color: #111827;">${params.clientName}</td>
                    </tr>
                    ${params.clientCompany ? `
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280;"><strong>Empresa:</strong></td>
                        <td style="padding: 8px 0; color: #111827;">${params.clientCompany}</td>
                      </tr>
                    ` : ''}
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;"><strong>Email:</strong></td>
                      <td style="padding: 8px 0; color: #111827;"><a href="mailto:${params.clientEmail}" style="color: #dc2626; text-decoration: none;">${params.clientEmail}</a></td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;"><strong>Telefone:</strong></td>
                      <td style="padding: 8px 0; color: #111827;"><a href="tel:${params.clientPhone}" style="color: #dc2626; text-decoration: none;">${params.clientPhone}</a></td>
                    </tr>
                  </table>
                </div>

                <!-- Informações do Evento -->
                <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h2 style="margin: 0 0 15px 0; color: #92400e; font-size: 18px; border-bottom: 2px solid #f59e0b; padding-bottom: 8px;">
                    🎪 Detalhes do Evento
                  </h2>
                  <table style="width: 100%;">
                    <tr>
                      <td style="padding: 8px 0; color: #78350f; width: 140px;"><strong>Nome:</strong></td>
                      <td style="padding: 8px 0; color: #92400e; font-weight: 600;">${params.eventName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #78350f;"><strong>Tipo:</strong></td>
                      <td style="padding: 8px 0; color: #92400e;">${params.eventType}</td>
                    </tr>
                    ${params.eventDate ? `
                      <tr>
                        <td style="padding: 8px 0; color: #78350f;"><strong>Data:</strong></td>
                        <td style="padding: 8px 0; color: #92400e; font-weight: 600;">${new Date(params.eventDate).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    ` : ''}
                    <tr>
                      <td style="padding: 8px 0; color: #78350f;"><strong>Local:</strong></td>
                      <td style="padding: 8px 0; color: #92400e;">${params.venueCity}, ${params.venueState}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #78350f;"><strong>Endereço:</strong></td>
                      <td style="padding: 8px 0; color: #92400e;">${params.venueAddress}</td>
                    </tr>
                    ${params.expectedAttendance ? `
                      <tr>
                        <td style="padding: 8px 0; color: #78350f;"><strong>Público:</strong></td>
                        <td style="padding: 8px 0; color: #92400e;">${params.expectedAttendance} pessoas</td>
                      </tr>
                    ` : ''}
                    ${params.budgetRange ? `
                      <tr>
                        <td style="padding: 8px 0; color: #78350f;"><strong>Orçamento:</strong></td>
                        <td style="padding: 8px 0; color: #92400e; font-weight: 600;">${params.budgetRange}</td>
                      </tr>
                    ` : ''}
                  </table>
                  ${params.eventDescription ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #fbbf24;">
                      <p style="margin: 0 0 5px 0; color: #78350f; font-weight: 600;">Descrição:</p>
                      <p style="margin: 0; color: #92400e; line-height: 1.6;">${params.eventDescription}</p>
                    </div>
                  ` : ''}
                </div>

                <!-- Profissionais Solicitados -->
                <div style="background-color: #e0f2fe; border: 1px solid #38bdf8; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h2 style="margin: 0 0 15px 0; color: #075985; font-size: 18px; border-bottom: 2px solid #0ea5e9; padding-bottom: 8px;">
                    👥 Profissionais Necessários (${params.professionals.length})
                  </h2>
                  ${params.professionals.map((prof, idx) => `
                    <div style="background-color: #ffffff; border: 1px solid #bae6fd; border-radius: 6px; padding: 15px; margin-bottom: 10px;">
                      <p style="margin: 0 0 8px 0; color: #0c4a6e; font-size: 16px; font-weight: 600;">
                        ${idx + 1}. ${prof.category}
                      </p>
                      <table style="width: 100%; font-size: 14px;">
                        <tr>
                          <td style="padding: 4px 0; color: #075985; width: 120px;">Categoria:</td>
                          <td style="padding: 4px 0; color: #0c4a6e;">${prof.category_group}</td>
                        </tr>
                        <tr>
                          <td style="padding: 4px 0; color: #075985;">Quantidade:</td>
                          <td style="padding: 4px 0; color: #0c4a6e; font-weight: 600;">${prof.quantity}</td>
                        </tr>
                        ${prof.requirements ? `
                          <tr>
                            <td style="padding: 4px 0; color: #075985; vertical-align: top;">Requisitos:</td>
                            <td style="padding: 4px 0; color: #0c4a6e;">${prof.requirements}</td>
                          </tr>
                        ` : ''}
                      </table>
                    </div>
                  `).join('')}
                </div>

                <!-- Equipamentos -->
                ${params.equipmentTypes.length > 0 ? `
                  <div style="background-color: #f3e8ff; border: 1px solid #c084fc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                    <h2 style="margin: 0 0 15px 0; color: #581c87; font-size: 18px; border-bottom: 2px solid #a855f7; padding-bottom: 8px;">
                      📦 Equipamentos Solicitados (${params.equipmentTypes.length})
                    </h2>
                    <ul style="margin: 0; padding-left: 20px; color: #581c87; line-height: 1.8;">
                      ${params.equipmentTypes.map(eq => `<li>${eq}</li>`).join('')}
                    </ul>
                    ${params.equipmentNotes ? `
                      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #c084fc;">
                        <p style="margin: 0 0 5px 0; color: #581c87; font-weight: 600;">Observações:</p>
                        <p style="margin: 0; color: #6b21a8; line-height: 1.6;">${params.equipmentNotes}</p>
                      </div>
                    ` : ''}
                  </div>
                ` : ''}

                <!-- Observações Adicionais -->
                ${params.additionalNotes ? `
                  <div style="background-color: #fef9e7; border: 1px solid #fde68a; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                    <h2 style="margin: 0 0 10px 0; color: #854d0e; font-size: 16px;">
                      📝 Observações Adicionais
                    </h2>
                    <p style="margin: 0; color: #713f12; line-height: 1.6;">
                      ${params.additionalNotes}
                    </p>
                  </div>
                ` : ''}

                <!-- Botão de Ação -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/projetos/${params.projectId}"
                     style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">
                    🚀 VER PROJETO COMPLETO
                  </a>
                </div>

                <!-- Instruções -->
                <div style="background-color: #f3f4f6; border-left: 4px solid #dc2626; padding: 15px; border-radius: 4px;">
                  <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">
                    <strong>Próximas Ações:</strong><br>
                    1. Revisar todos os detalhes do projeto<br>
                    2. Alocar profissionais disponíveis<br>
                    3. Solicitar orçamentos de equipamentos (se necessário)<br>
                    4. Preparar proposta comercial<br>
                    5. Entrar em contato com o cliente
                  </p>
                </div>

              </div>

              <!-- Footer -->
              <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #6b7280; font-size: 12px;">
                  Este é um email automático do sistema HRX<br>
                  © ${new Date().getFullYear()} HRX Tecnologia. Todos os direitos reservados.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Erro ao enviar notificação de solicitação de evento para admin:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Notificação de solicitação de evento enviada para admin: ${ADMIN_EMAIL} (ID: ${data?.id})`);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('❌ Erro ao enviar notificação de solicitação de evento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}
