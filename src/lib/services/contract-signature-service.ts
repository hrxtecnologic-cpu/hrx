/**
 * =====================================================
 * Contract Signature Service
 * =====================================================
 * Shared logic for sending contracts for signature
 * =====================================================
 */

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import jwt from 'jsonwebtoken';
import { ContractSignatureEmail } from '@/lib/resend/templates/ContractSignatureEmail';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface SendContractResult {
  success: boolean;
  message: string;
  contract?: {
    id: string;
    contractNumber: string;
    status: string;
    sentAt: string;
    expiresAt: string;
  };
  recipient?: string;
  error?: string;
}

export async function sendContractForSignature(contractId: string): Promise<SendContractResult> {
  try {
    // 1. Buscar contrato com dados do projeto
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(
        `
        *,
        project:event_projects(
          id,
          project_number,
          client_name,
          client_email,
          event_name,
          event_date
        )
      `
      )
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      return {
        success: false,
        message: 'Contrato não encontrado',
        error: 'CONTRACT_NOT_FOUND',
      };
    }

    // Verificar se contrato já foi assinado
    if (contract.status === 'signed') {
      return {
        success: false,
        message: 'Contrato já foi assinado',
        error: 'ALREADY_SIGNED',
      };
    }

    // Verificar se projeto tem email
    if (!contract.project?.client_email) {
      return {
        success: false,
        message: 'Cliente não possui email cadastrado',
        error: 'NO_EMAIL',
      };
    }

    // 2. Gerar token JWT com expiração de 7 dias
    const tokenPayload = {
      contractId: contract.id,
      projectId: contract.project_id,
      clientEmail: contract.project.client_email,
      contractNumber: contract.contract_number,
    };

    const signatureToken = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: '7d',
    });

    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7);

    // 3. Atualizar contrato com token
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        signature_token: signatureToken,
        token_expires_at: tokenExpiresAt.toISOString(),
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', contractId);

    if (updateError) {
      console.error('Erro ao atualizar contrato:', updateError);
      return {
        success: false,
        message: 'Erro ao preparar contrato para envio',
        error: 'UPDATE_ERROR',
      };
    }

    // 4. Gerar URL de assinatura
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const signatureUrl = `${baseUrl}/api/contracts/${contractId}/sign?token=${signatureToken}`;

    // 5. Enviar email
    const emailData = {
      clientName: contract.project.client_name,
      clientEmail: contract.project.client_email,
      contractNumber: contract.contract_number,
      projectNumber: contract.project.project_number,
      eventName: contract.project.event_name,
      eventDate: contract.project.event_date,
      totalValue: contract.total_value,
      signatureUrl,
      expiresAt: tokenExpiresAt.toISOString(),
    };

    let emailSent = false;
    let emailError = null;

    try {
      const { data: emailResult, error: sendError } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'HRX Eventos <noreply@hrxeventos.com.br>',
        to: [contract.project.client_email],
        subject: `Contrato para Assinatura - ${contract.project.event_name}`,
        react: ContractSignatureEmail(emailData),
      });

      if (sendError) {
        emailError = sendError.message;
        console.error('[contract-signature-service] Erro ao enviar email:', sendError);
      } else {
        emailSent = true;
        console.log('[contract-signature-service] Email de contrato enviado:', emailResult?.id);
      }
    } catch (error: any) {
      emailError = error.message;
      console.error('[contract-signature-service] Exceção ao enviar email:', error);
    }

    // 6. Registrar email enviado
    if (emailSent) {
      await supabase.from('project_emails').insert({
        project_id: contract.project_id,
        email_type: 'contract_signature',
        recipient_email: contract.project.client_email,
        subject: `Contrato para Assinatura - ${contract.project.event_name}`,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
    }

    // 7. Log de auditoria
    await supabase.from('contract_audit_log').insert({
      contract_id: contractId,
      action: 'sent',
      performed_by: 'system',
      metadata: {
        recipient: contract.project.client_email,
        tokenExpiresAt: tokenExpiresAt.toISOString(),
      },
    });

    if (!emailSent) {
      return {
        success: false,
        message: `Erro ao enviar email: ${emailError}`,
        error: 'EMAIL_ERROR',
      };
    }

    return {
      success: true,
      message: 'Contrato enviado para assinatura',
      contract: {
        id: contract.id,
        contractNumber: contract.contract_number,
        status: 'sent',
        sentAt: new Date().toISOString(),
        expiresAt: tokenExpiresAt.toISOString(),
      },
      recipient: contract.project.client_email,
    };
  } catch (error: any) {
    console.error('[contract-signature-service] Erro ao enviar contrato:', error);
    return {
      success: false,
      message: error.message || 'Erro interno do servidor',
      error: 'INTERNAL_ERROR',
    };
  }
}
