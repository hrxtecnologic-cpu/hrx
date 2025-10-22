import * as React from 'react';

interface QuoteRequestEmailProps {
  supplierName: string;
  quoteRequestId: string;
  clientName: string;
  eventDate?: string;
  eventType?: string;
  eventLocation?: string;
  items: {
    name: string;
    quantity: number;
    duration_days: number;
    description?: string;
  }[];
  deadline: string; // Data limite para resposta
  responseUrl: string; // URL para responder o orçamento
}

export const QuoteRequestEmail: React.FC<QuoteRequestEmailProps> = ({
  supplierName,
  quoteRequestId,
  clientName,
  eventDate,
  eventType,
  eventLocation,
  items,
  deadline,
  responseUrl,
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
          background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%);
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
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          background: white;
          border-radius: 6px;
          overflow: hidden;
        }
        .items-table th {
          background: #f3f4f6;
          color: #374151;
          text-align: left;
          padding: 12px;
          font-size: 12px;
          text-transform: uppercase;
          font-weight: 600;
        }
        .items-table td {
          padding: 12px;
          border-top: 1px solid #e5e7eb;
          color: #1a1a1a;
        }
        .deadline-alert {
          background: #fef3c7;
          border: 1px solid #fde047;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
          text-align: center;
        }
        .deadline-alert strong {
          color: #854d0e;
          font-size: 18px;
        }
        .deadline-alert p {
          color: #92400e;
          margin: 5px 0 0 0;
        }
        .button {
          display: inline-block;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          background: #DC2626;
          color: #ffffff;
          text-align: center;
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
        {/* Header */}
        <div className="header">
          <h1>📋 Solicitação de Orçamento</h1>
          <span className="badge">ID: {quoteRequestId}</span>
        </div>

        {/* Saudação */}
        <p>Olá, <strong>{supplierName}</strong>!</p>
        <p>
          A HRX está solicitando um orçamento para um evento de <strong>{clientName}</strong>.
          Por favor, revise os detalhes abaixo e envie sua proposta.
        </p>

        {/* Deadline Alert */}
        <div className="deadline-alert">
          <strong>⏰ Prazo para Resposta</strong>
          <p>Por favor, envie seu orçamento até: <strong>{deadline}</strong></p>
        </div>

        {/* Detalhes do Evento */}
        <div className="section">
          <h2>🎪 Detalhes do Evento</h2>
          <div className="info-grid">
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
            <div className="info-item">
              <div className="info-label">Cliente</div>
              <div className="info-value">{clientName}</div>
            </div>
          </div>
        </div>

        {/* Itens Solicitados */}
        <div className="section">
          <h2>📦 Itens Solicitados</h2>
          <table className="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantidade</th>
                <th>Período</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td><strong>{item.name}</strong></td>
                  <td>{item.quantity}</td>
                  <td>{item.duration_days} {item.duration_days === 1 ? 'dia' : 'dias'}</td>
                  <td>{item.description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Button */}
        <div className="action-buttons">
          <a href={responseUrl} className="button">
            Enviar Orçamento
          </a>
        </div>

        <p style={{ marginTop: '30px', color: '#6b7280', fontSize: '14px', textAlign: 'center' }}>
          💡 <strong>Dica:</strong> Orçamentos competitivos e prazos de resposta rápidos aumentam suas chances de ser selecionado!
        </p>

        {/* Footer */}
        <div className="footer">
          <p>📧 HRX Tecnologia em Eventos</p>
          <p style={{ marginTop: '10px', fontSize: '12px' }}>
            Se você tiver alguma dúvida, entre em contato conosco.
          </p>
        </div>
      </div>
    </body>
  </html>
);
