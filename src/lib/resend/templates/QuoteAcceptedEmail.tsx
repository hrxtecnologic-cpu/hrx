import * as React from 'react';
import { EmailFooterDark, HRX_CONTACT_INFO, EMAIL_DARK_STYLES } from './EmailFooterDark';

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
      <style>{EMAIL_DARK_STYLES}</style>
    </head>
    <body>
      <div className="container">
        {/* Header */}
        <div className="header" style={{ background: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)' }}>
          <div className="logo">HRX EVENTOS</div>
          <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>✅ Orçamento Aceito!</span>
        </div>

        {/* Success Banner */}
        <div style={{
          background: '#052e16',
          border: '2px solid #16a34a',
          padding: '20px',
          borderRadius: '8px',
          margin: '20px 0',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎉</div>
          <p style={{ color: '#4ade80', fontSize: '20px', fontWeight: 700, margin: '0 0 5px 0' }}>
            Parabéns, {supplierName}!
          </p>
          <p style={{ color: '#86efac', fontSize: '16px', margin: 0 }}>
            Seu orçamento foi aceito pela HRX e você foi selecionado para fornecer os serviços/equipamentos.
          </p>
        </div>

        {/* Price Highlight */}
        <div style={{
          background: '#422006',
          border: '2px solid #ea580c',
          padding: '15px',
          borderRadius: '8px',
          margin: '20px 0',
          textAlign: 'center'
        }}>
          <p style={{ color: '#fdba74', fontSize: '14px', fontWeight: 600, margin: 0 }}>
            💰 Valor Acordado
          </p>
          <p style={{ color: '#fb923c', fontSize: '28px', fontWeight: 700, margin: '5px 0 0 0' }}>
            {acceptedPrice}
          </p>
        </div>

        {/* Event Details */}
        <div className="info-box">
          <h2>🎪 Detalhes do Evento</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginTop: '15px' }}>
            <div style={{ background: '#09090b', padding: '12px', borderRadius: '6px', border: '1px solid #27272a' }}>
              <div style={{ fontSize: '12px', color: '#71717a', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                Cliente
              </div>
              <div style={{ color: '#fafafa', fontSize: '16px', fontWeight: 500 }}>{clientName}</div>
            </div>
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
          </div>
        </div>

        {/* Items Accepted */}
        <div className="info-box">
          <h2>📦 Itens/Serviços Contratados</h2>
          <div style={{ background: '#09090b', padding: '15px', borderRadius: '6px', border: '1px solid #27272a' }}>
            <strong style={{ color: '#fafafa' }}>✓ Você fornecerá:</strong>
            <ul style={{ margin: '10px 0', paddingLeft: '20px', color: '#d4d4d8' }}>
              {items.map((item, index) => (
                <li key={index} style={{ margin: '5px 0' }}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Next Steps */}
        <div className="highlight-box">
          <h3>📋 Próximos Passos</h3>
          <ol style={{ paddingLeft: '20px', color: '#fafafa', margin: 0 }}>
            <li style={{ marginBottom: '8px' }}>Nossa equipe entrará em contato para confirmar detalhes</li>
            <li style={{ marginBottom: '8px' }}>Confirme a disponibilidade dos equipamentos/serviços</li>
            <li style={{ marginBottom: '8px' }}>Prepare toda a documentação necessária</li>
            <li style={{ marginBottom: '8px' }}>Aguarde instruções de logística e entrega</li>
          </ol>
        </div>

        {/* Contact HRX */}
        <div className="info-box">
          <h2>📞 Contato HRX</h2>
          <p>
            Para qualquer dúvida ou informação adicional, entre em contato com:
          </p>
          <div style={{ marginTop: '15px' }}>
            <div style={{ background: '#09090b', padding: '12px', borderRadius: '6px', border: '1px solid #27272a', marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', color: '#71717a', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                Responsável
              </div>
              <div style={{ color: '#fafafa', fontSize: '16px', fontWeight: 500 }}>{contactPerson}</div>
            </div>
            <div style={{ background: '#09090b', padding: '12px', borderRadius: '6px', border: '1px solid #27272a', marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', color: '#71717a', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                Telefone
              </div>
              <div style={{ color: '#fafafa', fontSize: '16px', fontWeight: 500 }}>{contactPhone}</div>
            </div>
            <div style={{ background: '#09090b', padding: '12px', borderRadius: '6px', border: '1px solid #27272a' }}>
              <div style={{ fontSize: '12px', color: '#71717a', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                Email
              </div>
              <div style={{ color: '#fafafa', fontSize: '16px', fontWeight: 500 }}>{contactEmail}</div>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#4ade80', fontWeight: 600, fontSize: '16px', marginTop: '30px' }}>
          ✨ Obrigado pela parceria e excelente trabalho!
        </p>

        <div className="divider"></div>

        {/* Footer */}
        <EmailFooterDark showContact={true} />
      </div>
    </body>
  </html>
);
