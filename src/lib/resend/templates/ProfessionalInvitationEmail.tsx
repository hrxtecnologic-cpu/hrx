import * as React from 'react';
import { HRX_CONTACT_INFO } from './EmailFooter';

interface ProfessionalInvitationEmailProps {
  professionalName: string;
  professionalEmail: string;
  eventName: string;
  eventType: string;
  eventDate?: string;
  eventLocation: string;
  role: string;
  category: string;
  durationDays: number;
  dailyRate?: string;
  clientName: string;
  isUrgent: boolean;
  projectNumber: string;
  additionalNotes?: string;
  confirmUrl: string;
  rejectUrl: string;
}

export const ProfessionalInvitationEmail: React.FC<ProfessionalInvitationEmailProps> = ({
  professionalName,
  professionalEmail,
  eventName,
  eventType,
  eventDate,
  eventLocation,
  role,
  category,
  durationDays,
  dailyRate,
  clientName,
  isUrgent,
  projectNumber,
  additionalNotes,
  confirmUrl,
  rejectUrl,
}) => (
  <html>
    <head>
      <style>{`
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 700px;
          margin: 0 auto;
          padding: 20px;
          background: #f9fafb;
        }
        .container {
          background: #ffffff;
          border-radius: 8px;
          padding: 40px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%);
          color: white;
          padding: 30px;
          border-radius: 8px 8px 0 0;
          margin: -40px -40px 30px -40px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .badge {
          display: inline-block;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 10px;
        }
        .urgent-banner {
          background: #fef3c7;
          border: 2px solid #fbbf24;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: center;
        }
        .urgent-banner strong {
          color: #92400e;
          font-size: 16px;
        }
        .urgent-banner p {
          color: #b45309;
          margin: 5px 0 0 0;
        }
        .invitation-banner {
          background: #dbeafe;
          border: 2px solid #3b82f6;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: center;
        }
        .invitation-icon {
          font-size: 48px;
          margin-bottom: 10px;
        }
        .invitation-title {
          color: #1e40af;
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 5px 0;
        }
        .invitation-text {
          color: #3b82f6;
          font-size: 16px;
          margin: 0;
        }
        .section {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #DC2626;
        }
        .section h2 {
          color: #1a1a1a;
          font-size: 18px;
          margin-top: 0;
          margin-bottom: 15px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin: 15px 0;
        }
        .info-item {
          background: white;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }
        .info-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .info-value {
          color: #1a1a1a;
          font-size: 16px;
          font-weight: 500;
        }
        .rate-highlight {
          background: #dcfce7;
          border: 2px solid #16a34a;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: center;
        }
        .rate-label {
          color: #166534;
          font-size: 14px;
          font-weight: 600;
          margin: 0;
        }
        .rate-value {
          color: #16a34a;
          font-size: 28px;
          font-weight: 700;
          margin: 5px 0 0 0;
        }
        .action-buttons {
          text-align: center;
          margin: 30px 0;
          display: flex;
          gap: 15px;
          justify-content: center;
        }
        .button {
          display: inline-block;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          text-align: center;
          font-size: 16px;
          flex: 1;
          max-width: 200px;
        }
        .button-confirm {
          background: #16a34a;
          color: #ffffff;
        }
        .button-reject {
          background: #dc2626;
          color: #ffffff;
        }
        .notes-box {
          background: #fef9c3;
          border-left: 4px solid #facc15;
          padding: 15px;
          border-radius: 4px;
          margin: 15px 0;
        }
        .notes-box h3 {
          margin-top: 0;
          color: #854d0e;
          font-size: 16px;
        }
        .notes-box p {
          color: #713f12;
          margin: 0;
          white-space: pre-wrap;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
        .footer-warning {
          text-align: center;
          margin-top: 20px;
          padding: 15px;
          background: #fef2f2;
          border-radius: 6px;
          color: #991b1b;
          font-size: 13px;
        }
      `}</style>
    </head>
    <body>
      <div className="container">
        {/* Header */}
        <div className="header">
          <h1>🎯 Convite para Trabalhar</h1>
          <span className="badge">Projeto: {projectNumber}</span>
        </div>

        {/* Urgent Banner (condicional) */}
        {isUrgent && (
          <div className="urgent-banner">
            <strong>⚡ EVENTO URGENTE</strong>
            <p>Este projeto é urgente e precisa de confirmação rápida!</p>
          </div>
        )}

        {/* Invitation Banner */}
        <div className="invitation-banner">
          <div className="invitation-icon">✉️</div>
          <p className="invitation-title">Olá, {professionalName}!</p>
          <p className="invitation-text">
            Você foi convidado para trabalhar em um evento da HRX.
            Confira os detalhes abaixo e confirme sua disponibilidade.
          </p>
        </div>

        {/* Saudação */}
        <p>
          Temos um novo projeto e gostaríamos muito de contar com você!
          A HRX está organizando o evento <strong>{eventName}</strong> para o cliente <strong>{clientName}</strong>.
        </p>

        {/* Detalhes do Evento */}
        <div className="section">
          <h2>🎪 Detalhes do Evento</h2>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Nome do Evento</div>
              <div className="info-value">{eventName}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Tipo</div>
              <div className="info-value">{eventType}</div>
            </div>
            {eventDate && (
              <div className="info-item">
                <div className="info-label">Data</div>
                <div className="info-value">{eventDate}</div>
              </div>
            )}
            <div className="info-item">
              <div className="info-label">Local</div>
              <div className="info-value">{eventLocation}</div>
            </div>
          </div>
        </div>

        {/* Sua Função */}
        <div className="section">
          <h2>👤 Sua Função no Evento</h2>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Função</div>
              <div className="info-value">{role}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Categoria</div>
              <div className="info-value">{category}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Duração</div>
              <div className="info-value">
                {durationDays} {durationDays === 1 ? 'dia' : 'dias'}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Cliente</div>
              <div className="info-value">{clientName}</div>
            </div>
          </div>
        </div>

        {/* Remuneração */}
        {dailyRate && (
          <div className="rate-highlight">
            <p className="rate-label">💰 Diária Oferecida</p>
            <p className="rate-value">{dailyRate}</p>
            <p style={{ margin: '5px 0 0 0', color: '#166534', fontSize: '14px' }}>
              Total estimado: {dailyRate} × {durationDays} {durationDays === 1 ? 'dia' : 'dias'}
            </p>
          </div>
        )}

        {/* Observações Adicionais */}
        {additionalNotes && (
          <div className="notes-box">
            <h3>📝 Observações Importantes</h3>
            <p>{additionalNotes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          <a href={confirmUrl} className="button button-confirm">
            ✅ Confirmar Presença
          </a>
          <a href={rejectUrl} className="button button-reject">
            ❌ Recusar Convite
          </a>
        </div>

        {/* Informações Importantes */}
        <div className="section">
          <h2>ℹ️ Informações Importantes</h2>
          <ul style={{ paddingLeft: '20px', color: '#1a1a1a' }}>
            <li style={{ marginBottom: '8px' }}>
              <strong>Prazo:</strong> Por favor, confirme ou recuse o convite o quanto antes
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Confirmação:</strong> Ao confirmar, você se compromete a estar disponível nas datas
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Pagamento:</strong> Será realizado conforme contrato após conclusão do serviço
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Dúvidas:</strong> Entre em contato com nossa equipe pelos canais abaixo
            </li>
          </ul>
        </div>

        <p style={{ textAlign: 'center', color: '#3b82f6', fontWeight: '600', fontSize: '16px', marginTop: '30px' }}>
          ✨ Esperamos contar com você neste projeto!
        </p>

        {/* Footer Warning */}
        <div className="footer-warning">
          <strong>⚠️ Links de ação:</strong> Os botões acima são de uso único.
          Não compartilhe este email com terceiros.
        </div>

        {/* Footer */}
        <div className="footer">
          <p>📧 {HRX_CONTACT_INFO.nomeEmpresa}</p>
          <p style={{ marginTop: '5px', fontSize: '12px' }}>
            {HRX_CONTACT_INFO.email} | {HRX_CONTACT_INFO.telefone}
          </p>
          <p style={{ marginTop: '5px', fontSize: '12px' }}>
            {HRX_CONTACT_INFO.site}
          </p>
          <p style={{ marginTop: '10px', fontSize: '11px', color: '#9ca3af' }}>
            Este email foi enviado para: {professionalEmail}
          </p>
        </div>
      </div>
    </body>
  </html>
);
