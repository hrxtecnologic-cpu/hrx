import * as React from 'react';

interface ProfessionalWelcomeEmailProps {
  professionalName: string;
  professionalEmail: string;
}

export const ProfessionalWelcomeEmail: React.FC<ProfessionalWelcomeEmailProps> = ({
  professionalName,
  professionalEmail,
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
        h1 {
          color: #1a1a1a;
          font-size: 24px;
          margin-bottom: 20px;
        }
        .badge {
          display: inline-block;
          background: #fee2e2;
          color: #DC2626;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .content {
          color: #4a5568;
          font-size: 16px;
          margin-bottom: 30px;
        }
        .next-steps {
          background: #f9fafb;
          border-left: 4px solid #DC2626;
          padding: 20px;
          margin: 30px 0;
        }
        .next-steps h2 {
          color: #1a1a1a;
          font-size: 18px;
          margin-top: 0;
        }
        .next-steps ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        .next-steps li {
          margin: 8px 0;
          color: #4a5568;
        }
        .timeline {
          background: #fef2f2;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .timeline h3 {
          color: #DC2626;
          font-size: 16px;
          margin-top: 0;
        }
        .timeline p {
          color: #4a5568;
          margin: 5px 0;
        }
        .button {
          display: inline-block;
          background: #DC2626;
          color: #ffffff;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
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
        }
        .highlight {
          color: #DC2626;
          font-weight: 600;
        }
      `}</style>
    </head>
    <body>
      <div className="container">
        {/* Header */}
        <div className="header">
          <div className="logo">HRX</div>
          <span className="badge">✓ Cadastro Recebido</span>
        </div>

        {/* Greeting */}
        <h1>Bem-vindo à HRX, {professionalName}! 🎉</h1>

        {/* Content */}
        <div className="content">
          <p>
            Ficamos muito felizes em tê-lo(a) conosco! Seu cadastro foi recebido com sucesso e
            agora está em análise pela nossa equipe.
          </p>
        </div>

        {/* Timeline */}
        <div className="timeline">
          <h3>📋 O que acontece agora?</h3>
          <p><strong>1. Análise de Documentos (24-48h)</strong></p>
          <p style={{ marginLeft: '20px', fontSize: '14px' }}>
            Nossa equipe irá verificar seus documentos e certificações.
          </p>
          <p style={{ marginTop: '15px' }}><strong>2. Aprovação do Cadastro</strong></p>
          <p style={{ marginLeft: '20px', fontSize: '14px' }}>
            Você receberá um email confirmando a aprovação.
          </p>
          <p style={{ marginTop: '15px' }}><strong>3. Comece a Trabalhar!</strong></p>
          <p style={{ marginLeft: '20px', fontSize: '14px' }}>
            Assim que aprovado, você começará a receber ofertas de trabalho.
          </p>
        </div>

        {/* Next Steps */}
        <div className="next-steps">
          <h2>✅ Próximos Passos</h2>
          <ul>
            <li>Aguarde nosso email de confirmação</li>
            <li>Mantenha seu WhatsApp ativo para receber notificações</li>
            <li>Prepare-se para receber suas primeiras oportunidades</li>
          </ul>
        </div>

        {/* Contact */}
        <div className="contact">
          <p><strong>Precisa de ajuda?</strong></p>
          <p>📧 Email: {ADMIN_EMAIL}</p>
          <p>📱 WhatsApp: (21) 99999-9999</p>
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

// Valores padrão para variáveis não importadas
const ADMIN_EMAIL = process.env.RESEND_ADMIN_EMAIL || 'contato@hrx.com.br';
