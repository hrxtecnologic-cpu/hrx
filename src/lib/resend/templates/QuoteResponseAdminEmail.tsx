import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { EmailFooter, HRX_CONTACT_INFO } from './EmailFooter';

interface QuoteResponseAdminEmailProps {
  projectNumber: string;
  projectName: string;
  supplierName: string;
  equipmentName: string;
  totalPrice: number;
  dailyRate?: number;
  deliveryFee?: number;
  setupFee?: number;
  paymentTerms?: string;
  quotationUrl: string;
}

export const QuoteResponseAdminEmail = ({
  projectNumber,
  projectName,
  supplierName,
  equipmentName,
  totalPrice,
  dailyRate,
  deliveryFee,
  setupFee,
  paymentTerms,
  quotationUrl,
}: QuoteResponseAdminEmailProps) => {
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(totalPrice);

  const formattedDailyRate = dailyRate
    ? new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(dailyRate)
    : null;

  return (
    <Html>
      <Head />
      <Preview>Nova cotação recebida de {supplierName} - {formattedPrice}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>✅ Nova Cotação Recebida!</Heading>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={paragraph}>
              O fornecedor <strong>{supplierName}</strong> enviou uma cotação para o projeto <strong>#{projectNumber}</strong>.
            </Text>

            {/* Detalhes do Projeto */}
            <Section style={infoBox}>
              <Heading as="h2" style={h2}>
                📋 Detalhes do Projeto
              </Heading>
              <Text style={infoText}>
                <strong>Projeto:</strong> {projectName}
              </Text>
              <Text style={infoText}>
                <strong>Número:</strong> #{projectNumber}
              </Text>
              <Text style={infoText}>
                <strong>Equipamento:</strong> {equipmentName}
              </Text>
            </Section>

            {/* Detalhes da Cotação */}
            <Section style={priceBox}>
              <Heading as="h2" style={h2}>
                💰 Valores da Cotação
              </Heading>
              <Text style={pricePrimary}>
                Valor Total: <span style={priceValue}>{formattedPrice}</span>
              </Text>
              {formattedDailyRate && (
                <Text style={infoText}>
                  Diária: {formattedDailyRate}
                </Text>
              )}
              {deliveryFee !== undefined && deliveryFee > 0 && (
                <Text style={infoText}>
                  Taxa de Entrega: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deliveryFee)}
                </Text>
              )}
              {setupFee !== undefined && setupFee > 0 && (
                <Text style={infoText}>
                  Taxa de Montagem: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(setupFee)}
                </Text>
              )}
              {paymentTerms && (
                <Text style={infoText}>
                  <strong>Condições de Pagamento:</strong> {paymentTerms}
                </Text>
              )}
            </Section>

            {/* Call to Action */}
            <Section style={buttonContainer}>
              <Button style={button} href={quotationUrl}>
                Ver Cotação Completa
              </Button>
            </Section>

            <Text style={paragraph}>
              Analise a cotação e decida se deseja aceitar ou solicitar ajustes.
            </Text>

            <Text style={alertText}>
              ⏰ Responda ao fornecedor o mais breve possível para manter um bom relacionamento.
            </Text>
          </Section>

          {/* Footer */}
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
};

export default QuoteResponseAdminEmail;

// Estilos
const main = {
  backgroundColor: '#f6f6f6',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#DC2626',
  padding: '30px 20px',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
};

const content = {
  padding: '0 40px',
};

const h2 = {
  color: '#1f2937',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '20px 0 10px',
};

const paragraph = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const infoBox = {
  backgroundColor: '#f3f4f6',
  borderLeft: '4px solid #DC2626',
  borderRadius: '4px',
  padding: '20px',
  marginTop: '20px',
  marginBottom: '20px',
};

const priceBox = {
  backgroundColor: '#dcfce7',
  borderLeft: '4px solid #16a34a',
  borderRadius: '4px',
  padding: '20px',
  marginTop: '20px',
  marginBottom: '20px',
};

const infoText = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
};

const pricePrimary = {
  color: '#16a34a',
  fontSize: '18px',
  fontWeight: 'bold',
  lineHeight: '28px',
  margin: '0 0 10px',
};

const priceValue = {
  fontSize: '24px',
};

const alertText = {
  backgroundColor: '#fef3c7',
  borderLeft: '4px solid #f59e0b',
  color: '#92400e',
  fontSize: '14px',
  padding: '12px 16px',
  borderRadius: '4px',
  margin: '20px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#DC2626',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
};
