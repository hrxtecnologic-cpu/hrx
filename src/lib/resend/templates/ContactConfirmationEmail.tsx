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
import { HRX_CONTACT_INFO } from './EmailFooter';

interface ContactConfirmationEmailProps {
  name: string;
  subject: string;
}

/**
 * Template de email de confirmação para quem enviou o contato
 */
export default function ContactConfirmationEmail({
  name,
  subject,
}: ContactConfirmationEmailProps) {
  const firstName = name.split(' ')[0];

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>HRX Profissionais</Heading>
            <Text style={tagline}>Conectando eventos a profissionais qualificados</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={h2}>Olá, {firstName}! 👋</Heading>

            <Text style={text}>
              Recebemos sua mensagem com sucesso e agradecemos por entrar em contato conosco.
            </Text>

            <Section style={infoBox}>
              <Text style={infoText}>
                <strong>Assunto:</strong> {subject}
              </Text>
            </Section>

            <Text style={text}>
              Nossa equipe irá analisar sua solicitação e responderemos em breve. Nosso prazo de
              resposta é de até <strong>2 horas durante horário comercial</strong> (Segunda a
              Sexta, 9h às 18h).
            </Text>

            <Text style={text}>
              Se a sua solicitação for urgente, você também pode entrar em contato pelos seguintes
              canais:
            </Text>

            <Section style={contactBox}>
              <Text style={contactItem}>
                🌐 <strong>Site:</strong>{' '}
                <Link href={HRX_CONTACT_INFO.siteUrl} style={link}>
                  {HRX_CONTACT_INFO.site}
                </Link>
              </Text>
              <Text style={contactItem}>
                📱 <strong>WhatsApp:</strong>{' '}
                <Link href={`https://wa.me/${HRX_CONTACT_INFO.telefoneWhatsApp}`} style={link}>
                  {HRX_CONTACT_INFO.telefone}
                </Link>
              </Text>
              <Text style={contactItem}>
                📧 <strong>Email:</strong>{' '}
                <Link href={`mailto:${HRX_CONTACT_INFO.email}`} style={link}>
                  {HRX_CONTACT_INFO.email}
                </Link>
              </Text>
            </Section>

            <Hr style={hr} />

            <Text style={text}>
              <strong>Precisa de uma equipe para seu evento?</strong>
              <br />
              Preencha nosso formulário de solicitação e receba uma proposta personalizada:
            </Text>

            <Section style={ctaSection}>
              <Link href={`${HRX_CONTACT_INFO.siteUrl}/solicitar-equipe`} style={button}>
                Solicitar Equipe Agora
              </Link>
            </Section>

            <Text style={text}>
              <strong>É um profissional buscando oportunidades?</strong>
              <br />
              Cadastre-se em nossa plataforma e tenha acesso a vagas em eventos:
            </Text>

            <Section style={ctaSection}>
              <Link href={`${HRX_CONTACT_INFO.siteUrl}/cadastrar-profissional`} style={buttonSecondary}>
                Cadastrar como Profissional
              </Link>
            </Section>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              <strong>{HRX_CONTACT_INFO.nomeEmpresa}</strong>
              <br />
              Conectando eventos a profissionais qualificados
              <br />
              <br />
              📧 {HRX_CONTACT_INFO.email}
              <br />
              📱 {HRX_CONTACT_INFO.telefone}
              <br />
              <br />
              <Link href={HRX_CONTACT_INFO.siteUrl} style={link}>
                {HRX_CONTACT_INFO.site}
              </Link>
              <br />
              <br />
              © {HRX_CONTACT_INFO.ano} {HRX_CONTACT_INFO.nomeEmpresa} - Plataforma de Profissionais para Eventos
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
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const header = {
  padding: '32px 20px',
  backgroundColor: '#dc2626',
  borderRadius: '8px 8px 0 0',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const tagline = {
  color: '#fecaca',
  fontSize: '14px',
  margin: '0',
};

const content = {
  padding: '32px 20px',
};

const h2 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 20px 0',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const infoBox = {
  backgroundColor: '#dbeafe',
  border: '1px solid #93c5fd',
  borderRadius: '8px',
  padding: '16px',
  margin: '20px 0',
};

const infoText = {
  color: '#1e40af',
  fontSize: '15px',
  margin: '0',
};

const contactBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
};

const contactItem = {
  color: '#374151',
  fontSize: '15px',
  margin: '8px 0',
};

const link = {
  color: '#dc2626',
  textDecoration: 'underline',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const button = {
  backgroundColor: '#dc2626',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
  margin: '8px 0',
};

const buttonSecondary = {
  backgroundColor: '#ffffff',
  border: '2px solid #dc2626',
  borderRadius: '6px',
  color: '#dc2626',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
  margin: '8px 0',
};

const footer = {
  padding: '20px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '20px',
};
