import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { render } from '@react-email/render';
import { ProfessionalWelcomeEmail } from '@/lib/resend/templates/ProfessionalWelcomeEmail';
import { SimpleWelcomeEmail } from '@/lib/resend/templates/SimpleWelcomeEmail';
import { ContractorConfirmationEmail } from '@/lib/resend/templates/ContractorConfirmationEmail';
import ContactConfirmationEmail from '@/lib/resend/templates/ContactConfirmationEmail';
import { PendingDocumentsEmail } from '@/lib/resend/templates/PendingDocumentsEmail';
import { QuoteRequestEmail } from '@/lib/resend/templates/QuoteRequestEmail';
import { QuoteAcceptedEmail } from '@/lib/resend/templates/QuoteAcceptedEmail';
import { QuoteRejectedEmail } from '@/lib/resend/templates/QuoteRejectedEmail';
import { AdminNotificationEmail } from '@/lib/resend/templates/AdminNotificationEmail';
import { AdminRequestNotificationEmail } from '@/lib/resend/templates/AdminRequestNotificationEmail';
import { UrgentQuoteAdminEmail } from '@/lib/resend/templates/UrgentQuoteAdminEmail';
import ContactNotificationEmail from '@/lib/resend/templates/ContactNotificationEmail';
import { FinalProposalEmail } from '@/lib/resend/templates/FinalProposalEmail';

/**
 * GET /api/admin/emails/preview
 *
 * Renderiza preview de template de email
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get('template');

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID obrigatorio' }, { status: 400 });
    }

    // Dados de exemplo completos para preview de TODOS os templates
    const mockData = {
      // Professional Welcome & Simple Welcome
      professionalName: 'João Silva',
      professionalEmail: 'joao.silva@example.com',
      professionalPhone: '(11) 98765-4321',
      professionalCPF: '123.456.789-00',
      professionalId: 'prof-123',
      loginUrl: 'https://hrx.com/login',
      profileUrl: 'https://hrx.com/perfil',
      city: 'São Paulo',
      state: 'SP',
      hasExperience: true,
      yearsOfExperience: '5 anos',
      documentsUploaded: ['RG', 'CPF', 'Comprovante de Residência'],

      // Contractor Confirmation
      responsibleName: 'Maria Santos',
      eventName: 'Casamento de Maria & João',
      requestNumber: 'REQ-2025-001',
      venueAddress: 'Rua das Flores, 123',
      venueCity: 'São Paulo',
      venueState: 'SP',
      venueName: 'Espaço Jardim',
      needsEquipment: true,
      equipmentList: ['Cadeiras', 'Mesas', 'Tenda'],
      budgetRange: 'R$ 30.000 - R$ 50.000',

      // Admin Request Notification
      companyName: 'Eventos Premium Ltda',
      cnpj: '12.345.678/0001-90',
      responsibleRole: 'Gerente de Eventos',
      companyAddress: 'Av. Paulista, 1000 - São Paulo/SP',
      website: 'https://eventospremium.com.br',
      eventDescription: 'Casamento elegante com 200 convidados',
      eventTypeOther: 'Cerimônia religiosa + Recepção',
      expectedAttendance: 200,

      // Contact
      name: 'Carlos Oliveira',
      email: 'carlos@example.com',
      phone: '(11) 91234-5678',
      subject: 'Solicitação de orçamento',
      message: 'Gostaria de saber mais informações sobre os serviços.',
      submittedAt: new Date().toISOString(),

      // Pending Documents
      pendingDocuments: ['RG', 'Comprovante de Residência', 'Certificado'],
      rejectedDocuments: [
        { name: 'RG', reason: 'Documento ilegível' },
        { name: 'Comprovante', reason: 'Data antiga' },
      ],

      // Quote Request & Accepted
      supplierName: 'Fornecedor Premium',
      quoteRequestId: 'QUOTE-789',
      clientName: 'Maria Santos',
      eventType: 'Casamento',
      eventDate: '15 de Dezembro de 2025',
      eventLocation: 'São Paulo - SP',
      itemsForQuote: [
        { name: 'Cadeiras Tiffany', quantity: 150, duration_days: 2, description: 'Cadeiras brancas' },
        { name: 'Mesas Redondas', quantity: 15, duration_days: 2, description: 'Mesas para 10 pessoas' },
      ],
      deadline: '01 de Dezembro de 2025',
      responseUrl: 'https://hrx.com/orcamentos/responder/QUOTE-789',
      acceptedPrice: 'R$ 25.000,00',
      itemsAccepted: ['150 Cadeiras Tiffany', '15 Mesas Redondas', '15 Toalhas de Mesa'],
      contactPerson: 'Ana Paula Silva',
      contactPhone: '(11) 3456-7890',
      contactEmail: 'ana.silva@hrx.com',

      // Quote Rejected
      reason: 'Optamos por outra proposta mais adequada ao orçamento.',

      // Admin Notification
      categories: ['Garçom', 'Bartender', 'Recepcionista'],

      // Urgent Quote Admin
      totalItems: 3,
      description: 'Evento urgente - casamento em 30 dias',
      profitMargin: 80,

      // Final Proposal
      proposalNumber: 'PROP-2025-001',
      projectId: 'PROJ-123',
      clientEmail: 'maria.santos@example.com',
      teamMembers: [
        { category: 'Garçom', quantity: 10, unit_price: 200, total_price: 2000, shift: 'Noturno' },
        { category: 'Bartender', quantity: 3, unit_price: 250, total_price: 750, shift: 'Noturno' },
        { category: 'Recepcionista', quantity: 2, unit_price: 180, total_price: 360, shift: 'Diurno' },
      ],
      equipment: [
        { name: 'Cadeiras Tiffany', category: 'Mobiliário', quantity: 150, duration_days: 2, unit_price: 15, total_price: 4500 },
        { name: 'Mesas Redondas', category: 'Mobiliário', quantity: 15, duration_days: 2, unit_price: 50, total_price: 1500 },
        { name: 'Toalhas de Mesa', category: 'Decoração', quantity: 15, duration_days: 2, unit_price: 30, total_price: 900 },
      ],
      teamSubtotal: 3110,
      equipmentSubtotal: 6900,
      subtotal: 10010,
      total: 10010,
      acceptUrl: 'https://hrx.com/propostas/PROP-2025-001/aceitar',
      rejectUrl: 'https://hrx.com/propostas/PROP-2025-001/rejeitar',

      // Dados comuns reutilizados
      startDate: '15 de Dezembro de 2025',
      endDate: '16 de Dezembro de 2025',
      urgency: 'normal',
      professionalsNeeded: [
        { role: 'Garçom', quantity: 10 },
        { role: 'Bartender', quantity: 3 },
        { role: 'Recepcionista', quantity: 2 },
      ],
    };

    let emailHtml: string;

    // Renderizar template baseado no ID
    switch (templateId) {
      case 'professional-welcome':
        emailHtml = await render(
          ProfessionalWelcomeEmail({
            professionalName: mockData.professionalName,
            professionalEmail: mockData.professionalEmail,
          })
        );
        break;

      case 'simple-welcome':
        emailHtml = await render(
          SimpleWelcomeEmail({
            professionalName: mockData.professionalName,
            professionalEmail: mockData.professionalEmail,
          })
        );
        break;

      case 'contractor-confirmation':
        emailHtml = await render(
          ContractorConfirmationEmail({
            responsibleName: mockData.responsibleName,
            eventName: mockData.eventName,
            requestNumber: mockData.requestNumber,
            startDate: mockData.startDate,
            endDate: mockData.endDate,
            venueAddress: mockData.venueAddress,
            venueCity: mockData.venueCity,
            venueState: mockData.venueState,
            professionalsNeeded: mockData.professionalsNeeded,
            needsEquipment: mockData.needsEquipment,
            equipmentList: mockData.equipmentList,
            budgetRange: mockData.budgetRange,
            urgency: mockData.urgency,
          })
        );
        break;

      case 'contact-confirmation':
        emailHtml = await render(
          ContactConfirmationEmail({
            name: mockData.name,
            subject: mockData.subject,
          })
        );
        break;

      case 'pending-documents':
        emailHtml = await render(
          PendingDocumentsEmail({
            professionalName: mockData.professionalName,
            professionalEmail: mockData.professionalEmail,
            pendingDocuments: mockData.pendingDocuments,
            rejectedDocuments: mockData.rejectedDocuments,
            profileUrl: mockData.profileUrl,
          })
        );
        break;

      case 'quote-request':
        emailHtml = await render(
          QuoteRequestEmail({
            supplierName: mockData.supplierName,
            quoteRequestId: mockData.quoteRequestId,
            clientName: mockData.clientName,
            eventDate: mockData.eventDate,
            eventType: mockData.eventType,
            eventLocation: mockData.eventLocation,
            items: mockData.itemsForQuote,
            deadline: mockData.deadline,
            responseUrl: mockData.responseUrl,
          })
        );
        break;

      case 'quote-accepted':
        emailHtml = await render(
          QuoteAcceptedEmail({
            supplierName: mockData.supplierName,
            quoteRequestId: mockData.quoteRequestId,
            clientName: mockData.clientName,
            eventDate: mockData.eventDate,
            eventType: mockData.eventType,
            acceptedPrice: mockData.acceptedPrice,
            items: mockData.itemsAccepted,
            contactPerson: mockData.contactPerson,
            contactPhone: mockData.contactPhone,
            contactEmail: mockData.contactEmail,
          })
        );
        break;

      case 'quote-rejected':
        emailHtml = await render(
          QuoteRejectedEmail({
            supplierName: mockData.supplierName,
            quoteRequestId: mockData.quoteRequestId,
            clientName: mockData.clientName,
            reason: mockData.reason,
          })
        );
        break;

      case 'admin-notification':
        emailHtml = await render(
          AdminNotificationEmail({
            professionalName: mockData.professionalName,
            professionalEmail: mockData.professionalEmail,
            professionalPhone: mockData.professionalPhone,
            professionalCPF: mockData.professionalCPF,
            categories: mockData.categories,
            hasExperience: mockData.hasExperience,
            yearsOfExperience: mockData.yearsOfExperience,
            city: mockData.city,
            state: mockData.state,
            documentsUploaded: mockData.documentsUploaded,
            professionalId: mockData.professionalId,
          })
        );
        break;

      case 'admin-request-notification':
        emailHtml = await render(
          AdminRequestNotificationEmail({
            requestNumber: mockData.requestNumber,
            requestId: mockData.projectId,
            urgency: mockData.urgency,
            companyName: mockData.companyName,
            cnpj: mockData.cnpj,
            responsibleName: mockData.responsibleName,
            responsibleRole: mockData.responsibleRole,
            email: mockData.email,
            phone: mockData.phone,
            companyAddress: mockData.companyAddress,
            website: mockData.website,
            eventName: mockData.eventName,
            eventType: mockData.eventType,
            eventTypeOther: mockData.eventTypeOther,
            eventDescription: mockData.eventDescription,
            startDate: mockData.startDate,
            endDate: mockData.endDate,
            expectedAttendance: mockData.expectedAttendance,
            venueName: mockData.venueName,
            venueAddress: mockData.venueAddress,
            venueCity: mockData.venueCity,
            venueState: mockData.venueState,
            professionalsNeeded: mockData.professionalsNeeded.map(p => ({
              category: p.role,
              quantity: p.quantity,
              shift: 'Período integral',
            })),
            needsEquipment: mockData.needsEquipment,
            equipmentList: mockData.equipmentList,
          })
        );
        break;

      case 'urgent-quote-admin':
        emailHtml = await render(
          UrgentQuoteAdminEmail({
            quoteRequestId: mockData.quoteRequestId,
            clientName: mockData.clientName,
            eventDate: mockData.eventDate,
            eventType: mockData.eventType,
            eventLocation: mockData.eventLocation,
            totalItems: mockData.totalItems,
            description: mockData.description,
            profitMargin: mockData.profitMargin,
          })
        );
        break;

      case 'contact-notification':
        emailHtml = await render(
          ContactNotificationEmail({
            name: mockData.name,
            email: mockData.email,
            phone: mockData.phone,
            subject: mockData.subject,
            message: mockData.message,
            submittedAt: mockData.submittedAt,
          })
        );
        break;

      case 'final-proposal':
        emailHtml = await render(
          FinalProposalEmail({
            clientName: mockData.responsibleName,
            clientEmail: mockData.clientEmail,
            proposalNumber: mockData.proposalNumber,
            projectId: mockData.projectId,
            eventName: mockData.eventName,
            eventDate: mockData.eventDate,
            eventType: mockData.eventType,
            venueName: mockData.venueName,
            venueAddress: mockData.venueAddress,
            venueCity: mockData.venueCity,
            venueState: mockData.venueState,
            expectedAttendance: mockData.expectedAttendance,
            teamMembers: mockData.teamMembers,
            teamSubtotal: mockData.teamSubtotal,
            equipment: mockData.equipment,
            equipmentSubtotal: mockData.equipmentSubtotal,
            subtotal: mockData.subtotal,
            total: mockData.total,
            acceptUrl: mockData.acceptUrl,
            rejectUrl: mockData.rejectUrl,
          })
        );
        break;

      default:
        return NextResponse.json({ error: 'Template nao encontrado' }, { status: 404 });
    }

    // Retornar HTML com headers corretos
    return new NextResponse(emailHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Erro ao gerar preview:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
