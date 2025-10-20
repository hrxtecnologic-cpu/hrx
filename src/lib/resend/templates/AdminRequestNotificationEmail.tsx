import * as React from 'react';

interface Professional {
  category: string;
  quantity: number;
  shift: string;
  requirements?: string;
}

interface AdminRequestNotificationEmailProps {
  requestNumber: string;
  requestId: string;
  urgency: string;

  // Contractor data
  companyName: string;
  cnpj: string;
  responsibleName: string;
  responsibleRole?: string;
  email: string;
  phone: string;
  companyAddress?: string;
  website?: string;

  // Event data
  eventName: string;
  eventType: string;
  eventTypeOther?: string;
  eventDescription?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  expectedAttendance?: number;

  // Venue
  venueName?: string;
  venueAddress: string;
  venueCity: string;
  venueState: string;

  // Professionals
  professionalsNeeded: Professional[];

  // Equipment
  needsEquipment: boolean;
  equipmentList?: string[];
  equipmentOther?: string;
  equipmentNotes?: string;

  // Budget
  budgetRange?: string;
  additionalNotes?: string;

  createdAt: string;
}

export const AdminRequestNotificationEmail: React.FC<AdminRequestNotificationEmailProps> = (props) => {
  const urgencyLabel = {
    normal: 'NORMAL',
    urgent: '⚠️ URGENTE',
    very_urgent: '🚨 MUITO URGENTE',
  }[props.urgency] || 'NORMAL';

  const urgencyColor = {
    normal: '#10b981',
    urgent: '#f59e0b',
    very_urgent: '#ef4444',
  }[props.urgency] || '#10b981';

  const totalProfessionals = props.professionalsNeeded.reduce((sum, p) => sum + p.quantity, 0);

  const eventDuration = Math.ceil(
    (new Date(props.endDate).getTime() - new Date(props.startDate).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  return (
    <html>
      <head>
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.5;
            color: #1f2937;
            background-color: #f9fafb;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 700px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #DC2626 0%, #991b1b 100%);
            color: #ffffff;
            padding: 25px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
          }
          .urgency-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
            margin-top: 10px;
            background: ${urgencyColor};
            color: #ffffff;
          }
          .content {
            padding: 30px;
          }
          .request-header {
            background: #fef2f2;
            border-left: 4px solid #DC2626;
            padding: 20px;
            margin-bottom: 25px;
          }
          .request-header h2 {
            margin: 0 0 10px 0;
            color: #DC2626;
            font-size: 20px;
          }
          .request-meta {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
          }
          .meta-item {
            font-size: 14px;
          }
          .meta-label {
            color: #6b7280;
            font-weight: 600;
          }
          .section {
            margin: 25px 0;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            overflow: hidden;
          }
          .section-header {
            background: #f3f4f6;
            padding: 12px 20px;
            font-weight: 700;
            font-size: 16px;
            color: #1f2937;
            border-bottom: 2px solid #DC2626;
          }
          .section-content {
            padding: 20px;
          }
          .data-row {
            display: grid;
            grid-template-columns: 140px 1fr;
            padding: 10px 0;
            border-bottom: 1px solid #f3f4f6;
          }
          .data-row:last-child {
            border-bottom: none;
          }
          .data-label {
            font-weight: 600;
            color: #6b7280;
          }
          .data-value {
            color: #1f2937;
          }
          .professional-item {
            background: #f9fafb;
            border-left: 3px solid #DC2626;
            padding: 12px;
            margin: 10px 0;
            border-radius: 4px;
          }
          .action-box {
            background: #dbeafe;
            border: 2px solid #3b82f6;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          }
          .action-box h3 {
            color: #1e40af;
            margin: 0 0 15px 0;
            font-size: 18px;
          }
          .action-box ul {
            margin: 0;
            padding-left: 25px;
          }
          .action-box li {
            margin: 8px 0;
            color: #1e3a8a;
          }
          .contact-links {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .contact-links a {
            display: inline-block;
            margin: 5px 10px 5px 0;
            padding: 8px 16px;
            background: #DC2626;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 600;
            font-size: 14px;
          }
          .contact-links a:hover {
            background: #991b1b;
          }
          .footer {
            background: #1f2937;
            color: #d1d5db;
            padding: 20px;
            text-align: center;
            font-size: 13px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          {/* Header */}
          <div className="header">
            <h1>🔔 NOVA SOLICITAÇÃO DE EVENTO</h1>
            <div className="urgency-badge" style={{ background: urgencyColor }}>
              {urgencyLabel}
            </div>
          </div>

          {/* Content */}
          <div className="content">
            {/* Request Header */}
            <div className="request-header">
              <h2>Solicitação #{props.requestNumber}</h2>
              <div className="request-meta">
                <div className="meta-item">
                  <span className="meta-label">ID:</span> {props.requestId}
                </div>
                <div className="meta-item">
                  <span className="meta-label">Data/Hora:</span>{' '}
                  {new Date(props.createdAt).toLocaleString('pt-BR')}
                </div>
                <div className="meta-item">
                  <span className="meta-label">Total Profissionais:</span> {totalProfessionals}
                </div>
              </div>
            </div>

            {/* Company Data */}
            <div className="section">
              <div className="section-header">📊 Dados da Empresa</div>
              <div className="section-content">
                <div className="data-row">
                  <div className="data-label">Razão Social:</div>
                  <div className="data-value"><strong>{props.companyName}</strong></div>
                </div>
                <div className="data-row">
                  <div className="data-label">CNPJ:</div>
                  <div className="data-value">{props.cnpj}</div>
                </div>
                <div className="data-row">
                  <div className="data-label">Responsável:</div>
                  <div className="data-value">
                    {props.responsibleName}
                    {props.responsibleRole && ` - ${props.responsibleRole}`}
                  </div>
                </div>
                <div className="data-row">
                  <div className="data-label">Email:</div>
                  <div className="data-value">
                    <a href={`mailto:${props.email}`} style={{ color: '#DC2626' }}>
                      {props.email}
                    </a>
                  </div>
                </div>
                <div className="data-row">
                  <div className="data-label">Telefone:</div>
                  <div className="data-value">
                    <a href={`https://wa.me/55${props.phone.replace(/\D/g, '')}`} style={{ color: '#DC2626' }}>
                      {props.phone}
                    </a>
                  </div>
                </div>
                {props.website && (
                  <div className="data-row">
                    <div className="data-label">Website:</div>
                    <div className="data-value">
                      <a href={props.website} target="_blank" rel="noopener" style={{ color: '#DC2626' }}>
                        {props.website}
                      </a>
                    </div>
                  </div>
                )}
                {props.companyAddress && (
                  <div className="data-row">
                    <div className="data-label">Endereço:</div>
                    <div className="data-value">{props.companyAddress}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Event Data */}
            <div className="section">
              <div className="section-header">🎪 Dados do Evento</div>
              <div className="section-content">
                <div className="data-row">
                  <div className="data-label">Nome:</div>
                  <div className="data-value"><strong>{props.eventName}</strong></div>
                </div>
                <div className="data-row">
                  <div className="data-label">Tipo:</div>
                  <div className="data-value">
                    {props.eventType}
                    {props.eventTypeOther && ` - ${props.eventTypeOther}`}
                  </div>
                </div>
                <div className="data-row">
                  <div className="data-label">Período:</div>
                  <div className="data-value">
                    {new Date(props.startDate).toLocaleDateString('pt-BR')} até{' '}
                    {new Date(props.endDate).toLocaleDateString('pt-BR')}
                    <br />
                    <small style={{ color: '#6b7280' }}>Duração: {eventDuration} dia(s)</small>
                    {(props.startTime || props.endTime) && (
                      <>
                        <br />
                        <small style={{ color: '#6b7280' }}>
                          Horário: {props.startTime || '---'} às {props.endTime || '---'}
                        </small>
                      </>
                    )}
                  </div>
                </div>
                <div className="data-row">
                  <div className="data-label">Local:</div>
                  <div className="data-value">
                    {props.venueName && <><strong>{props.venueName}</strong><br /></>}
                    {props.venueAddress}<br />
                    {props.venueCity} - {props.venueState}
                  </div>
                </div>
                {props.expectedAttendance && (
                  <div className="data-row">
                    <div className="data-label">Público Esperado:</div>
                    <div className="data-value">
                      {props.expectedAttendance.toLocaleString('pt-BR')} pessoas
                    </div>
                  </div>
                )}
                {props.eventDescription && (
                  <div className="data-row">
                    <div className="data-label">Descrição:</div>
                    <div className="data-value">{props.eventDescription}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Professionals */}
            <div className="section">
              <div className="section-header">
                👷 Profissionais Solicitados ({totalProfessionals} total)
              </div>
              <div className="section-content">
                {props.professionalsNeeded.map((prof, index) => (
                  <div key={index} className="professional-item">
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#DC2626', marginBottom: '5px' }}>
                      {index + 1}. {prof.category}
                    </div>
                    <div style={{ fontSize: '14px', marginBottom: '3px' }}>
                      <strong>Quantidade:</strong> {prof.quantity} pessoas
                    </div>
                    <div style={{ fontSize: '14px', marginBottom: '3px' }}>
                      <strong>Turno/Horário:</strong> {prof.shift}
                    </div>
                    {prof.requirements && (
                      <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                        <strong>Requisitos:</strong> {prof.requirements}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Equipment */}
            {props.needsEquipment && (
              <div className="section">
                <div className="section-header">🛠️ Equipamentos Solicitados</div>
                <div className="section-content">
                  {props.equipmentList && props.equipmentList.length > 0 && (
                    <ul style={{ margin: '0 0 15px 0', paddingLeft: '25px' }}>
                      {props.equipmentList.map((eq, index) => (
                        <li key={index}>{eq}</li>
                      ))}
                    </ul>
                  )}
                  {props.equipmentOther && (
                    <div className="data-row">
                      <div className="data-label">Outros:</div>
                      <div className="data-value">{props.equipmentOther}</div>
                    </div>
                  )}
                  {props.equipmentNotes && (
                    <div className="data-row">
                      <div className="data-label">Observações:</div>
                      <div className="data-value">{props.equipmentNotes}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Budget and Notes */}
            <div className="section">
              <div className="section-header">💰 Orçamento e Observações</div>
              <div className="section-content">
                {props.budgetRange && (
                  <div className="data-row">
                    <div className="data-label">Orçamento:</div>
                    <div className="data-value"><strong>{props.budgetRange}</strong></div>
                  </div>
                )}
                <div className="data-row">
                  <div className="data-label">Urgência:</div>
                  <div className="data-value" style={{ color: urgencyColor, fontWeight: '600' }}>
                    {urgencyLabel}
                  </div>
                </div>
                {props.additionalNotes && (
                  <div className="data-row">
                    <div className="data-label">Observações:</div>
                    <div className="data-value">{props.additionalNotes}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Box */}
            <div className="action-box">
              <h3>⚡ Ações Necessárias</h3>
              <ul>
                <li>Responder cliente em até 2h (horário comercial)</li>
                <li>Verificar disponibilidade de profissionais no sistema</li>
                <li>Preparar proposta comercial detalhada</li>
                <li>Enviar perfis de profissionais selecionados</li>
                <li>Elaborar contrato de prestação de serviços</li>
                <li>Agendar reunião/call se necessário</li>
              </ul>
            </div>

            {/* Contact Links */}
            <div className="contact-links">
              <strong>Links Rápidos:</strong><br />
              <a href={`mailto:${props.email}`}>✉️ Email Cliente</a>
              <a href={`https://wa.me/55${props.phone.replace(/\D/g, '')}`}>💬 WhatsApp</a>
            </div>
          </div>

          {/* Footer */}
          <div className="footer">
            <p style={{ margin: '0 0 5px 0' }}>
              🤖 Email automático gerado pelo sistema HRX
            </p>
            <p style={{ margin: 0, fontSize: '12px' }}>
              {new Date(props.createdAt).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};
