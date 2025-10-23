import * as React from 'react';
import { HRX_CONTACT_INFO } from './EmailFooter';

interface TeamMember {
  category: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  shift?: string;
}

interface Equipment {
  name: string;
  category: string;
  quantity: number;
  duration_days: number;
  unit_price: number;
  total_price: number;
}

interface FinalProposalEmailProps {
  // Cliente
  clientName: string;
  clientEmail: string;

  // Projeto
  proposalNumber: string;
  projectId: string;

  // Evento
  eventName: string;
  eventDate: string;
  eventType?: string;
  venueName?: string;
  venueAddress: string;
  venueCity: string;
  venueState: string;
  expectedAttendance?: number;

  // Equipe
  teamMembers: TeamMember[];
  teamSubtotal: number;

  // Equipamentos
  equipment: Equipment[];
  equipmentSubtotal: number;

  // Valores
  subtotal: number;
  total: number;

  // URLs
  acceptUrl: string;
  rejectUrl: string;
}

export const FinalProposalEmail: React.FC<FinalProposalEmailProps> = ({
  clientName,
  clientEmail,
  proposalNumber,
  projectId,
  eventName,
  eventDate,
  eventType,
  venueName,
  venueAddress,
  venueCity,
  venueState,
  expectedAttendance,
  teamMembers,
  teamSubtotal,
  equipment,
  equipmentSubtotal,
  subtotal,
  total,
  acceptUrl,
  rejectUrl,
}) => {
  const firstName = clientName.split(' ')[0];

  // Calcular IOF (16%)
  const iofPercentage = 16;
  const iofAmount = total * (iofPercentage / 100);
  const totalWithIOF = total + iofAmount;

  return (
    <html>
      <head>
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #e5e7eb;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #18181b;
          }
          .container {
            background: #27272a;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            border: 1px solid #3f3f46;
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
            font-size: 28px;
            font-weight: bold;
          }
          .badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-top: 10px;
          }
          .success-banner {
            background: #14532d;
            border: 2px solid #16a34a;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }
          .success-banner h2 {
            color: #4ade80;
            font-size: 20px;
            margin: 0 0 10px 0;
          }
          .success-banner p {
            color: #86efac;
            margin: 0;
          }
          .section {
            background: #18181b;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #DC2626;
            border: 1px solid #3f3f46;
          }
          .section h2 {
            color: #f5f5f5;
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
            background: #27272a;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #52525b;
          }
          .info-label {
            font-size: 12px;
            color: #a1a1aa;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 4px;
          }
          .info-value {
            color: #f5f5f5;
            font-size: 16px;
            font-weight: 500;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            background: #27272a;
            border-radius: 6px;
            overflow: hidden;
            border: 1px solid #3f3f46;
          }
          .table th {
            background: #18181b;
            color: #d4d4d8;
            text-align: left;
            padding: 12px;
            font-size: 12px;
            text-transform: uppercase;
            font-weight: 600;
          }
          .table td {
            padding: 12px;
            border-top: 1px solid #3f3f46;
            color: #e5e7eb;
          }
          .table .text-right {
            text-align: right;
          }
          .table .font-bold {
            font-weight: 600;
          }
          .subtotal-row {
            background: #18181b;
          }
          .total-row {
            background: #7f1d1d;
            font-weight: 700;
            font-size: 16px;
            color: #fca5a5;
          }
          .payment-box {
            background: #1e3a8a;
            border: 2px solid #3b82f6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .payment-box h3 {
            color: #93c5fd;
            font-size: 18px;
            margin: 0 0 15px 0;
          }
          .payment-box ul {
            margin: 10px 0;
            padding-left: 20px;
            color: #dbeafe;
          }
          .payment-box li {
            margin: 8px 0;
          }
          .tax-notice {
            background: #78350f;
            border: 2px solid #fbbf24;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            text-align: center;
          }
          .tax-notice strong {
            color: #fde047;
            font-size: 16px;
          }
          .tax-notice p {
            color: #fef3c7;
            margin: 5px 0 0 0;
            font-size: 14px;
          }
          .action-buttons {
            text-align: center;
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 700;
            font-size: 16px;
            margin: 0 10px;
          }
          .button-accept {
            background: #16a34a;
            color: #ffffff;
          }
          .button-reject {
            background: #ffffff;
            border: 2px solid #dc2626;
            color: #dc2626;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #3f3f46;
            color: #a1a1aa;
            font-size: 14px;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          {/* Header */}
          <div className="header">
            <h1>📋 Proposta Comercial</h1>
            <span className="badge">Nº {proposalNumber}</span>
          </div>

          {/* Banner */}
          <div className="success-banner">
            <h2>✨ Sua proposta está pronta!</h2>
            <p>Analisamos sua solicitação e preparamos uma proposta personalizada para seu evento.</p>
          </div>

          {/* Saudação */}
          <p style={{ fontSize: '16px', color: '#f5f5f5' }}>
            Olá, <strong>{firstName}</strong>!
          </p>
          <p style={{ fontSize: '15px', color: '#d4d4d8' }}>
            Ficamos muito felizes com seu interesse em nossos serviços. Preparamos uma proposta
            completa para o <strong>{eventName}</strong> com todos os profissionais e equipamentos
            solicitados.
          </p>

          {/* Dados do Evento */}
          <div className="section">
            <h2>🎯 Dados do Evento</h2>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">Nome do Evento</div>
                <div className="info-value">{eventName}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Data</div>
                <div className="info-value">{new Date(eventDate).toLocaleDateString('pt-BR')}</div>
              </div>
              {eventType && (
                <div className="info-item">
                  <div className="info-label">Tipo</div>
                  <div className="info-value">{eventType}</div>
                </div>
              )}
              <div className="info-item">
                <div className="info-label">Local</div>
                <div className="info-value">
                  {venueName && <><strong>{venueName}</strong><br /></>}
                  {venueAddress}, {venueCity} - {venueState}
                </div>
              </div>
              {expectedAttendance && (
                <div className="info-item">
                  <div className="info-label">Público Esperado</div>
                  <div className="info-value">{expectedAttendance.toLocaleString('pt-BR')} pessoas</div>
                </div>
              )}
            </div>
          </div>

          {/* Equipe Profissional */}
          {teamMembers.length > 0 && (
            <div className="section">
              <h2>👥 Equipe Profissional</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th className="text-right">Qtd</th>
                    <th>Turno</th>
                    <th className="text-right">Valor Unit.</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member, index) => (
                    <tr key={index}>
                      <td className="font-bold">{member.category}</td>
                      <td className="text-right">{member.quantity}</td>
                      <td>{member.shift || 'N/A'}</td>
                      <td className="text-right">R$ {member.unit_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="text-right">R$ {member.total_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  <tr className="subtotal-row">
                    <td colSpan={4} className="text-right font-bold">Subtotal Equipe:</td>
                    <td className="text-right font-bold">R$ {teamSubtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Equipamentos */}
          {equipment.length > 0 && (
            <div className="section">
              <h2>🛠️ Equipamentos e Materiais</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Categoria</th>
                    <th className="text-right">Qtd</th>
                    <th className="text-right">Período</th>
                    <th className="text-right">Valor Unit.</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {equipment.map((item, index) => (
                    <tr key={index}>
                      <td className="font-bold">{item.name}</td>
                      <td>{item.category}</td>
                      <td className="text-right">{item.quantity}</td>
                      <td className="text-right">{item.duration_days} {item.duration_days === 1 ? 'dia' : 'dias'}</td>
                      <td className="text-right">R$ {item.unit_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="text-right">R$ {item.total_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  <tr className="subtotal-row">
                    <td colSpan={5} className="text-right font-bold">Subtotal Equipamentos:</td>
                    <td className="text-right font-bold">R$ {equipmentSubtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Valor Total */}
          <table className="table" style={{ marginTop: '30px' }}>
            <tbody>
              <tr className="subtotal-row">
                <td colSpan={teamMembers.length > 0 ? 4 : 5} className="text-right font-bold">
                  Subtotal (sem impostos):
                </td>
                <td className="text-right font-bold">
                  R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
              </tr>
              <tr className="subtotal-row">
                <td colSpan={teamMembers.length > 0 ? 4 : 5} className="text-right font-bold">
                  IOF ({iofPercentage}%):
                </td>
                <td className="text-right font-bold">
                  R$ {iofAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
              </tr>
              <tr className="total-row">
                <td colSpan={teamMembers.length > 0 ? 4 : 5} className="text-right">
                  💰 VALOR TOTAL DA PROPOSTA (com impostos):
                </td>
                <td className="text-right">
                  R$ {totalWithIOF.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Forma de Pagamento */}
          <div className="payment-box">
            <h3>💳 Forma de Pagamento</h3>
            <ul>
              <li>
                <strong>1ª Parcela (50%):</strong> Na data de início da prestação de serviço
                <br />
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  Valor: R$ {(totalWithIOF * 0.5).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </li>
              <li>
                <strong>2ª Parcela (50%):</strong> No último dia de prestação de serviço
                <br />
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  Valor: R$ {(totalWithIOF * 0.5).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </li>
            </ul>
            <p style={{ margin: '15px 0 0 0', fontSize: '13px', color: '#1e3a8a', fontStyle: 'italic' }}>
              * Valores já incluem IOF de 16% cobrado pelo governo na emissão de nota fiscal
            </p>
          </div>

          {/* Prazo de Validade */}
          <div style={{ background: '#18181b', border: '1px solid #3f3f46', padding: '15px', borderRadius: '6px', margin: '20px 0', textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px' }}>
              ⏰ Esta proposta é válida por <strong style={{ color: '#f5f5f5' }}>7 dias</strong> a partir da data de envio.
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="action-buttons">
            <a href={acceptUrl} className="button button-accept">
              ✅ Aceitar Proposta
            </a>
            <a href={rejectUrl} className="button button-reject">
              ❌ Recusar Proposta
            </a>
          </div>

          <p style={{ textAlign: 'center', color: '#a1a1aa', fontSize: '14px', marginTop: '20px' }}>
            💡 <strong>Dúvidas?</strong> Nossa equipe está à disposição para esclarecer qualquer questão.
          </p>

          {/* Contato */}
          <div style={{ background: '#18181b', border: '1px solid #3f3f46', padding: '20px', borderRadius: '6px', margin: '30px 0' }}>
            <p style={{ textAlign: 'center', margin: '0 0 10px 0', fontWeight: '600', color: '#f5f5f5' }}>
              📞 Entre em contato conosco
            </p>
            <p style={{ textAlign: 'center', margin: '5px 0', fontSize: '14px', color: '#d4d4d8' }}>
              🌐 Site: <a href={HRX_CONTACT_INFO.siteUrl} style={{ color: '#ef4444', textDecoration: 'none' }}>{HRX_CONTACT_INFO.site}</a>
            </p>
            <p style={{ textAlign: 'center', margin: '5px 0', fontSize: '14px', color: '#d4d4d8' }}>
              📧 Email: <a href={`mailto:${HRX_CONTACT_INFO.email}`} style={{ color: '#ef4444', textDecoration: 'none' }}>{HRX_CONTACT_INFO.email}</a>
            </p>
            <p style={{ textAlign: 'center', margin: '5px 0', fontSize: '14px', color: '#d4d4d8' }}>
              📱 WhatsApp: <a href={`https://wa.me/${HRX_CONTACT_INFO.telefoneWhatsApp}`} style={{ color: '#ef4444', textDecoration: 'none' }}>{HRX_CONTACT_INFO.telefone}</a>
            </p>
          </div>

          {/* Footer */}
          <div className="footer">
            <p>Este email foi enviado para <strong>{clientEmail}</strong></p>
            <p style={{ marginTop: '10px' }}>
              © {HRX_CONTACT_INFO.ano} {HRX_CONTACT_INFO.nomeEmpresa} - Plataforma de Profissionais para Eventos
            </p>
            <p style={{ marginTop: '5px', fontSize: '12px', color: '#9ca3af' }}>
              {HRX_CONTACT_INFO.site}
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};
