import * as React from 'react';
import { EmailFooterDark, HRX_CONTACT_INFO, EMAIL_DARK_STYLES } from './EmailFooterDark';

interface ContactConfirmationEmailProps {
  name: string;
  subject: string;
}

/**
 * Template de email de confirmação para quem enviou o contato
 */
export default function ContactConfirmationEmail({
  name,
  subject,
}: ContactConfirmationEmailProps) {
  const firstName = name.split(' ')[0];

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
            <span className="badge">✅ Mensagem Recebida</span>
          </div>

          {/* Greeting */}
          <h1>Olá, {firstName}! 👋</h1>

          {/* Content */}
          <div className="content">
            <p>
              Recebemos sua mensagem com sucesso e agradecemos por entrar em contato conosco.
            </p>
          </div>

          {/* Subject Info */}
          <div className="highlight-box">
            <p style={{ margin: 0 }}>
              <strong>Assunto:</strong> {subject}
            </p>
          </div>

          <div className="content">
            <p>
              Nossa equipe irá analisar sua solicitação e responderemos em breve. Nosso prazo de
              resposta é de até <strong>2 horas durante horário comercial</strong> (Segunda a
              Sexta, 9h às 18h).
            </p>
          </div>

          <div className="divider"></div>

          {/* CTAs */}
          <div className="info-box">
            <h2>Precisa de uma equipe para seu evento?</h2>
            <p style={{ marginBottom: '20px' }}>
              Preencha nosso formulário de solicitação e receba uma proposta personalizada:
            </p>
            <div style={{ textAlign: 'center' }}>
              <a href={`${HRX_CONTACT_INFO.siteUrl}/solicitar-equipe`} className="button">
                Solicitar Equipe Agora
              </a>
            </div>
          </div>

          <div className="info-box">
            <h2>É um profissional buscando oportunidades?</h2>
            <p style={{ marginBottom: '20px' }}>
              Cadastre-se em nossa plataforma e tenha acesso a vagas em eventos:
            </p>
            <div style={{ textAlign: 'center' }}>
              <a
                href={`${HRX_CONTACT_INFO.siteUrl}/cadastrar-profissional`}
                className="button"
                style={{
                  background: 'transparent',
                  border: '2px solid #ef4444',
                  color: '#ef4444'
                }}
              >
                Cadastrar como Profissional
              </a>
            </div>
          </div>

          <div className="divider"></div>

          {/* Footer */}
          <EmailFooterDark showContact={true} />
        </div>
      </body>
    </html>
  );
}
