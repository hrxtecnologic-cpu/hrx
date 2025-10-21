import * as React from 'react';

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
      <style>{`
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
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
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #DC2626;
          margin-bottom: 10px;
        }
        .badge {
          display: inline-block;
          background: #fef2f2;
          color: #DC2626;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 20px;
        }
        h1 {
          color: #1a1a1a;
          font-size: 24px;
          margin-bottom: 20px;
        }
        .content {
          color: #4a5568;
          font-size: 16px;
          margin-bottom: 30px;
        }
        .alert-box {
          background: #fef2f2;
          border-left: 4px solid #DC2626;
          padding: 20px;
          margin: 30px 0;
          border-radius: 6px;
        }
        .alert-box h2 {
          color: #DC2626;
          font-size: 18px;
          margin-top: 0;
          margin-bottom: 15px;
        }
        .alert-box ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        .alert-box li {
          margin: 8px 0;
          color: #4a5568;
        }
        .warning-box {
          background: #fffbeb;
          border-left: 4px solid #f59e0b;
          padding: 20px;
          margin: 30px 0;
          border-radius: 6px;
        }
        .warning-box h2 {
          color: #f59e0b;
          font-size: 18px;
          margin-top: 0;
          margin-bottom: 15px;
        }
        .rejected-item {
          background: #fff;
          padding: 12px;
          margin: 10px 0;
          border-radius: 4px;
          border: 1px solid #fed7aa;
        }
        .rejected-item strong {
          color: #ea580c;
          display: block;
          margin-bottom: 5px;
        }
        .rejected-item p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }
        .button {
          display: inline-block;
          background: #DC2626;
          color: #ffffff !important;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
          text-align: center;
        }
        .button:hover {
          background: #b91c1c;
        }
        .info-box {
          background: #f0f9ff;
          border-left: 4px solid #0284c7;
          padding: 20px;
          margin: 20px 0;
          border-radius: 6px;
        }
        .info-box h3 {
          color: #0284c7;
          font-size: 16px;
          margin-top: 0;
        }
        .info-box p {
          color: #4a5568;
          margin: 5px 0;
          font-size: 14px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
        .contact {
          background: #f9fafb;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .contact p {
          margin: 5px 0;
          color: #4a5568;
          font-size: 14px;
        }
        .highlight {
          color: #DC2626;
          font-weight: 600;
        }
        .urgent {
          color: #DC2626;
          font-weight: 700;
          font-size: 18px;
        }
      `}</style>
    </head>
    <body>
      <div className="container">
        {/* Header */}
        <div className="header">
          <div className="logo">HRX</div>
          <span className="badge">⚠️ Ação Necessária</span>
        </div>

        {/* Greeting */}
        <h1>Olá, {professionalName}!</h1>

        {/* Content */}
        <div className="content">
          <p>
            Estamos analisando seu cadastro e precisamos que você <span className="urgent">complete o envio dos documentos</span> para
            finalizarmos a aprovação.
          </p>
        </div>

        {/* Pending Documents */}
        {pendingDocuments.length > 0 && (
          <div className="alert-box">
            <h2>📄 Documentos Pendentes ({pendingDocuments.length})</h2>
            <p style={{ marginBottom: '15px' }}>Os seguintes documentos ainda não foram enviados:</p>
            <ul>
              {pendingDocuments.map((doc, index) => (
                <li key={index}>{doc}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Rejected Documents */}
        {rejectedDocuments.length > 0 && (
          <div className="warning-box">
            <h2>❌ Documentos Rejeitados ({rejectedDocuments.length})</h2>
            <p style={{ marginBottom: '15px' }}>
              Os seguintes documentos foram rejeitados e precisam ser reenviados:
            </p>
            {rejectedDocuments.map((doc, index) => (
              <div key={index} className="rejected-item">
                <strong>{doc.name}</strong>
                <p>Motivo: {doc.reason}</p>
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
          <h3>⏱️ Por que isso é importante?</h3>
          <p>
            • Cadastros incompletos não podem ser aprovados<br/>
            • Você só começará a receber ofertas de trabalho após aprovação<br/>
            • O processo de análise leva apenas 24-48h após envio completo
          </p>
        </div>

        {/* Contact */}
        <div className="contact">
          <p><strong>Precisa de ajuda?</strong></p>
          <p>📧 Email: atendimento@hrxeventos.com.br</p>
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#6b7280' }}>
            Respondemos em até 2 horas úteis
          </p>
        </div>

        {/* Footer */}
        <div className="footer">
          <p>
            Este email foi enviado para <span className="highlight">{professionalEmail}</span>
          </p>
          <p style={{ marginTop: '10px' }}>
            © 2025 HRX - Plataforma de Profissionais para Eventos
          </p>
        </div>
      </div>
    </body>
  </html>
);
