import * as React from 'react';
import { EmailFooterDark, HRX_CONTACT_INFO, EMAIL_DARK_STYLES } from './EmailFooterDark';

interface QuoteRejectedEmailProps {
  supplierName: string;
  quoteRequestId: string;
  clientName: string;
  reason?: string;
}

export const QuoteRejectedEmail: React.FC<QuoteRejectedEmailProps> = ({
  supplierName,
  quoteRequestId,
  clientName,
  reason,
}) => (
  <html>
    <head>
      <style>{EMAIL_DARK_STYLES}</style>
    </head>
    <body>
      <div className="container">
        {/* Header */}
        <div className="header" style={{ background: 'linear-gradient(135deg, #52525b 0%, #71717a 100%)' }}>
          <div className="logo">HRX EVENTOS</div>
          <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>📋 Atualização de Orçamento</span>
        </div>

        {/* Greeting */}
        <h1>Olá, {supplierName},</h1>

        {/* Info Banner */}
        <div style={{
          background: '#18181b',
          border: '2px solid #52525b',
          padding: '20px',
          borderRadius: '8px',
          margin: '20px 0'
        }}>
          <p style={{ color: '#d4d4d8', fontSize: '18px', fontWeight: 700, margin: '0 0 10px 0' }}>
            Agradecemos sua Proposta
          </p>
          <p style={{ color: '#a1a1aa', fontSize: '15px', margin: 0, lineHeight: '1.6' }}>
            Informamos que, após análise criteriosa, optamos por não prosseguir com seu orçamento
            para o evento de <strong>{clientName}</strong> neste momento.
          </p>
        </div>

        {/* Reason (if provided) */}
        {reason && (
          <div className="info-box">
            <h2>💬 Feedback</h2>
            <div style={{
              background: '#422006',
              border: '1px solid #ea580c',
              padding: '15px',
              borderRadius: '6px',
              marginTop: '15px'
            }}>
              <div style={{ color: '#fdba74', fontSize: '12px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>
                Motivo da não seleção
              </div>
              <p style={{ color: '#fb923c', fontSize: '15px', margin: 0 }}>{reason}</p>
            </div>
          </div>
        )}

        {/* General Information */}
        <div className="info-box">
          <h2>ℹ️ Informações Importantes</h2>
          <p style={{ margin: 0 }}>
            Esta decisão pode ter sido baseada em diversos fatores, incluindo:
          </p>
          <ul style={{ color: '#a1a1aa', paddingLeft: '20px', marginTop: '10px' }}>
            <li>Custo-benefício da proposta</li>
            <li>Disponibilidade de equipamentos/serviços</li>
            <li>Prazos de entrega</li>
            <li>Especificações técnicas</li>
            <li>Outras exigências específicas do projeto</li>
          </ul>
        </div>

        {/* Encouragement */}
        <div style={{
          background: '#172554',
          border: '1px solid #3b82f6',
          padding: '15px',
          borderRadius: '6px',
          margin: '20px 0',
          textAlign: 'center'
        }}>
          <p style={{ color: '#93c5fd', fontSize: '15px', margin: 0, fontWeight: 500 }}>
            💙 Valorizamos muito sua parceria! Continuaremos considerando seus serviços para futuros projetos.
          </p>
        </div>

        {/* Future Opportunities */}
        <div className="highlight-box">
          <h3>🚀 Próximas Oportunidades</h3>
          <p>
            Mantenha seu cadastro atualizado na HRX e fique atento para novas solicitações de orçamento.
            Novos projetos surgem frequentemente e sua empresa continuará sendo considerada!
          </p>
          <p style={{ marginTop: '15px', fontSize: '14px' }}>
            <strong>Dicas para aumentar suas chances:</strong>
          </p>
          <ul style={{ fontSize: '14px', paddingLeft: '20px' }}>
            <li>Mantenha preços competitivos</li>
            <li>Responda rapidamente às solicitações</li>
            <li>Ofereça flexibilidade em prazos e pagamentos</li>
            <li>Mantenha portfólio atualizado</li>
          </ul>
        </div>

        <p style={{ textAlign: 'center', color: '#a1a1aa', fontSize: '15px', marginTop: '30px' }}>
          Agradecemos seu interesse e esperamos trabalhar juntos em breve! 🤝
        </p>

        <div className="divider"></div>

        {/* Footer */}
        <EmailFooterDark showContact={true} />
      </div>
    </body>
  </html>
);
