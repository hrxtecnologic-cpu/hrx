import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Section,
  Hr,
} from '@react-email/components';
import * as React from 'react';

interface SimpleWelcomeEmailProps {
  professionalName: string;
  professionalEmail: string;
}

export const SimpleWelcomeEmail: React.FC<SimpleWelcomeEmailProps> = ({
  professionalName,
  professionalEmail,
}) => (
  <Html>
    <Head />
    <Body style={styles.body}>
      <Container style={styles.container}>
        {/* Logo */}
        <Heading style={styles.logo}>HRX</Heading>

        {/* Badge */}
        <Section style={styles.badgeContainer}>
          <Text style={styles.badge}>✓ Cadastro Recebido</Text>
        </Section>

        {/* Title */}
        <Heading style={styles.title}>
          Bem-vindo à HRX, {professionalName}! 🎉
        </Heading>

        {/* Content */}
        <Text style={styles.text}>
          Ficamos muito felizes em tê-lo(a) conosco! Seu cadastro foi recebido com
          sucesso e agora está em análise pela nossa equipe.
        </Text>

        {/* Timeline */}
        <Section style={styles.timeline}>
          <Heading style={styles.timelineTitle}>📋 O que acontece agora?</Heading>

          <Text style={styles.timelineItem}>
            <strong>1. Análise de Documentos (24-48h)</strong>
            <br />
            <span style={styles.timelineDescription}>
              Nossa equipe irá verificar seus documentos e certificações.
            </span>
          </Text>

          <Text style={styles.timelineItem}>
            <strong>2. Aprovação do Cadastro</strong>
            <br />
            <span style={styles.timelineDescription}>
              Você receberá um email confirmando a aprovação.
            </span>
          </Text>

          <Text style={styles.timelineItem}>
            <strong>3. Comece a Trabalhar!</strong>
            <br />
            <span style={styles.timelineDescription}>
              Assim que aprovado, você começará a receber ofertas de trabalho.
            </span>
          </Text>
        </Section>

        {/* Next Steps */}
        <Section style={styles.nextSteps}>
          <Heading style={styles.nextStepsTitle}>✅ Próximos Passos</Heading>
          <Text style={styles.text}>
            • Aguarde nosso email de confirmação
            <br />
            • Mantenha seu WhatsApp ativo para receber notificações
            <br />
            • Prepare-se para receber suas primeiras oportunidades
          </Text>
        </Section>

        {/* Contact */}
        <Section style={styles.contact}>
          <Text style={styles.contactTitle}>Precisa de ajuda?</Text>
          <Text style={styles.text}>
            📧 Email: hrxtecnologic@gmail.com
            <br />
            📱 WhatsApp: (21) 99999-9999
          </Text>
        </Section>

        <Hr style={styles.hr} />

        {/* Footer */}
        <Text style={styles.footer}>
          Este email foi enviado para <strong>{professionalEmail}</strong>
        </Text>
        <Text style={styles.footer}>
          © 2025 HRX - Plataforma de Profissionais para Eventos
        </Text>
      </Container>
    </Body>
  </Html>
);

const styles = {
  body: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f9fafb',
    margin: 0,
    padding: '20px',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '40px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  logo: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#DC2626',
    textAlign: 'center' as const,
    marginBottom: '10px',
  },
  badgeContainer: {
    textAlign: 'center' as const,
    marginBottom: '20px',
  },
  badge: {
    display: 'inline-block',
    backgroundColor: '#fee2e2',
    color: '#DC2626',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
  },
  title: {
    color: '#1a1a1a',
    fontSize: '24px',
    marginBottom: '20px',
  },
  text: {
    color: '#4a5568',
    fontSize: '16px',
    lineHeight: '1.6',
    marginBottom: '15px',
  },
  timeline: {
    backgroundColor: '#fef2f2',
    padding: '20px',
    borderRadius: '8px',
    margin: '20px 0',
  },
  timelineTitle: {
    color: '#DC2626',
    fontSize: '18px',
    marginTop: 0,
  },
  timelineItem: {
    color: '#1a1a1a',
    fontSize: '16px',
    marginBottom: '15px',
  },
  timelineDescription: {
    color: '#4a5568',
    fontSize: '14px',
    marginLeft: '20px',
  },
  nextSteps: {
    backgroundColor: '#f9fafb',
    borderLeft: '4px solid #DC2626',
    padding: '20px',
    margin: '20px 0',
  },
  nextStepsTitle: {
    color: '#1a1a1a',
    fontSize: '18px',
    marginTop: 0,
  },
  contact: {
    backgroundColor: '#f9fafb',
    padding: '15px',
    borderRadius: '6px',
    margin: '20px 0',
  },
  contactTitle: {
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  hr: {
    borderColor: '#e5e7eb',
    margin: '40px 0 20px',
  },
  footer: {
    textAlign: 'center' as const,
    color: '#6b7280',
    fontSize: '14px',
    marginTop: '10px',
  },
};
