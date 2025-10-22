import * as React from 'react';

// Informações oficiais da HRX
export const HRX_CONTACT_INFO = {
  site: 'www.hrxeventos.com.br',
  siteUrl: 'https://www.hrxeventos.com.br',
  telefone: '(21) 99995-2457',
  telefoneWhatsApp: '5521999952457', // Para links do WhatsApp
  email: 'atendimento@hrxeventos.com.br',
  nomeEmpresa: 'HRX Eventos',
  ano: new Date().getFullYear(),
};

interface EmailFooterProps {
  recipientEmail?: string;
  showContact?: boolean;
}

export const EmailFooter: React.FC<EmailFooterProps> = ({
  recipientEmail,
  showContact = true
}) => (
  <>
    {showContact && (
      <div className="contact">
        <p><strong>Precisa de ajuda?</strong></p>
        <p>🌐 Site: <a href={HRX_CONTACT_INFO.siteUrl} style={{ color: '#DC2626', textDecoration: 'none' }}>{HRX_CONTACT_INFO.site}</a></p>
        <p>📧 Email: <a href={`mailto:${HRX_CONTACT_INFO.email}`} style={{ color: '#DC2626', textDecoration: 'none' }}>{HRX_CONTACT_INFO.email}</a></p>
        <p>📱 WhatsApp: <a href={`https://wa.me/${HRX_CONTACT_INFO.telefoneWhatsApp}`} style={{ color: '#DC2626', textDecoration: 'none' }}>{HRX_CONTACT_INFO.telefone}</a></p>
      </div>
    )}

    <div className="footer">
      {recipientEmail && (
        <p>
          Este email foi enviado para <span className="highlight">{recipientEmail}</span>
        </p>
      )}
      <p style={{ marginTop: '10px' }}>
        © {HRX_CONTACT_INFO.ano} {HRX_CONTACT_INFO.nomeEmpresa} - Plataforma de Profissionais para Eventos
      </p>
      <p style={{ marginTop: '5px', fontSize: '12px', color: '#9ca3af' }}>
        {HRX_CONTACT_INFO.site}
      </p>
    </div>
  </>
);

// Estilos CSS para os emails (para incluir no <style>)
export const EMAIL_FOOTER_STYLES = `
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
  .contact a {
    color: #DC2626;
    text-decoration: none;
  }
  .contact a:hover {
    text-decoration: underline;
  }
  .footer {
    text-align: center;
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #e5e7eb;
    color: #6b7280;
    font-size: 14px;
  }
  .highlight {
    color: #DC2626;
    font-weight: 600;
  }
`;
