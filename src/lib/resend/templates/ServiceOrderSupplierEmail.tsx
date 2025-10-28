/**
 * =====================================================
 * Email Template: OS para Fornecedores
 * =====================================================
 * Instruções de entrega de equipamentos para fornecedores
 * Dark Theme HRX - Padrão zinc
 * =====================================================
 */

import * as React from 'react';
import { EmailFooterDark, HRX_CONTACT_INFO, EMAIL_DARK_STYLES } from './EmailFooterDark';

interface EquipmentItem {
  name: string;
  quantity: number;
  specifications?: string;
}

interface ServiceOrderSupplierEmailProps {
  supplierName: string;
  supplierEmail: string;
  osNumber: string;
  projectNumber: string;
  eventName: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  venueName: string;
  venueAddress: string;
  venueCity: string;
  venueState: string;
  deliveryTime: string;
  pickupTime?: string;
  equipmentList: EquipmentItem[];
  specialInstructions?: string;
  contactName: string;
  contactPhone: string;
  setupDuration?: number;
}

export const ServiceOrderSupplierEmail = (props: ServiceOrderSupplierEmailProps) => {
  const {
    supplierName,
    supplierEmail,
    osNumber,
    projectNumber,
    eventName,
    eventDate,
    eventStartTime,
    eventEndTime,
    venueName,
    venueAddress,
    venueCity,
    venueState,
    deliveryTime,
    pickupTime,
    equipmentList,
    specialInstructions,
    contactName,
    contactPhone,
    setupDuration,
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
              📦 Ordem de Serviço - {osNumber}
            </span>
          </div>

          {/* Greeting */}
          <h1 style={{ color: '#fafafa', fontSize: '26px', marginBottom: '10px' }}>
            Olá, {supplierName}!
          </h1>

          <div className="content">
            <p style={{ color: '#d4d4d8', marginBottom: '25px', fontSize: '15px' }}>
              Confirmamos a solicitação de equipamentos para o evento <strong style={{ color: '#4ade80' }}>{eventName}</strong>.
              <br />
              Confira abaixo todos os detalhes da entrega.
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
                    Evento:
                  </td>
                  <td style={{ color: '#fafafa', fontSize: '14px', fontWeight: '600', padding: '8px 0', wordWrap: 'break-word' }}>
                    {eventName}
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
                    Horário do Evento:
                  </td>
                  <td style={{ color: '#fafafa', fontSize: '14px', fontWeight: '600', padding: '8px 0' }}>
                    {eventStartTime} às {eventEndTime}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Delivery Time */}
          <div style={{
            background: 'linear-gradient(135deg, #422006 0%, #7c2d12 100%)',
            border: '2px solid #ea580c',
            borderRadius: '8px',
            padding: '20px',
            margin: '25px 0',
            textAlign: 'center'
          }}>
            <p style={{ color: '#fdba74', fontSize: '14px', margin: '0 0 8px 0', fontWeight: '600' }}>
              📦 HORÁRIO DE ENTREGA
            </p>
            <p style={{ color: '#ffffff', fontSize: '32px', fontWeight: '700', margin: '0' }}>
              {deliveryTime}
            </p>
            {setupDuration && (
              <p style={{ color: '#fed7aa', fontSize: '13px', margin: '12px 0 0 0' }}>
                Os equipamentos precisam estar montados até {setupDuration} minutos antes do evento
              </p>
            )}
          </div>

          {/* Local de Entrega */}
          <div style={{
            background: '#18181b',
            borderRadius: '8px',
            padding: '25px',
            margin: '20px 0',
            border: '1px solid #27272a'
          }}>
            <h3 style={{ color: '#fafafa', margin: '0 0 15px 0', fontSize: '18px' }}>
              📍 Local de Entrega
            </h3>
            <p style={{ color: '#fafafa', fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>
              {venueName}
            </p>
            <p style={{ color: '#d4d4d8', fontSize: '14px', margin: '0 0 12px 0' }}>
              {venueAddress}
              <br />
              {venueCity}/{venueState}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueAddress + ', ' + venueCity + '/' + venueState)}`}
              style={{
                display: 'inline-block',
                background: '#dc2626',
                color: '#ffffff',
                padding: '10px 20px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '600',
                marginTop: '10px'
              }}
            >
              📍 Ver no Google Maps
            </a>
          </div>

          {/* Equipment List */}
          <div style={{
            background: '#18181b',
            borderRadius: '8px',
            padding: '25px',
            margin: '20px 0',
            border: '1px solid #27272a',
            overflow: 'hidden'
          }}>
            <h3 style={{ color: '#fafafa', margin: '0 0 15px 0', fontSize: '18px' }}>
              🎛️ Equipamentos Solicitados
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #27272a' }}>
                  <th style={{
                    color: '#a1a1aa',
                    fontSize: '12px',
                    fontWeight: '600',
                    textAlign: 'left',
                    padding: '12px 8px',
                    textTransform: 'uppercase'
                  }}>
                    Equipamento
                  </th>
                  <th style={{
                    color: '#a1a1aa',
                    fontSize: '12px',
                    fontWeight: '600',
                    textAlign: 'center',
                    padding: '12px 8px',
                    textTransform: 'uppercase',
                    width: '80px'
                  }}>
                    Qtd
                  </th>
                </tr>
              </thead>
              <tbody>
                {equipmentList.map((item, index) => (
                  <React.Fragment key={index}>
                    <tr style={{ borderBottom: '1px solid #18181b' }}>
                      <td style={{
                        color: '#fafafa',
                        fontSize: '14px',
                        fontWeight: '600',
                        padding: '12px 8px',
                        wordWrap: 'break-word'
                      }}>
                        {item.name}
                      </td>
                      <td style={{
                        color: '#4ade80',
                        fontSize: '16px',
                        fontWeight: '700',
                        textAlign: 'center',
                        padding: '12px 8px'
                      }}>
                        {item.quantity}x
                      </td>
                    </tr>
                    {item.specifications && (
                      <tr>
                        <td colSpan={2} style={{
                          color: '#a1a1aa',
                          fontSize: '12px',
                          padding: '0 8px 12px 8px',
                          fontStyle: 'italic'
                        }}>
                          {item.specifications}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pickup Time */}
          {pickupTime && (
            <div style={{
              background: '#18181b',
              border: '1px solid #3b82f6',
              borderRadius: '8px',
              padding: '20px',
              margin: '25px 0'
            }}>
              <p style={{
                color: '#93c5fd',
                fontSize: '15px',
                fontWeight: '600',
                margin: '0 0 8px 0'
              }}>
                🚚 Retirada dos Equipamentos
              </p>
              <p style={{ color: '#dbeafe', fontSize: '14px', margin: '0' }}>
                Os equipamentos devem ser retirados às <strong>{pickupTime}</strong> do mesmo local de entrega.
              </p>
            </div>
          )}

          {/* Special Instructions */}
          {specialInstructions && (
            <div style={{
              background: '#422006',
              border: '2px solid #ea580c',
              borderRadius: '8px',
              padding: '20px',
              margin: '25px 0'
            }}>
              <p style={{
                color: '#fdba74',
                fontSize: '15px',
                fontWeight: '600',
                margin: '0 0 12px 0'
              }}>
                ⚠️ Instruções Especiais
              </p>
              <p style={{
                color: '#fed7aa',
                fontSize: '14px',
                margin: '0',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {specialInstructions}
              </p>
            </div>
          )}

          {/* Responsável no Local */}
          <div style={{
            background: '#18181b',
            borderRadius: '8px',
            padding: '25px',
            margin: '20px 0',
            border: '1px solid #27272a'
          }}>
            <h3 style={{ color: '#fafafa', margin: '0 0 15px 0', fontSize: '18px' }}>
              👤 Responsável no Local
            </h3>
            <p style={{ color: '#d4d4d8', fontSize: '14px', margin: '0 0 12px 0' }}>
              Ao chegar no local, procure por:
            </p>
            <div style={{
              background: '#09090b',
              padding: '15px',
              borderRadius: '6px',
              border: '1px solid #18181b'
            }}>
              <p style={{ color: '#fafafa', fontSize: '15px', fontWeight: '600', margin: '0 0 5px 0' }}>
                {contactName}
              </p>
              <p style={{ color: '#a1a1aa', fontSize: '14px', margin: '0' }}>
                📱 <a href={`tel:${contactPhone}`} style={{ color: '#ef4444', textDecoration: 'none', fontWeight: '600' }}>
                  {contactPhone}
                </a>
              </p>
            </div>
          </div>

          {/* Important Notes */}
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
              ✅ Checklist de Entrega
            </p>
            <ul style={{
              color: '#bbf7d0',
              fontSize: '13px',
              margin: '0',
              paddingLeft: '20px',
              lineHeight: '1.8'
            }}>
              <li style={{ marginBottom: '8px' }}>
                Verificar todos os equipamentos antes da saída
              </li>
              <li style={{ marginBottom: '8px' }}>
                Chegar no horário combinado ({deliveryTime})
              </li>
              <li style={{ marginBottom: '8px' }}>
                Montar e testar todos os equipamentos
              </li>
              <li style={{ marginBottom: '8px' }}>
                Aguardar aprovação do responsável técnico
              </li>
              <li style={{ marginBottom: '8px' }}>
                Manter contato para qualquer imprevisto
              </li>
            </ul>
          </div>

          {/* Contatos */}
          <div style={{
            background: '#18181b',
            borderRadius: '8px',
            padding: '25px',
            margin: '20px 0',
            border: '1px solid #27272a'
          }}>
            <h3 style={{ color: '#fafafa', margin: '0 0 15px 0', fontSize: '18px' }}>
              📞 Contatos HRX Eventos
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ color: '#a1a1aa', fontSize: '13px', padding: '8px 0', width: '40%' }}>
                    Operações:
                  </td>
                  <td style={{ color: '#fafafa', fontSize: '14px', fontWeight: '600', padding: '8px 0' }}>
                    <a href={`https://wa.me/${HRX_CONTACT_INFO.telefoneWhatsApp}`} style={{ color: '#ef4444', textDecoration: 'none' }}>
                      {HRX_CONTACT_INFO.telefone}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#a1a1aa', fontSize: '13px', padding: '8px 0' }}>
                    Email:
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
              🤝 Contamos com a sua parceria para o sucesso deste evento!
              <br />
              Qualquer imprevisto, entre em contato imediatamente.
            </p>
          </div>

          <div style={{
            height: '1px',
            background: '#27272a',
            margin: '30px 0'
          }} />

          {/* Footer */}
          <EmailFooterDark recipientEmail={supplierEmail} showContact={false} />
        </div>
      </body>
    </html>
  );
};

export default ServiceOrderSupplierEmail;
