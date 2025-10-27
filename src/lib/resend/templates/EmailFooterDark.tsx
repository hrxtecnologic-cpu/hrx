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
  logoUrl: 'https://www.hrxeventos.com.br/icons/icon-192x192.png',
};

interface EmailFooterDarkProps {
  recipientEmail?: string;
  showContact?: boolean;
}

export const EmailFooterDark: React.FC<EmailFooterDarkProps> = ({
  recipientEmail,
  showContact = true
}) => (
  <>
    {showContact && (
      <div style={{
        background: '#18181b',
        padding: '20px',
        borderRadius: '8px',
        margin: '30px 0',
        border: '1px solid #27272a'
      }}>
        <p style={{
          margin: '0 0 15px 0',
          color: '#fafafa',
          fontSize: '16px',
          fontWeight: '600'
        }}>
          Precisa de ajuda?
        </p>
        <p style={{ margin: '8px 0', color: '#a1a1aa', fontSize: '14px' }}>
          🌐 Site: <a href={HRX_CONTACT_INFO.siteUrl} style={{ color: '#ef4444', textDecoration: 'none', fontWeight: '500' }}>{HRX_CONTACT_INFO.site}</a>
        </p>
        <p style={{ margin: '8px 0', color: '#a1a1aa', fontSize: '14px' }}>
          📧 Email: <a href={`mailto:${HRX_CONTACT_INFO.email}`} style={{ color: '#ef4444', textDecoration: 'none', fontWeight: '500' }}>{HRX_CONTACT_INFO.email}</a>
        </p>
        <p style={{ margin: '8px 0', color: '#a1a1aa', fontSize: '14px' }}>
          📱 WhatsApp: <a href={`https://wa.me/${HRX_CONTACT_INFO.telefoneWhatsApp}`} style={{ color: '#ef4444', textDecoration: 'none', fontWeight: '500' }}>{HRX_CONTACT_INFO.telefone}</a>
        </p>
      </div>
    )}

    <div style={{
      textAlign: 'center',
      marginTop: '40px',
      paddingTop: '20px',
      borderTop: '1px solid #27272a',
      color: '#71717a',
      fontSize: '13px'
    }}>
      {recipientEmail && (
        <p style={{ margin: '0 0 10px 0' }}>
          Este email foi enviado para <span style={{ color: '#ef4444', fontWeight: '600' }}>{recipientEmail}</span>
        </p>
      )}
      <p style={{ margin: '10px 0 5px 0', color: '#a1a1aa' }}>
        © {HRX_CONTACT_INFO.ano} {HRX_CONTACT_INFO.nomeEmpresa} - Plataforma de Profissionais para Eventos
      </p>
      <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#52525b' }}>
        {HRX_CONTACT_INFO.site}
      </p>
    </div>
  </>
);

// Estilos base para emails DARK (tema zinc escuro como a aplicação)
export const EMAIL_DARK_STYLES = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #fafafa;
    background: #0a0a0a;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }
  .container {
    background: #09090b;
    border-radius: 12px;
    padding: 40px;
    border: 1px solid #18181b;
  }
  .header {
    text-align: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid #27272a;
  }
  .logo {
    font-size: 32px;
    font-weight: bold;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 10px;
  }
  .logo-image {
    width: 120px;
    height: auto;
    margin: 0 auto 15px;
    display: block;
  }
  h1 {
    color: #fafafa;
    font-size: 24px;
    margin-bottom: 10px;
    font-weight: 700;
  }
  .badge {
    display: inline-block;
    background: #7f1d1d;
    color: #fca5a5;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 20px;
    border: 1px solid #991b1b;
  }
  .content {
    color: #d4d4d8;
    font-size: 15px;
    margin-bottom: 30px;
  }
  .info-box {
    background: #18181b;
    border-left: 4px solid #ef4444;
    padding: 20px;
    margin: 25px 0;
    border-radius: 8px;
  }
  .info-box h2 {
    color: #fafafa;
    font-size: 18px;
    margin-top: 0;
    margin-bottom: 15px;
  }
  .info-box p, .info-box ul, .info-box li {
    color: #d4d4d8;
    margin: 8px 0;
  }
  .highlight-box {
    background: #18181b;
    padding: 20px;
    border-radius: 8px;
    margin: 20px 0;
    border: 1px solid #27272a;
  }
  .highlight-box h3 {
    color: #ef4444;
    font-size: 16px;
    margin-top: 0;
    margin-bottom: 10px;
  }
  .highlight-box p {
    color: #d4d4d8;
    margin: 5px 0;
  }
  .button {
    display: inline-block;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: #ffffff;
    padding: 14px 32px;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 15px;
    margin: 20px 0;
    transition: all 0.3s ease;
  }
  .button:hover {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    transform: translateY(-1px);
  }
  .divider {
    height: 1px;
    background: #27272a;
    margin: 30px 0;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
  }
  th {
    background: #18181b;
    color: #a1a1aa;
    padding: 12px;
    text-align: left;
    font-size: 13px;
    font-weight: 600;
    border-bottom: 1px solid #27272a;
  }
  td {
    padding: 12px;
    border-bottom: 1px solid #27272a;
    color: #d4d4d8;
    font-size: 14px;
  }
  .status-pending {
    color: #fbbf24;
    font-weight: 600;
  }
  .status-approved {
    color: #34d399;
    font-weight: 600;
  }
  .status-rejected {
    color: #f87171;
    font-weight: 600;
  }
  a {
    color: #ef4444;
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
`;
