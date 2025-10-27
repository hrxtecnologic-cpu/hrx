import * as React from 'react';
import { EmailFooterDark, HRX_CONTACT_INFO, EMAIL_DARK_STYLES } from './EmailFooterDark';

interface PendingDocumentsEmailProps {
  professionalName: string;
  professionalEmail: string;
  pendingDocuments: string[];
  rejectedDocuments?: Array<{
    name: string;
    reason: string;
  }>;
  profileUrl: string;
}

export const PendingDocumentsEmail: React.FC<PendingDocumentsEmailProps> = ({
  professionalName,
  professionalEmail,
  pendingDocuments,
  rejectedDocuments = [],
  profileUrl,
}) => (
  <html>
    <head>
      <style>{EMAIL_DARK_STYLES}</style>
    </head>
    <body>
      <div className="container">
        {/* Header */}
        <div className="header">
          <div className="logo">HRX EVENTOS</div>
          <span className="badge" style={{ background: '#7c2d12', color: '#fed7aa' }}>⚠️ Ação Necessária</span>
        </div>

        {/* Greeting */}
        <h1>Olá, {professionalName}!</h1>

        {/* Content */}
        <div className="content">
          <p>
            Estamos analisando seu cadastro e precisamos que você{' '}
            <span style={{ color: '#f87171', fontWeight: 700, fontSize: '18px' }}>complete o envio dos documentos</span> para
            finalizarmos a aprovação.
          </p>
        </div>

        {/* Pending Documents */}
        {pendingDocuments.length > 0 && (
          <div className="highlight-box">
            <h3>📄 Documentos Pendentes ({pendingDocuments.length})</h3>
            <p style={{ marginBottom: '15px' }}>Os seguintes documentos ainda não foram enviados:</p>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {pendingDocuments.map((doc, index) => (
                <li key={index} style={{ margin: '8px 0' }}>{doc}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Rejected Documents */}
        {rejectedDocuments.length > 0 && (
          <div style={{
            background: '#451a03',
            borderLeft: '4px solid #ea580c',
            padding: '20px',
            margin: '30px 0',
            borderRadius: '6px'
          }}>
            <h3 style={{ color: '#fb923c', fontSize: '18px', marginTop: 0, marginBottom: '15px' }}>
              ❌ Documentos Rejeitados ({rejectedDocuments.length})
            </h3>
            <p style={{ marginBottom: '15px' }}>
              Os seguintes documentos foram rejeitados e precisam ser reenviados:
            </p>
            {rejectedDocuments.map((doc, index) => (
              <div key={index} style={{
                background: '#1c1917',
                padding: '12px',
                margin: '10px 0',
                borderRadius: '4px',
                border: '1px solid #78350f'
              }}>
                <strong style={{ color: '#fb923c', display: 'block', marginBottom: '5px' }}>{doc.name}</strong>
                <p style={{ margin: 0, color: '#a8a29e', fontSize: '14px' }}>Motivo: {doc.reason}</p>
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <a href={profileUrl} className="button">
            📤 Enviar Documentos Agora
          </a>
        </div>

        {/* Info Box */}
        <div className="info-box">
          <h2>⏱️ Por que isso é importante?</h2>
          <ul>
            <li>Cadastros incompletos não podem ser aprovados</li>
            <li>Você só começará a receber ofertas de trabalho após aprovação</li>
            <li>O processo de análise leva apenas 24-48h após envio completo</li>
          </ul>
        </div>

        <div className="divider"></div>

        {/* Footer */}
        <EmailFooterDark recipientEmail={professionalEmail} showContact={true} />
      </div>
    </body>
  </html>
);
