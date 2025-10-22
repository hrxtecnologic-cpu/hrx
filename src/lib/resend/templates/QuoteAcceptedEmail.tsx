import * as React from 'react';

interface QuoteAcceptedEmailProps {
  supplierName: string;
  quoteRequestId: string;
  clientName: string;
  eventDate?: string;
  eventType?: string;
  acceptedPrice: string;
  items: string[];
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
}

export const QuoteAcceptedEmail: React.FC<QuoteAcceptedEmailProps> = ({
  supplierName,
  quoteRequestId,
  clientName,
  eventDate,
  eventType,
  acceptedPrice,
  items,
  contactPerson,
  contactPhone,
  contactEmail,
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
          background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
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
        .success-banner {
          background: #dcfce7;
          border: 2px solid #16a34a;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: center;
        }
        .success-icon {
          font-size: 48px;
          margin-bottom: 10px;
        }
        .success-title {
          color: #166534;
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 5px 0;
        }
        .success-text {
          color: #16a34a;
          font-size: 16px;
          margin: 0;
        }
        .price-highlight {
          background: #fef3c7;
          border: 2px solid #fbbf24;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: center;
        }
        .price-label {
          color: #92400e;
          font-size: 14px;
          font-weight: 600;
          margin: 0;
        }
        .price-value {
          color: #b45309;
          font-size: 28px;
          font-weight: 700;
          margin: 5px 0 0 0;
        }
        .section {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #16a34a;
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
        .items-list {
          background: white;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }
        .items-list ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        .items-list li {
          color: #1a1a1a;
          margin: 5px 0;
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
          <h1>✅ Orçamento Aceito!</h1>
          <span className="badge">ID: {quoteRequestId}</span>
        </div>

        {/* Success Banner */}
        <div className="success-banner">
          <div className="success-icon">🎉</div>
          <p className="success-title">Parabéns, {supplierName}!</p>
          <p className="success-text">
            Seu orçamento foi aceito pela HRX e você foi selecionado para fornecer os serviços/equipamentos.
          </p>
        </div>

        {/* Price Highlight */}
        <div className="price-highlight">
          <p className="price-label">💰 Valor Acordado</p>
          <p className="price-value">{acceptedPrice}</p>
        </div>

        {/* Detalhes do Evento */}
        <div className="section">
          <h2>🎪 Detalhes do Evento</h2>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Cliente</div>
              <div className="info-value">{clientName}</div>
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
          </div>
        </div>

        {/* Itens Aceitos */}
        <div className="section">
          <h2>📦 Itens/Serviços Contratados</h2>
          <div className="items-list">
            <strong>✓ Você fornecerá:</strong>
            <ul>
              {items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Próximos Passos */}
        <div className="section">
          <h2>📋 Próximos Passos</h2>
          <ol style={{ paddingLeft: '20px', color: '#1a1a1a' }}>
            <li style={{ marginBottom: '8px' }}>Nossa equipe entrará em contato para confirmar detalhes</li>
            <li style={{ marginBottom: '8px' }}>Confirme a disponibilidade dos equipamentos/serviços</li>
            <li style={{ marginBottom: '8px' }}>Prepare toda a documentação necessária</li>
            <li style={{ marginBottom: '8px' }}>Aguarde instruções de logística e entrega</li>
          </ol>
        </div>

        {/* Contato HRX */}
        <div className="section">
          <h2>📞 Contato HRX</h2>
          <p style={{ color: '#1a1a1a' }}>
            Para qualquer dúvida ou informação adicional, entre em contato com:
          </p>
          <div style={{ marginTop: '15px' }}>
            <div className="info-item">
              <div className="info-label">Responsável</div>
              <div className="info-value">{contactPerson}</div>
            </div>
            <div className="info-item" style={{ marginTop: '10px' }}>
              <div className="info-label">Telefone</div>
              <div className="info-value">{contactPhone}</div>
            </div>
            <div className="info-item" style={{ marginTop: '10px' }}>
              <div className="info-label">Email</div>
              <div className="info-value">{contactEmail}</div>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#16a34a', fontWeight: '600', fontSize: '16px', marginTop: '30px' }}>
          ✨ Obrigado pela parceria e excelente trabalho!
        </p>

        {/* Footer */}
        <div className="footer">
          <p>📧 HRX Tecnologia em Eventos</p>
          <p style={{ marginTop: '10px', fontSize: '12px' }}>
            Estamos ansiosos para trabalhar com você neste projeto.
          </p>
        </div>
      </div>
    </body>
  </html>
);
