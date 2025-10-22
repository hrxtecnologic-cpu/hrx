import * as React from 'react';

interface UrgentQuoteAdminEmailProps {
  quoteRequestId: string;
  clientName: string;
  eventDate?: string;
  eventType?: string;
  eventLocation?: string;
  totalItems: number;
  description?: string;
  profitMargin: number; // 35 ou 80
}

export const UrgentQuoteAdminEmail: React.FC<UrgentQuoteAdminEmailProps> = ({
  quoteRequestId,
  clientName,
  eventDate,
  eventType,
  eventLocation,
  totalItems,
  description,
  profitMargin,
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
        .header-urgent {
          background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
          color: white;
          padding: 30px;
          border-radius: 8px 8px 0 0;
          margin: -40px -40px 30px -40px;
          text-align: center;
          border: 3px solid #991b1b;
        }
        .header-urgent h1 {
          margin: 0;
          font-size: 28px;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .badge-urgent {
          display: inline-block;
          background: #991b1b;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 700;
          margin-top: 10px;
        }
        .urgent-banner {
          background: #fee2e2;
          border: 2px solid #DC2626;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: center;
        }
        .urgent-banner-title {
          color: #991b1b;
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 10px 0;
        }
        .urgent-banner-text {
          color: #DC2626;
          font-size: 16px;
          margin: 0;
        }
        .margin-highlight {
          background: #dcfce7;
          border: 2px solid #16a34a;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: center;
        }
        .margin-highlight-title {
          color: #166534;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 5px 0;
        }
        .margin-highlight-value {
          color: #16a34a;
          font-size: 32px;
          font-weight: 700;
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
        .button {
          display: inline-block;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 700;
          background: #DC2626;
          color: #ffffff;
          text-align: center;
          font-size: 16px;
        }
        .action-buttons {
          text-align: center;
          margin: 30px 0;
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
        {/* Urgent Header */}
        <div className="header-urgent">
          <h1>🚨 ORÇAMENTO URGENTE 🚨</h1>
          <span className="badge-urgent">ID: {quoteRequestId}</span>
        </div>

        {/* Urgent Banner */}
        <div className="urgent-banner">
          <p className="urgent-banner-title">⚡ ATENÇÃO NECESSÁRIA IMEDIATA</p>
          <p className="urgent-banner-text">
            Um novo orçamento urgente foi criado e precisa ser processado rapidamente!
          </p>
        </div>

        {/* Margem de Lucro Highlight */}
        <div className="margin-highlight">
          <p className="margin-highlight-title">💰 Margem de Lucro Aplicada</p>
          <p className="margin-highlight-value">{profitMargin}%</p>
          <p style={{ color: '#166534', fontSize: '14px', margin: '5px 0 0 0' }}>
            {profitMargin === 80 ? '(Orçamento Urgente)' : '(Orçamento Normal)'}
          </p>
        </div>

        {/* Detalhes do Cliente/Evento */}
        <div className="section">
          <h2>👤 Detalhes da Solicitação</h2>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Cliente</div>
              <div className="info-value">{clientName}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Total de Itens</div>
              <div className="info-value">{totalItems} {totalItems === 1 ? 'item' : 'itens'}</div>
            </div>
            {eventDate && (
              <div className="info-item">
                <div className="info-label">Data do Evento</div>
                <div className="info-value">{eventDate}</div>
              </div>
            )}
            {eventType && (
              <div className="info-item">
                <div className="info-label">Tipo de Evento</div>
                <div className="info-value">{eventType}</div>
              </div>
            )}
            {eventLocation && (
              <div className="info-item">
                <div className="info-label">Local</div>
                <div className="info-value">{eventLocation}</div>
              </div>
            )}
          </div>

          {description && (
            <div style={{ marginTop: '15px', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div className="info-label">Descrição</div>
              <p style={{ color: '#1a1a1a', margin: '5px 0 0 0' }}>{description}</p>
            </div>
          )}
        </div>

        {/* Próximos Passos */}
        <div className="section">
          <h2>📋 Próximos Passos</h2>
          <ol style={{ paddingLeft: '20px', color: '#1a1a1a' }}>
            <li style={{ marginBottom: '10px' }}>Revisar todos os itens solicitados</li>
            <li style={{ marginBottom: '10px' }}>Selecionar fornecedores apropriados</li>
            <li style={{ marginBottom: '10px' }}>Disparar solicitações de orçamento</li>
            <li style={{ marginBottom: '10px' }}>Aguardar respostas e comparar preços</li>
            <li style={{ marginBottom: '10px' }}>Calcular margem de <strong>{profitMargin}%</strong> sobre os custos</li>
            <li>Enviar proposta final ao cliente</li>
          </ol>
        </div>

        {/* Action Button */}
        <div className="action-buttons">
          <a href={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/orcamentos/${quoteRequestId}`} className="button">
            🔥 Processar Orçamento Agora
          </a>
        </div>

        {/* Footer */}
        <div className="footer">
          <p>📧 Sistema de Notificações HRX</p>
          <p style={{ marginTop: '10px', fontSize: '12px' }}>
            Este email é automático e destinado apenas para administradores.
          </p>
        </div>
      </div>
    </body>
  </html>
);
