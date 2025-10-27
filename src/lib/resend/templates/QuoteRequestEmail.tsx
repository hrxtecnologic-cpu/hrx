import * as React from 'react';
import { EmailFooterDark, HRX_CONTACT_INFO, EMAIL_DARK_STYLES } from './EmailFooterDark';

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
      <style>{EMAIL_DARK_STYLES}</style>
    </head>
    <body>
      <div className="container">
        {/* Header */}
        <div className="header">
          <div className="logo">HRX EVENTOS</div>
          <span className="badge">📋 Solicitação de Orçamento</span>
        </div>

        {/* Greeting */}
        <h1>Olá, {supplierName}!</h1>

        {/* Content */}
        <div className="content">
          <p>
            A HRX está solicitando um orçamento para um evento de <strong>{clientName}</strong>.
            Por favor, revise os detalhes abaixo e envie sua proposta.
          </p>
        </div>

        {/* Deadline Alert */}
        <div style={{
          background: '#422006',
          border: '2px solid #ea580c',
          padding: '15px',
          borderRadius: '6px',
          margin: '20px 0',
          textAlign: 'center'
        }}>
          <strong style={{ color: '#fdba74', fontSize: '18px' }}>⏰ Prazo para Resposta</strong>
          <p style={{ color: '#fb923c', margin: '5px 0 0 0' }}>
            Por favor, envie seu orçamento até: <strong>{deadline}</strong>
          </p>
        </div>

        {/* Event Details */}
        <div className="info-box">
          <h2>🎪 Detalhes do Evento</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginTop: '15px' }}>
            {eventDate && (
              <div style={{ background: '#09090b', padding: '12px', borderRadius: '6px', border: '1px solid #27272a' }}>
                <div style={{ fontSize: '12px', color: '#71717a', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                  Data do Evento
                </div>
                <div style={{ color: '#fafafa', fontSize: '16px', fontWeight: 500 }}>{eventDate}</div>
              </div>
            )}
            {eventType && (
              <div style={{ background: '#09090b', padding: '12px', borderRadius: '6px', border: '1px solid #27272a' }}>
                <div style={{ fontSize: '12px', color: '#71717a', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                  Tipo de Evento
                </div>
                <div style={{ color: '#fafafa', fontSize: '16px', fontWeight: 500 }}>{eventType}</div>
              </div>
            )}
            {eventLocation && (
              <div style={{ background: '#09090b', padding: '12px', borderRadius: '6px', border: '1px solid #27272a' }}>
                <div style={{ fontSize: '12px', color: '#71717a', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                  Local
                </div>
                <div style={{ color: '#fafafa', fontSize: '16px', fontWeight: 500 }}>{eventLocation}</div>
              </div>
            )}
            <div style={{ background: '#09090b', padding: '12px', borderRadius: '6px', border: '1px solid #27272a' }}>
              <div style={{ fontSize: '12px', color: '#71717a', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                Cliente
              </div>
              <div style={{ color: '#fafafa', fontSize: '16px', fontWeight: 500 }}>{clientName}</div>
            </div>
          </div>
        </div>

        {/* Items Requested */}
        <div className="info-box">
          <h2>📦 Itens Solicitados</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
            <thead>
              <tr style={{ background: '#09090b' }}>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '12px', color: '#a1a1aa', textTransform: 'uppercase', fontWeight: 600 }}>
                  Item
                </th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '12px', color: '#a1a1aa', textTransform: 'uppercase', fontWeight: 600 }}>
                  Quantidade
                </th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '12px', color: '#a1a1aa', textTransform: 'uppercase', fontWeight: 600 }}>
                  Período
                </th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '12px', color: '#a1a1aa', textTransform: 'uppercase', fontWeight: 600 }}>
                  Detalhes
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td style={{ padding: '12px', borderTop: '1px solid #27272a', color: '#fafafa' }}>
                    <strong>{item.name}</strong>
                  </td>
                  <td style={{ padding: '12px', borderTop: '1px solid #27272a', color: '#fafafa' }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: '12px', borderTop: '1px solid #27272a', color: '#fafafa' }}>
                    {item.duration_days} {item.duration_days === 1 ? 'dia' : 'dias'}
                  </td>
                  <td style={{ padding: '12px', borderTop: '1px solid #27272a', color: '#a1a1aa' }}>
                    {item.description || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Button */}
        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <a href={responseUrl} className="button">
            Enviar Orçamento
          </a>
        </div>

        <div className="highlight-box">
          <p style={{ margin: 0, textAlign: 'center' }}>
            💡 <strong>Dica:</strong> Orçamentos competitivos e prazos de resposta rápidos aumentam suas chances de ser selecionado!
          </p>
        </div>

        <div className="divider"></div>

        {/* Footer */}
        <EmailFooterDark showContact={true} />
      </div>
    </body>
  </html>
);
