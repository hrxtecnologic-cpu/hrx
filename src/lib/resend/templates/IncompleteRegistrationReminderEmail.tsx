import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Section,
  Hr,
  Link,
  Button,
} from '@react-email/components';
import * as React from 'react';
import { HRX_CONTACT_INFO } from './EmailFooter';

interface IncompleteRegistrationReminderEmailProps {
  userName: string;
  userEmail: string;
  userType: 'professional' | 'contractor' | 'supplier' | null;
  hasProfessionalProfile: boolean;
  hasContractorProfile: boolean;
  hasSupplierProfile: boolean;
  hasDocuments: boolean;
}

export const IncompleteRegistrationReminderEmail: React.FC<IncompleteRegistrationReminderEmailProps> = ({
  userName,
  userEmail,
  userType,
  hasProfessionalProfile,
  hasContractorProfile,
  hasSupplierProfile,
  hasDocuments,
}) => {
  // Determinar tipo de cadastro e URL
  let profileType = 'profissional';
  let dashboardUrl = `${HRX_CONTACT_INFO.siteUrl}/dashboard/profissional`;

  if (userType === 'contractor' || hasContractorProfile) {
    profileType = 'contratante';
    dashboardUrl = `${HRX_CONTACT_INFO.siteUrl}/dashboard/contratante`;
  } else if (userType === 'supplier' || hasSupplierProfile) {
    profileType = 'fornecedor';
    dashboardUrl = `${HRX_CONTACT_INFO.siteUrl}/dashboard/fornecedor`;
  }

  // Determinar o que falta
  const needsProfile = !hasProfessionalProfile && !hasContractorProfile && !hasSupplierProfile;
  const needsDocuments = !hasDocuments && (hasProfessionalProfile || hasContractorProfile || hasSupplierProfile);

  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Logo */}
          <Heading style={styles.logo}>HRX</Heading>

          {/* Badge */}
          <Section style={styles.badgeContainer}>
            <Text style={styles.badge}>⚠️ Cadastro Incompleto</Text>
          </Section>

          {/* Title */}
          <Heading style={styles.title}>
            Oi {userName}, notamos que seu cadastro está incompleto
          </Heading>

          {/* Content */}
          <Text style={styles.text}>
            Identificamos que você iniciou seu cadastro na <strong>HRX</strong> como <strong>{profileType}</strong>,
            mas ainda não finalizou. Complete agora para aproveitar todas as funcionalidades da plataforma!
          </Text>

          {/* O que falta */}
          <Section style={styles.missingSection}>
            <Heading style={styles.missingSectionTitle}>📋 O que está faltando?</Heading>

            {needsProfile && (
              <Text style={styles.missingItem}>
                ❌ <strong>Perfil não criado</strong>
                <br />
                <span style={styles.missingDescription}>
                  Você precisa completar seu cadastro com informações pessoais e profissionais.
                </span>
              </Text>
            )}

            {needsDocuments && (
              <Text style={styles.missingItem}>
                ❌ <strong>Documentos não enviados</strong>
                <br />
                <span style={styles.missingDescription}>
                  Envie seus documentos para que possamos aprovar seu cadastro.
                </span>
              </Text>
            )}
          </Section>

          {/* CTA Button */}
          <Section style={styles.ctaSection}>
            <Button href={dashboardUrl} style={styles.button}>
              Completar Cadastro Agora
            </Button>
          </Section>

          {/* Benefits */}
          <Section style={styles.benefits}>
            <Heading style={styles.benefitsTitle}>✨ Benefícios de completar seu cadastro:</Heading>
            <Text style={styles.text}>
              {userType === 'professional' && (
                <>
                  ✅ Receba ofertas de trabalho em eventos
                  <br />
                  ✅ Ganhe dinheiro com sua expertise
                  <br />
                  ✅ Tenha acesso a projetos exclusivos
                  <br />
                  ✅ Gerencie sua agenda de forma profissional
                </>
              )}
              {userType === 'contractor' && (
                <>
                  ✅ Contrate profissionais qualificados
                  <br />
                  ✅ Gerencie seus eventos com facilidade
                  <br />
                  ✅ Receba orçamentos automaticamente
                  <br />
                  ✅ Tenha controle total dos seus projetos
                </>
              )}
              {userType === 'supplier' && (
                <>
                  ✅ Receba solicitações de orçamento
                  <br />
                  ✅ Expanda seu negócio de equipamentos
                  <br />
                  ✅ Gerencie sua disponibilidade
                  <br />
                  ✅ Conecte-se com clientes em potencial
                </>
              )}
              {!userType && (
                <>
                  ✅ Acesse todas as funcionalidades da plataforma
                  <br />
                  ✅ Gerencie seus eventos e projetos
                  <br />
                  ✅ Conecte-se com profissionais e fornecedores
                  <br />
                  ✅ Economize tempo na organização de eventos
                </>
              )}
            </Text>
          </Section>

          {/* Urgency */}
          <Section style={styles.urgency}>
            <Text style={styles.urgencyText}>
              ⏰ <strong>Não perca tempo!</strong> Complete seu cadastro agora e comece a aproveitar
              todos os benefícios da nossa plataforma.
            </Text>
          </Section>

          {/* Contact */}
          <Section style={styles.contact}>
            <Text style={styles.contactTitle}>Precisa de ajuda?</Text>
            <Text style={styles.contactText}>
              Nossa equipe está pronta para ajudar você a completar seu cadastro.
            </Text>
            <Text style={styles.contactInfo}>
              📧 <Link href={`mailto:${HRX_CONTACT_INFO.email}`} style={styles.link}>{HRX_CONTACT_INFO.email}</Link>
              <br />
              📱 <Link href={`https://wa.me/${HRX_CONTACT_INFO.telefoneWhatsApp}`} style={styles.link}>{HRX_CONTACT_INFO.telefone}</Link>
            </Text>
          </Section>

          <Hr style={styles.hr} />

          {/* Footer */}
          <Text style={styles.footer}>
            Este email foi enviado para <strong>{userEmail}</strong>
          </Text>
          <Text style={styles.footer}>
            © {HRX_CONTACT_INFO.ano} {HRX_CONTACT_INFO.nomeEmpresa} - Plataforma de Profissionais para Eventos
          </Text>
          <Text style={styles.footer}>
            <Link href={HRX_CONTACT_INFO.siteUrl} style={styles.footerLink}>{HRX_CONTACT_INFO.site}</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// 🎨 DARK THEME STYLES
const styles = {
  body: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#09090b', // zinc-950
    margin: 0,
    padding: '20px',
  },
  container: {
    backgroundColor: '#18181b', // zinc-900
    border: '1px solid #27272a', // zinc-800
    borderRadius: '12px',
    padding: '40px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  logo: {
    fontSize: '36px',
    fontWeight: 'bold' as const,
    color: '#DC2626', // red-600
    textAlign: 'center' as const,
    marginBottom: '10px',
    letterSpacing: '2px',
  },
  badgeContainer: {
    textAlign: 'center' as const,
    marginBottom: '24px',
  },
  badge: {
    display: 'inline-block',
    backgroundColor: '#fef3c7', // yellow-100
    color: '#92400e', // yellow-900
    padding: '10px 20px',
    borderRadius: '24px',
    fontSize: '14px',
    fontWeight: '600' as const,
  },
  title: {
    color: '#fafafa', // zinc-50
    fontSize: '26px',
    fontWeight: '700' as const,
    marginBottom: '20px',
    lineHeight: '1.3',
  },
  text: {
    color: '#a1a1aa', // zinc-400
    fontSize: '16px',
    lineHeight: '1.7',
    marginBottom: '16px',
  },
  missingSection: {
    backgroundColor: '#27272a', // zinc-800
    border: '1px solid #3f3f46', // zinc-700
    borderRadius: '8px',
    padding: '24px',
    margin: '24px 0',
  },
  missingSectionTitle: {
    color: '#fb923c', // orange-400
    fontSize: '18px',
    fontWeight: '600' as const,
    marginTop: 0,
    marginBottom: '16px',
  },
  missingItem: {
    color: '#fafafa', // zinc-50
    fontSize: '16px',
    marginBottom: '16px',
    lineHeight: '1.6',
  },
  missingDescription: {
    color: '#a1a1aa', // zinc-400
    fontSize: '14px',
    display: 'block',
    marginTop: '6px',
    marginLeft: '24px',
  },
  ctaSection: {
    textAlign: 'center' as const,
    margin: '32px 0',
  },
  button: {
    backgroundColor: '#DC2626', // red-600
    color: '#ffffff',
    padding: '16px 32px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600' as const,
    fontSize: '16px',
    display: 'inline-block',
  },
  benefits: {
    backgroundColor: '#27272a', // zinc-800
    borderLeft: '4px solid #DC2626',
    padding: '24px',
    margin: '24px 0',
    borderRadius: '4px',
  },
  benefitsTitle: {
    color: '#fafafa', // zinc-50
    fontSize: '18px',
    fontWeight: '600' as const,
    marginTop: 0,
    marginBottom: '16px',
  },
  urgency: {
    backgroundColor: '#7c2d12', // red-950
    border: '1px solid #dc2626', // red-600
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
  },
  urgencyText: {
    color: '#fca5a5', // red-300
    fontSize: '15px',
    margin: 0,
    lineHeight: '1.6',
  },
  contact: {
    backgroundColor: '#27272a', // zinc-800
    padding: '20px',
    borderRadius: '8px',
    margin: '24px 0',
  },
  contactTitle: {
    color: '#fafafa', // zinc-50
    fontWeight: '600' as const,
    marginBottom: '8px',
    fontSize: '16px',
  },
  contactText: {
    color: '#a1a1aa', // zinc-400
    fontSize: '14px',
    marginBottom: '12px',
  },
  contactInfo: {
    color: '#a1a1aa', // zinc-400
    fontSize: '14px',
    lineHeight: '1.8',
  },
  link: {
    color: '#DC2626', // red-600
    textDecoration: 'none',
    fontWeight: '500' as const,
  },
  hr: {
    borderColor: '#3f3f46', // zinc-700
    margin: '32px 0 24px',
  },
  footer: {
    textAlign: 'center' as const,
    color: '#71717a', // zinc-500
    fontSize: '13px',
    marginTop: '12px',
    lineHeight: '1.6',
  },
  footerLink: {
    color: '#71717a', // zinc-500
    textDecoration: 'none',
  },
};
