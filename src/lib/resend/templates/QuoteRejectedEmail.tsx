import * as React from 'react';
import { HRX_CONTACT_INFO } from './EmailFooter';

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
          background: linear-gradient(135deg, #64748b 0%, #94a3b8 100%);
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
        .info-banner {
          background: #f1f5f9;
          border: 2px solid #cbd5e1;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .info-banner-title {
          color: #475569;
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 10px 0;
        }
        .info-banner-text {
          color: #64748b;
          font-size: 15px;
          margin: 0;
          line-height: 1.6;
        }
        .section {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #64748b;
        }
        .section h2 {
          color: #1a1a1a;
          font-size: 18px;
          margin-top: 0;
          margin-bottom: 15px;
        }
        .reason-box {
          background: #fef3c7;
          border: 1px solid #fde047;
          padding: 15px;
          border-radius: 6px;
          margin: 15px 0;
        }
        .reason-label {
          color: #92400e;
          font-size: 12px;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .reason-text {
          color: #854d0e;
          font-size: 15px;
          margin: 0;
        }
        .encouragement {
          background: #dbeafe;
          border: 1px solid #93c5fd;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
          text-align: center;
        }
        .encouragement-text {
          color: #1e40af;
          font-size: 15px;
          margin: 0;
          font-weight: 500;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
      `}</style>
    </head>
    <body>
      <div className="container">
        {/* Header */}
        <div className="header">
          <h1>📋 Atualização de Orçamento</h1>
          <span className="badge">ID: {quoteRequestId}</span>
        </div>

        {/* Saudação */}
        <p>Olá, <strong>{supplierName}</strong>,</p>

        {/* Info Banner */}
        <div className="info-banner">
          <p className="info-banner-title">Agradecemos sua Proposta</p>
          <p className="info-banner-text">
            Informamos que, após análise criteriosa, optamos por não prosseguir com seu orçamento
            para o evento de <strong>{clientName}</strong> neste momento.
          </p>
        </div>

        {/* Motivo (se fornecido) */}
        {reason && (
          <div className="section">
            <h2>💬 Feedback</h2>
            <div className="reason-box">
              <div className="reason-label">Motivo da não seleção</div>
              <p className="reason-text">{reason}</p>
            </div>
          </div>
        )}

        {/* Informação Geral */}
        <div className="section">
          <h2>ℹ️ Informações Importantes</h2>
          <p style={{ color: '#1a1a1a', margin: 0 }}>
            Esta decisão pode ter sido baseada em diversos fatores, incluindo:
          </p>
          <ul style={{ color: '#475569', paddingLeft: '20px', marginTop: '10px' }}>
            <li>Custo-benefício da proposta</li>
            <li>Disponibilidade de equipamentos/serviços</li>
            <li>Prazos de entrega</li>
            <li>Especificações técnicas</li>
            <li>Outras exigências específicas do projeto</li>
          </ul>
        </div>

        {/* Encorajamento */}
        <div className="encouragement">
          <p className="encouragement-text">
            💙 Valorizamos muito sua parceria! Continuaremos considerando seus serviços para futuros projetos.
          </p>
        </div>

        {/* Próximas Oportunidades */}
        <div className="section">
          <h2>🚀 Próximas Oportunidades</h2>
          <p style={{ color: '#1a1a1a' }}>
            Mantenha seu cadastro atualizado na HRX e fique atento para novas solicitações de orçamento.
            Novos projetos surgem frequentemente e sua empresa continuará sendo considerada!
          </p>
          <p style={{ color: '#64748b', marginTop: '15px', fontSize: '14px' }}>
            <strong>Dicas para aumentar suas chances:</strong>
          </p>
          <ul style={{ color: '#64748b', fontSize: '14px', paddingLeft: '20px' }}>
            <li>Mantenha preços competitivos</li>
            <li>Responda rapidamente às solicitações</li>
            <li>Ofereça flexibilidade em prazos e pagamentos</li>
            <li>Mantenha portfólio atualizado</li>
          </ul>
        </div>

        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '15px', marginTop: '30px' }}>
          Agradecemos seu interesse e esperamos trabalhar juntos em breve! 🤝
        </p>

        {/* Footer */}
        <div className="footer">
          <p>📧 {HRX_CONTACT_INFO.nomeEmpresa}</p>
          <p style={{ marginTop: '5px', fontSize: '12px' }}>
            {HRX_CONTACT_INFO.email} | {HRX_CONTACT_INFO.telefone}
          </p>
          <p style={{ marginTop: '5px', fontSize: '12px' }}>
            {HRX_CONTACT_INFO.site}
          </p>
        </div>
      </div>
    </body>
  </html>
);
