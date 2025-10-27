import * as React from 'react';
import { EmailFooterDark, HRX_CONTACT_INFO, EMAIL_DARK_STYLES } from './EmailFooterDark';

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
      <style>{EMAIL_DARK_STYLES}</style>
    </head>
    <body>
      <div className="container">
        {/* Header */}
        <div className="header">
          <img src={HRX_CONTACT_INFO.logoUrl} alt="HRX Eventos" className="logo-image" />
          <div className="logo">HRX EVENTOS</div>
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
        <div className="highlight-box">
          <h3>📋 O que acontece agora?</h3>
          <p><strong>1. Análise de Documentos (24-48h)</strong></p>
          <p style={{ marginLeft: '20px', fontSize: '14px', color: '#a1a1aa' }}>
            Nossa equipe irá verificar seus documentos e certificações.
          </p>
          <p style={{ marginTop: '15px' }}><strong>2. Aprovação do Cadastro</strong></p>
          <p style={{ marginLeft: '20px', fontSize: '14px', color: '#a1a1aa' }}>
            Você receberá um email confirmando a aprovação.
          </p>
          <p style={{ marginTop: '15px' }}><strong>3. Comece a Trabalhar!</strong></p>
          <p style={{ marginLeft: '20px', fontSize: '14px', color: '#a1a1aa' }}>
            Assim que aprovado, você começará a receber ofertas de trabalho.
          </p>
        </div>

        {/* Next Steps */}
        <div className="info-box">
          <h2>✅ Próximos Passos</h2>
          <ul>
            <li>Aguarde nosso email de confirmação</li>
            <li>Mantenha seu WhatsApp ativo para receber notificações</li>
            <li>Prepare-se para receber suas primeiras oportunidades</li>
          </ul>
        </div>

        {/* CTA Button */}
        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <a href={`${HRX_CONTACT_INFO.siteUrl}/professional/dashboard`} className="button">
            Acessar Meu Dashboard
          </a>
        </div>

        <div className="divider"></div>

        {/* Contact & Footer */}
        <EmailFooterDark recipientEmail={professionalEmail} showContact={true} />
      </div>
    </body>
  </html>
);
