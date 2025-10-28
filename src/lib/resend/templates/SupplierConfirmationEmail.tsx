import * as React from 'react';
import { EmailFooterDark, HRX_CONTACT_INFO, EMAIL_DARK_STYLES } from './EmailFooterDark';

interface CatalogItem {
  name: string;
  category: string;
  subcategory?: string;
}

interface SupplierConfirmationEmailProps {
  contactName: string;
  companyName: string;
  legalName?: string;
  cnpj?: string;
  email: string;
  phone: string;
  catalogItemsCount: number;
  catalogPreview?: CatalogItem[];
}

export const SupplierConfirmationEmail: React.FC<SupplierConfirmationEmailProps> = ({
  contactName,
  companyName,
  legalName,
  cnpj,
  email,
  phone,
  catalogItemsCount,
  catalogPreview = [],
}) => {
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
            <span className="badge">✅ Cadastro Recebido</span>
          </div>

          {/* Content */}
          <div className="content">
            {/* Success Icon */}
            <div className="highlight-box" style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎉</div>
              <h2 style={{ margin: 0, fontSize: '24px', color: '#22c55e' }}>
                Cadastro Realizado com Sucesso!
              </h2>
            </div>

            {/* Greeting */}
            <h1 style={{ fontSize: '22px', marginBottom: '20px' }}>
              Olá, <strong>{contactName}</strong>!
            </h1>

            <p style={{ color: '#d4d4d8', marginBottom: '30px' }}>
              Recebemos o cadastro da <strong>{companyName}</strong> como fornecedor de equipamentos
              e estamos muito felizes em tê-los conosco! Nossa equipe está analisando todas as
              informações do seu catálogo.
            </p>

            {/* Company Info */}
            <div className="info-box">
              <h2>🏢 Dados da Empresa</h2>
              <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid #27272a' }}>
                <div style={{ fontWeight: 600, color: '#a1a1aa', minWidth: '140px' }}>Nome Fantasia:</div>
                <div style={{ color: '#fafafa' }}><strong>{companyName}</strong></div>
              </div>
              {legalName && (
                <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid #27272a' }}>
                  <div style={{ fontWeight: 600, color: '#a1a1aa', minWidth: '140px' }}>Razão Social:</div>
                  <div style={{ color: '#fafafa' }}>{legalName}</div>
                </div>
              )}
              {cnpj && (
                <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid #27272a' }}>
                  <div style={{ fontWeight: 600, color: '#a1a1aa', minWidth: '140px' }}>CNPJ:</div>
                  <div style={{ color: '#fafafa' }}>{cnpj}</div>
                </div>
              )}
              <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid #27272a' }}>
                <div style={{ fontWeight: 600, color: '#a1a1aa', minWidth: '140px' }}>Email:</div>
                <div style={{ color: '#fafafa' }}>{email}</div>
              </div>
              <div style={{ display: 'flex', padding: '8px 0' }}>
                <div style={{ fontWeight: 600, color: '#a1a1aa', minWidth: '140px' }}>Telefone:</div>
                <div style={{ color: '#fafafa' }}>{phone}</div>
              </div>
            </div>

            {/* Catalog Info */}
            <div className="info-box">
              <h2>📦 Catálogo de Equipamentos</h2>
              <p style={{ marginTop: 0 }}>
                <strong>Total: {catalogItemsCount} itens cadastrados</strong>
              </p>
              {catalogPreview.length > 0 && (
                <div style={{ margin: '10px 0' }}>
                  <p style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>
                    Prévia do catálogo:
                  </p>
                  {catalogPreview.slice(0, 5).map((item, index) => (
                    <div key={index} style={{
                      background: '#18181b',
                      padding: '12px',
                      margin: '8px 0',
                      borderRadius: '4px',
                      borderLeft: '3px solid #ef4444'
                    }}>
                      <div>
                        <strong style={{ color: '#ef4444' }}>{item.name}</strong>
                      </div>
                      <div style={{ fontSize: '13px', color: '#71717a', marginTop: '4px' }}>
                        {item.category} {item.subcategory && `→ ${item.subcategory}`}
                      </div>
                    </div>
                  ))}
                  {catalogItemsCount > 5 && (
                    <p style={{ fontSize: '13px', color: '#71717a', marginTop: '8px', textAlign: 'center' }}>
                      E mais {catalogItemsCount - 5} itens...
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Next Steps */}
            <div className="highlight-box">
              <h3>✅ Próximos Passos</h3>
              <p>
                Nossa equipe irá analisar seu cadastro em até <strong>48 horas úteis</strong>.
              </p>
              <p>Durante a análise, verificaremos:</p>
              <ul style={{ marginTop: '10px' }}>
                <li>Completude das informações do catálogo</li>
                <li>Especificações técnicas dos equipamentos</li>
                <li>Valores e condições comerciais</li>
                <li>Documentação da empresa</li>
              </ul>
              <p style={{ marginTop: '15px' }}>
                <strong>Após a aprovação</strong>, você receberá:
              </p>
              <ul>
                <li>Acesso completo ao painel de fornecedor</li>
                <li>Notificações de solicitações de orçamento</li>
                <li>Sistema de gestão de propostas</li>
                <li>Relatórios de performance</li>
              </ul>
            </div>

            {/* Dashboard Access */}
            <div style={{
              textAlign: 'center',
              margin: '30px 0',
              padding: '20px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              borderRadius: '8px'
            }}>
              <p style={{ color: '#fafafa', margin: '0 0 15px 0' }}>
                Já pode acessar seu dashboard e acompanhar o status da análise:
              </p>
              <a href="https://www.hrxeventos.com.br/supplier/dashboard" style={{
                display: 'inline-block',
                padding: '12px 30px',
                background: '#fafafa',
                color: '#18181b',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '16px'
              }}>
                Acessar Meu Dashboard
              </a>
            </div>

            {/* Contact CTA */}
            <div style={{
              textAlign: 'center',
              padding: '20px',
              background: '#18181b',
              borderRadius: '8px',
              border: '1px solid #27272a'
            }}>
              <p style={{ color: '#a1a1aa', margin: '0 0 10px 0', fontSize: '14px' }}>
                Tem alguma dúvida sobre o processo?
              </p>
              <p style={{ color: '#fafafa', margin: 0 }}>
                Entre em contato: <a href="mailto:atendimento@hrxeventos.com.br" style={{ color: '#ef4444' }}>atendimento@hrxeventos.com.br</a>
              </p>
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
