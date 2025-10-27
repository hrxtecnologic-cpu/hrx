import * as React from 'react';
import { EmailFooterDark, HRX_CONTACT_INFO, EMAIL_DARK_STYLES } from './EmailFooterDark';

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
        <style>{EMAIL_DARK_STYLES}</style>
      </head>
      <body>
        <div className="container">
          {/* Header */}
          <div className="header">
            <div className="logo">HRX EVENTOS</div>
            <span className="badge">✅ Solicitação Recebida</span>
          </div>

          {/* Content */}
          <div className="content">
            {/* Request Number */}
            <div className="highlight-box" style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h3 style={{ margin: 0, fontSize: '20px' }}>Nº da Solicitação: {requestNumber}</h3>
            </div>

            {/* Greeting */}
            <h1 style={{ fontSize: '22px', marginBottom: '20px' }}>
              Olá, <strong>{responsibleName}</strong>!
            </h1>

            <p style={{ color: '#d4d4d8', marginBottom: '30px' }}>
              Recebemos sua solicitação de equipe para o evento e estamos muito felizes em poder
              ajudá-lo! Nossa equipe está analisando todos os detalhes.
            </p>

            {/* Event Info */}
            <div className="info-box">
              <h2>🎯 Dados do Evento</h2>
              <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid #27272a' }}>
                <div style={{ fontWeight: 600, color: '#a1a1aa', minWidth: '120px' }}>Evento:</div>
                <div style={{ color: '#fafafa' }}><strong>{eventName}</strong></div>
              </div>
              <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid #27272a' }}>
                <div style={{ fontWeight: 600, color: '#a1a1aa', minWidth: '120px' }}>Data:</div>
                <div style={{ color: '#fafafa' }}>
                  {new Date(startDate).toLocaleDateString('pt-BR')} até{' '}
                  {new Date(endDate).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid #27272a' }}>
                <div style={{ fontWeight: 600, color: '#a1a1aa', minWidth: '120px' }}>Local:</div>
                <div style={{ color: '#fafafa' }}>{venueAddress}, {venueCity} - {venueState}</div>
              </div>
              <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid #27272a' }}>
                <div style={{ fontWeight: 600, color: '#a1a1aa', minWidth: '120px' }}>Urgência:</div>
                <div style={{ color: '#fafafa' }}>{urgencyLabel}</div>
              </div>
              {budgetRange && (
                <div style={{ display: 'flex', padding: '8px 0' }}>
                  <div style={{ fontWeight: 600, color: '#a1a1aa', minWidth: '120px' }}>Orçamento:</div>
                  <div style={{ color: '#fafafa' }}>{budgetRange}</div>
                </div>
              )}
            </div>

            {/* Professionals */}
            <div className="info-box">
              <h2>👷 Profissionais Solicitados</h2>
              <p style={{ marginTop: 0 }}>
                <strong>Total: {totalProfessionals} profissionais</strong>
              </p>
              <div style={{ margin: '10px 0' }}>
                {professionalsNeeded.map((prof, index) => (
                  <div key={index} style={{
                    background: '#18181b',
                    padding: '12px',
                    margin: '8px 0',
                    borderRadius: '4px',
                    borderLeft: '3px solid #ef4444'
                  }}>
                    <div>
                      <strong style={{ color: '#ef4444' }}>{prof.category}</strong>: {prof.quantity} pessoas - {prof.shift}
                    </div>
                    {prof.requirements && (
                      <div style={{ fontSize: '14px', color: '#71717a', marginTop: '5px' }}>
                        Requisitos: {prof.requirements}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Equipment */}
            {needsEquipment && equipmentList && equipmentList.length > 0 && (
              <div className="info-box">
                <h2>🛠️ Equipamentos Solicitados</h2>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {equipmentList.map((equipment, index) => (
                    <li key={index}>{equipment}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Steps */}
            <div className="highlight-box">
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
          </div>

          <div className="divider"></div>

          {/* Footer */}
          <EmailFooterDark showContact={true} />
        </div>
      </body>
    </html>
  );
};
