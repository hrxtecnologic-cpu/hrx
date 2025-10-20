import * as React from 'react';

interface Professional {
  category: string;
  quantity: number;
  shift: string;
  requirements?: string;
}

interface ContractorConfirmationEmailProps {
  responsibleName: string;
  eventName: string;
  requestNumber: string;
  startDate: string;
  endDate: string;
  venueAddress: string;
  venueCity: string;
  venueState: string;
  professionalsNeeded: Professional[];
  needsEquipment: boolean;
  equipmentList?: string[];
  budgetRange?: string;
  urgency: string;
}

export const ContractorConfirmationEmail: React.FC<ContractorConfirmationEmailProps> = ({
  responsibleName,
  eventName,
  requestNumber,
  startDate,
  endDate,
  venueAddress,
  venueCity,
  venueState,
  professionalsNeeded,
  needsEquipment,
  equipmentList,
  budgetRange,
  urgency,
}) => {
  const urgencyLabel = {
    normal: 'Normal',
    urgent: 'Urgente',
    very_urgent: 'Muito Urgente',
  }[urgency] || 'Normal';

  const totalProfessionals = professionalsNeeded.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <html>
      <head>
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: #DC2626;
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 2px;
            margin-bottom: 10px;
          }
          .header-subtitle {
            font-size: 16px;
            opacity: 0.9;
          }
          .content {
            padding: 30px;
          }
          .request-number {
            background: #fee2e2;
            color: #DC2626;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
            margin-bottom: 20px;
            font-weight: bold;
            font-size: 18px;
          }
          .greeting {
            font-size: 18px;
            color: #1a1a1a;
            margin-bottom: 20px;
          }
          .section {
            margin: 25px 0;
            padding: 20px;
            background: #f9fafb;
            border-radius: 6px;
            border-left: 4px solid #DC2626;
          }
          .section-title {
            color: #DC2626;
            font-size: 16px;
            font-weight: 600;
            margin-top: 0;
            margin-bottom: 15px;
          }
          .info-row {
            display: flex;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            font-weight: 600;
            color: #4a5568;
            min-width: 120px;
          }
          .info-value {
            color: #1a1a1a;
          }
          .professionals-list {
            margin: 10px 0;
          }
          .professional-item {
            background: #ffffff;
            padding: 12px;
            margin: 8px 0;
            border-radius: 4px;
            border-left: 3px solid #DC2626;
          }
          .professional-item strong {
            color: #DC2626;
          }
          .next-steps {
            background: #dbeafe;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 25px 0;
            border-radius: 6px;
          }
          .next-steps h3 {
            color: #1e40af;
            margin-top: 0;
          }
          .next-steps ul {
            margin: 15px 0;
            padding-left: 25px;
          }
          .next-steps li {
            margin: 10px 0;
            color: #1e3a8a;
          }
          .contact-box {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 6px;
            text-align: center;
            margin: 25px 0;
          }
          .contact-box h3 {
            color: #1a1a1a;
            margin-top: 0;
          }
          .contact-info {
            margin: 10px 0;
            font-size: 16px;
          }
          .contact-info a {
            color: #DC2626;
            text-decoration: none;
            font-weight: 600;
          }
          .contact-info a:hover {
            text-decoration: underline;
          }
          .footer {
            background: #1a1a1a;
            color: #ffffff;
            padding: 20px;
            text-align: center;
            font-size: 14px;
          }
          .footer-link {
            color: #DC2626;
            text-decoration: none;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          {/* Header */}
          <div className="header">
            <div className="logo">HRX</div>
            <div className="header-subtitle">✅ Solicitação Recebida</div>
          </div>

          {/* Content */}
          <div className="content">
            {/* Request Number */}
            <div className="request-number">
              Nº da Solicitação: {requestNumber}
            </div>

            {/* Greeting */}
            <p className="greeting">
              Olá, <strong>{responsibleName}</strong>!
            </p>

            <p>
              Recebemos sua solicitação de equipe para o evento e estamos muito felizes em poder
              ajudá-lo! Nossa equipe está analisando todos os detalhes.
            </p>

            {/* Event Info */}
            <div className="section">
              <h3 className="section-title">🎯 Dados do Evento</h3>
              <div className="info-row">
                <div className="info-label">Evento:</div>
                <div className="info-value"><strong>{eventName}</strong></div>
              </div>
              <div className="info-row">
                <div className="info-label">Data:</div>
                <div className="info-value">
                  {new Date(startDate).toLocaleDateString('pt-BR')} até{' '}
                  {new Date(endDate).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <div className="info-row">
                <div className="info-label">Local:</div>
                <div className="info-value">{venueAddress}, {venueCity} - {venueState}</div>
              </div>
              <div className="info-row">
                <div className="info-label">Urgência:</div>
                <div className="info-value">{urgencyLabel}</div>
              </div>
              {budgetRange && (
                <div className="info-row">
                  <div className="info-label">Orçamento:</div>
                  <div className="info-value">{budgetRange}</div>
                </div>
              )}
            </div>

            {/* Professionals */}
            <div className="section">
              <h3 className="section-title">👷 Profissionais Solicitados</h3>
              <p style={{ marginTop: 0 }}>
                <strong>Total: {totalProfessionals} profissionais</strong>
              </p>
              <div className="professionals-list">
                {professionalsNeeded.map((prof, index) => (
                  <div key={index} className="professional-item">
                    <div>
                      <strong>{prof.category}</strong>: {prof.quantity} pessoas - {prof.shift}
                    </div>
                    {prof.requirements && (
                      <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '5px' }}>
                        Requisitos: {prof.requirements}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Equipment */}
            {needsEquipment && equipmentList && equipmentList.length > 0 && (
              <div className="section">
                <h3 className="section-title">🛠️ Equipamentos Solicitados</h3>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {equipmentList.map((equipment, index) => (
                    <li key={index}>{equipment}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Steps */}
            <div className="next-steps">
              <h3>✅ Próximos Passos</h3>
              <p>
                Nossa equipe está analisando sua solicitação e entrará em contato em até{' '}
                <strong>2 horas</strong> durante horário comercial (Segunda a Sexta, 9h às 18h).
              </p>
              <p>Você receberá:</p>
              <ul>
                <li>Proposta detalhada com valores</li>
                <li>Perfis dos profissionais selecionados</li>
                <li>Contrato de prestação de serviços</li>
                <li>Cronograma de execução</li>
              </ul>
            </div>

            {/* Contact */}
            <div className="contact-box">
              <h3>📞 Contato Direto</h3>
              <div className="contact-info">
                <strong>WhatsApp:</strong>{' '}
                <a href="https://wa.me/5521999999999">(21) 99999-9999</a>
              </div>
              <div className="contact-info">
                <strong>Email:</strong>{' '}
                <a href="mailto:comercial@hrx.com.br">comercial@hrx.com.br</a>
              </div>
              <div className="contact-info">
                <strong>Telefone:</strong> (21) 3333-3333
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="footer">
            <p style={{ margin: '0 0 10px 0' }}>
              Atenciosamente,<br />
              <strong>Equipe HRX</strong><br />
              Soluções Completas para Eventos
            </p>
            <p style={{ margin: '10px 0 0 0', fontSize: '12px', opacity: 0.8 }}>
              © 2025 HRX - Plataforma de Profissionais para Eventos
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};
