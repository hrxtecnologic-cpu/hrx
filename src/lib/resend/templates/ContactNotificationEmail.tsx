import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Link,
} from '@react-email/components';

interface ContactNotificationEmailProps {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  submittedAt: string;
}

/**
 * Template de email para notificação de contato recebido (para admin)
 */
export default function ContactNotificationEmail({
  name,
  email,
  phone,
  subject,
  message,
  submittedAt,
}: ContactNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>📬 Novo Contato Recebido</Heading>
          </Section>

          {/* Info Badge */}
          <Section style={alertBox}>
            <Text style={alertText}>
              💬 Uma nova mensagem foi enviada pelo formulário de contato do site
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Dados do Contato */}
          <Section>
            <Heading style={h2}>👤 Informações do Contato</Heading>

            <Text style={label}>Nome:</Text>
            <Text style={value}>{name}</Text>

            <Text style={label}>Email:</Text>
            <Text style={value}>
              <Link href={`mailto:${email}`} style={link}>
                {email}
              </Link>
            </Text>

            <Text style={label}>Telefone:</Text>
            <Text style={value}>
              <Link href={`tel:${phone.replace(/\D/g, '')}`} style={link}>
                {phone}
              </Link>
            </Text>

            <Text style={label}>Assunto:</Text>
            <Text style={value}>{subject}</Text>
          </Section>

          <Hr style={hr} />

          {/* Mensagem */}
          <Section>
            <Heading style={h2}>💬 Mensagem</Heading>
            <Text style={messageBox}>{message}</Text>
          </Section>

          <Hr style={hr} />

          {/* Footer Info */}
          <Section>
            <Text style={footerText}>
              <strong>Data de envio:</strong> {new Date(submittedAt).toLocaleString('pt-BR')}
            </Text>
            <Text style={footerText}>
              <strong>IP/Origem:</strong> Site HRX (formulário público)
            </Text>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Text style={ctaText}>
              🎯 <strong>Ação recomendada:</strong> Responder em até 2 horas durante horário comercial
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section>
            <Text style={footer}>
              Este é um email automático do sistema HRX.
              <br />
              Gerado em: {new Date().toLocaleString('pt-BR')}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 20px',
  backgroundColor: '#dc2626',
  borderRadius: '8px 8px 0 0',
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  textAlign: 'center' as const,
};

const h2 = {
  color: '#1f2937',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
  padding: '0 20px',
};

const alertBox = {
  backgroundColor: '#fef3c7',
  border: '2px solid #fbbf24',
  borderRadius: '8px',
  padding: '16px',
  margin: '20px',
};

const alertText = {
  color: '#78350f',
  fontSize: '14px',
  margin: '0',
  textAlign: 'center' as const,
  fontWeight: '600',
};

const label = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  margin: '16px 20px 4px 20px',
  letterSpacing: '0.5px',
};

const value = {
  color: '#1f2937',
  fontSize: '16px',
  margin: '0 20px 8px 20px',
  padding: '8px 12px',
  backgroundColor: '#f9fafb',
  borderRadius: '4px',
  borderLeft: '3px solid #dc2626',
};

const messageBox = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 20px',
  padding: '16px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  whiteSpace: 'pre-wrap' as const,
};

const link = {
  color: '#dc2626',
  textDecoration: 'underline',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
};

const ctaSection = {
  padding: '16px 20px',
  backgroundColor: '#dbeafe',
  borderRadius: '8px',
  margin: '20px',
};

const ctaText = {
  color: '#1e40af',
  fontSize: '14px',
  margin: '0',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '8px 20px',
};

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '20px',
};
