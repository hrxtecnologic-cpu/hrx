/**
 * =====================================================
 * Email Template: OS para Profissionais
 * =====================================================
 * Briefing completo para profissionais alocados no evento
 * Dark Theme HRX - Padrão zinc
 * =====================================================
 */

import * as React from 'react';
import { EmailFooterDark, HRX_CONTACT_INFO, EMAIL_DARK_STYLES } from './EmailFooterDark';

interface ServiceOrderProfessionalEmailProps {
  professionalName: string;
  professionalEmail: string;
  osNumber: string;
  projectNumber: string;
  eventName: string;
  eventType: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  venueName: string;
  venueAddress: string;
  venueCity: string;
  venueState: string;
  clientName: string;
  clientPhone?: string;
  yourRole: string;
  arrivalTime: string;
  briefing: string;
  responsibilities: string[];
  equipmentAssigned: string[];
  checklistItems: string[];
  recommendations: string[];
  alerts: string[];
  distanceKm?: number;
  travelTimeMinutes?: number;
}

export const ServiceOrderProfessionalEmail = (props: ServiceOrderProfessionalEmailProps) => {
  const {
    professionalName,
    professionalEmail,
    osNumber,
    projectNumber,
    eventName,
    eventType,
    eventDate,
    eventStartTime,
    eventEndTime,
    venueName,
    venueAddress,
    venueCity,
    venueState,
    clientName,
    clientPhone,
    yourRole,
    arrivalTime,
    briefing,
    responsibilities,
    equipmentAssigned,
    checklistItems,
    recommendations,
    alerts,
    distanceKm,
    travelTimeMinutes,
  } = props;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

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
            <span className="badge" style={{
              background: '#dc2626',
              color: '#fff',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '600',
              display: 'inline-block',
              marginTop: '10px'
            }}>
              📋 Ordem de Serviço - {osNumber}
            </span>
          </div>

          {/* Greeting */}
          <h1 style={{ color: '#fafafa', fontSize: '26px', marginBottom: '10px' }}>
            Olá, {professionalName}!
          </h1>

          <div className="content">
            <p style={{ color: '#d4d4d8', marginBottom: '25px', fontSize: '15px' }}>
              Você foi alocado para o evento <strong style={{ color: '#4ade80' }}>{eventName}</strong>!
              <br />
              Confira abaixo todos os detalhes da sua participação.
            </p>
          </div>

          {/* Sua Função */}
          <div style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
            borderRadius: '8px',
            padding: '20px',
            margin: '20px 0',
            border: '2px solid #3b82f6',
            textAlign: 'center'
          }}>
            <p style={{ color: '#93c5fd', fontSize: '13px', margin: '0 0 8px 0', fontWeight: '600' }}>
              SUA FUNÇÃO
            </p>
            <p style={{ color: '#ffffff', fontSize: '22px', fontWeight: '700', margin: '0' }}>
              {yourRole}
            </p>
          </div>

          {/* Event Info */}
          <div style={{
            background: '#18181b',
            borderRadius: '8px',
            padding: '25px',
            margin: '20px 0',
            border: '1px solid #27272a',
            overflow: 'hidden'
          }}>
            <h3 style={{ color: '#fafafa', margin: '0 0 15px 0', fontSize: '18px' }}>
              🎪 Informações do Evento
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ color: '#a1a1aa', fontSize: '13px', padding: '8px 0', width: '35%' }}>
                    Projeto:
                  </td>
                  <td style={{ color: '#fafafa', fontSize: '14px', fontWeight: '600', padding: '8px 0' }}>
                    {projectNumber}
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#a1a1aa', fontSize: '13px', padding: '8px 0' }}>
                    Tipo:
                  </td>
                  <td style={{ color: '#fafafa', fontSize: '14px', fontWeight: '600', padding: '8px 0' }}>
                    {eventType}
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#a1a1aa', fontSize: '13px', padding: '8px 0' }}>
                    Data:
                  </td>
                  <td style={{ color: '#4ade80', fontSize: '14px', fontWeight: '700', padding: '8px 0' }}>
                    {formatDate(eventDate)}
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#a1a1aa', fontSize: '13px', padding: '8px 0' }}>
                    Horário:
                  </td>
                  <td style={{ color: '#fafafa', fontSize: '14px', fontWeight: '600', padding: '8px 0' }}>
                    {eventStartTime} às {eventEndTime}
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#a1a1aa', fontSize: '13px', padding: '8px 0' }}>
                    Cliente:
                  </td>
                  <td style={{ color: '#fafafa', fontSize: '14px', fontWeight: '600', padding: '8px 0' }}>
                    {clientName}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Local */}
          <div style={{
            background: '#18181b',
            borderRadius: '8px',
            padding: '25px',
            margin: '20px 0',
            border: '1px solid #27272a'
          }}>
            <h3 style={{ color: '#fafafa', margin: '0 0 15px 0', fontSize: '18px' }}>
              📍 Local do Evento
            </h3>
            <p style={{ color: '#fafafa', fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>
              {venueName}
            </p>
            <p style={{ color: '#d4d4d8', fontSize: '14px', margin: '0 0 12px 0' }}>
              {venueAddress}
              <br />
              {venueCity}/{venueState}
            </p>
            {distanceKm && travelTimeMinutes && (
              <div style={{
                background: '#09090b',
                padding: '12px',
                borderRadius: '6px',
                marginTop: '12px'
              }}>
                <p style={{ color: '#a1a1aa', fontSize: '13px', margin: '0' }}>
                  🚗 Distância da base: <strong style={{ color: '#fafafa' }}>{distanceKm} km</strong> (~{travelTimeMinutes} min)
                </p>
              </div>
            )}
          </div>

          {/* Horário de Chegada */}
          <div style={{
            background: '#422006',
            border: '2px solid #ea580c',
            borderRadius: '8px',
            padding: '20px',
            margin: '25px 0',
            textAlign: 'center'
          }}>
            <p style={{ color: '#fdba74', fontSize: '14px', margin: '0 0 8px 0', fontWeight: '600' }}>
              ⏰ HORÁRIO DE CHEGADA
            </p>
            <p style={{ color: '#ffffff', fontSize: '32px', fontWeight: '700', margin: '0' }}>
              {arrivalTime}
            </p>
            <p style={{ color: '#fed7aa', fontSize: '13px', margin: '12px 0 0 0' }}>
              Por favor, chegue pontualmente para a montagem!
            </p>
          </div>

          {/* Briefing */}
          <div style={{
            background: '#18181b',
            borderRadius: '8px',
            padding: '25px',
            margin: '20px 0',
            border: '1px solid #27272a'
          }}>
            <h3 style={{ color: '#fafafa', margin: '0 0 15px 0', fontSize: '18px' }}>
              📝 Briefing do Evento
            </h3>
            <p style={{
              color: '#d4d4d8',
              fontSize: '14px',
              lineHeight: '1.8',
              margin: '0',
              whiteSpace: 'pre-wrap'
            }}>
              {briefing}
            </p>
          </div>

          {/* Suas Responsabilidades */}
          {responsibilities.length > 0 && (
            <div style={{
              background: '#18181b',
              borderRadius: '8px',
              padding: '25px',
              margin: '20px 0',
              border: '1px solid #27272a'
            }}>
              <h3 style={{ color: '#fafafa', margin: '0 0 15px 0', fontSize: '18px' }}>
                ✅ Suas Responsabilidades
              </h3>
              <ul style={{
                color: '#d4d4d8',
                fontSize: '14px',
                lineHeight: '1.8',
                paddingLeft: '20px',
                margin: '0'
              }}>
                {responsibilities.map((item, index) => (
                  <li key={index} style={{ marginBottom: '8px' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Equipamentos */}
          {equipmentAssigned.length > 0 && (
            <div style={{
              background: '#18181b',
              borderRadius: '8px',
              padding: '25px',
              margin: '20px 0',
              border: '1px solid #27272a'
            }}>
              <h3 style={{ color: '#fafafa', margin: '0 0 15px 0', fontSize: '18px' }}>
                🎛️ Equipamentos sob sua responsabilidade
              </h3>
              <ul style={{
                color: '#d4d4d8',
                fontSize: '14px',
                lineHeight: '1.8',
                paddingLeft: '20px',
                margin: '0'
              }}>
                {equipmentAssigned.map((item, index) => (
                  <li key={index} style={{ marginBottom: '8px' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Checklist */}
          {checklistItems.length > 0 && (
            <div style={{
              background: '#18181b',
              borderRadius: '8px',
              padding: '25px',
              margin: '20px 0',
              border: '1px solid #27272a'
            }}>
              <h3 style={{ color: '#fafafa', margin: '0 0 15px 0', fontSize: '18px' }}>
                📋 Checklist de Tarefas
              </h3>
              <ul style={{
                color: '#d4d4d8',
                fontSize: '14px',
                lineHeight: '1.8',
                paddingLeft: '20px',
                margin: '0'
              }}>
                {checklistItems.map((item, index) => (
                  <li key={index} style={{ marginBottom: '8px' }}>
                    <span style={{ color: '#71717a' }}>☐</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recomendações da IA */}
          {recommendations.length > 0 && (
            <div style={{
              background: '#14532d',
              border: '2px solid #16a34a',
              borderRadius: '8px',
              padding: '20px',
              margin: '25px 0'
            }}>
              <p style={{
                color: '#86efac',
                fontSize: '15px',
                fontWeight: '600',
                margin: '0 0 12px 0'
              }}>
                💡 Recomendações Inteligentes
              </p>
              <ul style={{
                color: '#bbf7d0',
                fontSize: '13px',
                margin: '0',
                paddingLeft: '20px',
                lineHeight: '1.8'
              }}>
                {recommendations.map((rec, index) => (
                  <li key={index} style={{ marginBottom: '8px' }}>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Alertas */}
          {alerts.length > 0 && (
            <div style={{
              background: '#7f1d1d',
              border: '2px solid #dc2626',
              borderRadius: '8px',
              padding: '20px',
              margin: '25px 0'
            }}>
              <p style={{
                color: '#fca5a5',
                fontSize: '15px',
                fontWeight: '600',
                margin: '0 0 12px 0'
              }}>
                ⚠️ Atenção - Alertas Importantes
              </p>
              <ul style={{
                color: '#fecaca',
                fontSize: '13px',
                margin: '0',
                paddingLeft: '20px',
                lineHeight: '1.8'
              }}>
                {alerts.map((alert, index) => (
                  <li key={index} style={{ marginBottom: '8px' }}>
                    {alert}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contatos de Emergência */}
          <div style={{
            background: '#18181b',
            borderRadius: '8px',
            padding: '25px',
            margin: '20px 0',
            border: '1px solid #27272a'
          }}>
            <h3 style={{ color: '#fafafa', margin: '0 0 15px 0', fontSize: '18px' }}>
              📞 Contatos Importantes
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {clientPhone && (
                  <tr>
                    <td style={{ color: '#a1a1aa', fontSize: '13px', padding: '8px 0', width: '40%' }}>
                      Cliente:
                    </td>
                    <td style={{ color: '#fafafa', fontSize: '14px', fontWeight: '600', padding: '8px 0' }}>
                      {clientName} - <a href={`tel:${clientPhone}`} style={{ color: '#ef4444', textDecoration: 'none' }}>{clientPhone}</a>
                    </td>
                  </tr>
                )}
                <tr>
                  <td style={{ color: '#a1a1aa', fontSize: '13px', padding: '8px 0' }}>
                    Coordenação HRX:
                  </td>
                  <td style={{ color: '#fafafa', fontSize: '14px', fontWeight: '600', padding: '8px 0' }}>
                    <a href={`https://wa.me/${HRX_CONTACT_INFO.telefoneWhatsApp}`} style={{ color: '#ef4444', textDecoration: 'none' }}>
                      {HRX_CONTACT_INFO.telefone}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#a1a1aa', fontSize: '13px', padding: '8px 0' }}>
                    Email Operações:
                  </td>
                  <td style={{ color: '#fafafa', fontSize: '14px', fontWeight: '600', padding: '8px 0' }}>
                    <a href="mailto:operacoes@hrxeventos.com.br" style={{ color: '#ef4444', textDecoration: 'none' }}>
                      operacoes@hrxeventos.com.br
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{
            background: '#1e3a8a',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            padding: '20px',
            margin: '25px 0',
            textAlign: 'center'
          }}>
            <p style={{
              color: '#dbeafe',
              fontSize: '14px',
              margin: '0',
              lineHeight: '1.6'
            }}>
              ✨ <strong>Lembre-se:</strong> Sua profissionalidade representa a HRX Eventos!
              <br />
              Qualquer dúvida, entre em contato conosco imediatamente.
            </p>
          </div>

          <div style={{
            height: '1px',
            background: '#27272a',
            margin: '30px 0'
          }} />

          {/* Footer */}
          <EmailFooterDark recipientEmail={professionalEmail} showContact={false} />
        </div>
      </body>
    </html>
  );
};

export default ServiceOrderProfessionalEmail;
