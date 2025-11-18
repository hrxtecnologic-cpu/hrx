/**
 * =====================================================
 * Email Template: Contrato para Assinatura Digital
 * =====================================================
 * Dark Theme HRX - Padrão zinc
 * =====================================================
 */

import * as React from 'react';
import { EmailFooterDark, HRX_CONTACT_INFO, EMAIL_DARK_STYLES } from './EmailFooterDark';

interface ContractSignatureEmailProps {
  clientName: string;
  clientEmail: string;
  contractNumber: string;
  projectNumber: string;
  eventName: string;
  eventDate: string;
  totalValue: number;
  signatureUrl: string;
  expiresAt: string;
}

export const ContractSignatureEmail = (props: ContractSignatureEmailProps) => {
  const {
    clientName,
    clientEmail,
    contractNumber,
    projectNumber,
    eventName,
    eventDate,
    totalValue,
    signatureUrl,
    expiresAt,
  } = props;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const expirationDate = new Date(expiresAt);
  const daysToExpire = Math.ceil((expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <html>
      <head>
        <style>{EMAIL_DARK_STYLES}</style>
      </head>
      <body>
        <div className="container">
          {/* Header */}
          <div className="header">
            <div className="logo">HRX EVENTOS</div>
            <span className="badge" style={{
              background: '#dc2626',
              color: '#fff',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '600',
              display: 'inline-block',
              marginTop: '10px'
            }}>
              📋 Contrato para Assinatura Digital
            </span>
          </div>

          {/* Greeting */}
          <h1 style={{ color: '#fafafa', fontSize: '26px', marginBottom: '10px' }}>
            Olá, {clientName}!
          </h1>

          {/* Content */}
          <div className="content">
            <p style={{ color: '#d4d4d8', marginBottom: '25px', fontSize: '15px' }}>
              Sua proposta foi <strong style={{ color: '#4ade80' }}>aprovada</strong> e preparamos o
              contrato para assinatura digital! 🎉
            </p>
          </div>

          {/* Contract Info Card */}
          <div style={{
            background: '#18181b',
            borderRadius: '8px',
            padding: '25px',
            margin: '20px 0',
            border: '1px solid #27272a',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{
                    color: '#a1a1aa',
                    fontSize: '13px',
                    padding: '10px 0',
                    width: '35%',
                    verticalAlign: 'top'
                  }}>
                    Contrato:
                  </td>
                  <td style={{
                    color: '#fafafa',
                    fontSize: '15px',
                    fontWeight: '600',
                    padding: '10px 0',
                    wordWrap: 'break-word',
                    maxWidth: '300px'
                  }}>
                    {contractNumber}
                  </td>
                </tr>
                <tr>
                  <td style={{
                    color: '#a1a1aa',
                    fontSize: '13px',
                    padding: '10px 0',
                    verticalAlign: 'top'
                  }}>
                    Projeto:
                  </td>
                  <td style={{
                    color: '#fafafa',
                    fontSize: '15px',
                    fontWeight: '600',
                    padding: '10px 0',
                    wordWrap: 'break-word'
                  }}>
                    {projectNumber}
                  </td>
                </tr>
                <tr>
                  <td style={{
                    color: '#a1a1aa',
                    fontSize: '13px',
                    padding: '10px 0',
                    verticalAlign: 'top'
                  }}>
                    Evento:
                  </td>
                  <td style={{
                    color: '#fafafa',
                    fontSize: '15px',
                    fontWeight: '600',
                    padding: '10px 0',
                    wordWrap: 'break-word'
                  }}>
                    {eventName}
                  </td>
                </tr>
                <tr>
                  <td style={{
                    color: '#a1a1aa',
                    fontSize: '13px',
                    padding: '10px 0',
                    verticalAlign: 'top'
                  }}>
                    Data:
                  </td>
                  <td style={{
                    color: '#fafafa',
                    fontSize: '15px',
                    fontWeight: '600',
                    padding: '10px 0'
                  }}>
                    {formatDate(eventDate)}
                  </td>
                </tr>
                <tr>
                  <td style={{
                    color: '#a1a1aa',
                    fontSize: '13px',
                    padding: '15px 0 10px 0',
                    borderTop: '1px solid #27272a',
                    verticalAlign: 'top'
                  }}>
                    Valor Total:
                  </td>
                  <td style={{
                    color: '#4ade80',
                    fontSize: '22px',
                    fontWeight: '700',
                    padding: '15px 0 10px 0',
                    borderTop: '1px solid #27272a'
                  }}>
                    {formatCurrency(totalValue)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* CTA Button */}
          <div style={{ textAlign: 'center', margin: '35px 0' }}>
            <a
              href={signatureUrl}
              style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                color: '#ffffff',
                padding: '16px 40px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '16px',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
              }}
            >
              ✍️ Assinar Contrato Digitalmente
            </a>
          </div>

          {/* Expiration Warning */}
          <div style={{
            background: '#422006',
            border: '2px solid #ea580c',
            borderRadius: '8px',
            padding: '18px',
            margin: '25px 0'
          }}>
            <p style={{
              color: '#fdba74',
              fontSize: '14px',
              margin: '0',
              lineHeight: '1.6'
            }}>
              ⏰ <strong style={{ color: '#fed7aa' }}>Atenção:</strong> Este link expira em <strong>{daysToExpire} dias</strong>.
              <br />
              Assine o contrato antes de <strong>{formatDate(expiresAt)}</strong> para garantir a execução do seu evento.
            </p>
          </div>

          <div style={{
            height: '1px',
            background: '#27272a',
            margin: '30px 0'
          }} />

          {/* What Happens Next */}
          <div>
            <h2 style={{
              color: '#fafafa',
              fontSize: '20px',
              marginBottom: '15px',
              fontWeight: '600'
            }}>
              📋 Próximos Passos
            </h2>
            <p style={{ color: '#d4d4d8', marginBottom: '15px' }}>
              Após assinar o contrato digitalmente:
            </p>
            <ul style={{
              color: '#a1a1aa',
              fontSize: '14px',
              lineHeight: '1.8',
              paddingLeft: '20px',
              margin: '0 0 20px 0'
            }}>
              <li style={{ marginBottom: '8px' }}>
                <span style={{ color: '#4ade80' }}>✅</span> O projeto será automaticamente movido para status <strong style={{ color: '#d4d4d8' }}>&quot;Em Execução&quot;</strong>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <span style={{ color: '#4ade80' }}>✅</span> Nossa equipe receberá a <strong style={{ color: '#d4d4d8' }}>Ordem de Serviço gerada automaticamente por IA</strong>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <span style={{ color: '#4ade80' }}>✅</span> Iniciaremos os preparativos para o seu evento
              </li>
              <li style={{ marginBottom: '8px' }}>
                <span style={{ color: '#4ade80' }}>✅</span> Você receberá confirmação por email
              </li>
            </ul>
          </div>

          <div style={{
            height: '1px',
            background: '#27272a',
            margin: '30px 0'
          }} />

          {/* Security Info */}
          <div style={{
            background: '#14532d',
            border: '2px solid #16a34a',
            borderRadius: '8px',
            padding: '20px',
            margin: '25px 0'
          }}>
            <p style={{
              color: '#86efac',
              fontSize: '15px',
              fontWeight: '600',
              margin: '0 0 12px 0'
            }}>
              🔒 Segurança da Assinatura Digital
            </p>
            <p style={{
              color: '#bbf7d0',
              fontSize: '13px',
              margin: '0',
              lineHeight: '1.8'
            }}>
              • <strong>Criptografia SHA-256:</strong> Hash único gerado para garantir integridade
              <br />
              • <strong>Validade Jurídica:</strong> Assinatura digital tem mesmo valor que física
              <br />
              • <strong>Auditoria Completa:</strong> Registro de data, hora e IP da assinatura
              <br />
              • <strong>Documento Imutável:</strong> Qualquer alteração invalida o contrato
            </p>
          </div>

          <div style={{
            height: '1px',
            background: '#27272a',
            margin: '30px 0'
          }} />

          {/* Footer */}
          <EmailFooterDark recipientEmail={clientEmail} showContact={true} />
        </div>
      </body>
    </html>
  );
};

export default ContractSignatureEmail;
