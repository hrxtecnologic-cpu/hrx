import * as React from 'react';
import { HRX_CONTACT_INFO } from './EmailFooter';

interface AdminNotificationEmailProps {
  professionalName: string;
  professionalEmail: string;
  professionalPhone: string;
  professionalCPF: string;
  categories: string[];
  hasExperience: boolean;
  yearsOfExperience?: string;
  city: string;
  state: string;
  documentsUploaded: string[];
  professionalId: string;
}

export const AdminNotificationEmail: React.FC<AdminNotificationEmailProps> = ({
  professionalName,
  professionalEmail,
  professionalPhone,
  professionalCPF,
  categories,
  hasExperience,
  yearsOfExperience,
  city,
  state,
  documentsUploaded,
  professionalId,
}) => (
  <html>
    <head>
      <style>{`
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 700px;
          margin: 0 auto;
          padding: 20px;
          background: #f9fafb;
        }
        .container {
          background: #ffffff;
          border-radius: 8px;
          padding: 40px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%);
          color: white;
          padding: 30px;
          border-radius: 8px 8px 0 0;
          margin: -40px -40px 30px -40px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .badge {
          display: inline-block;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 10px;
        }
        .section {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #DC2626;
        }
        .section h2 {
          color: #1a1a1a;
          font-size: 18px;
          margin-top: 0;
          margin-bottom: 15px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin: 15px 0;
        }
        .info-item {
          background: white;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }
        .info-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .info-value {
          color: #1a1a1a;
          font-size: 16px;
          font-weight: 500;
        }
        .categories {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 10px 0;
        }
        .category-tag {
          background: #fee2e2;
          color: #DC2626;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
        }
        .documents {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          padding: 15px;
          border-radius: 6px;
          margin: 10px 0;
        }
        .documents ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        .documents li {
          color: #166534;
          margin: 5px 0;
        }
        .action-buttons {
          text-align: center;
          margin: 30px 0;
        }
        .button {
          display: inline-block;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 0 10px;
        }
        .button-primary {
          background: #DC2626;
          color: #ffffff;
        }
        .button-secondary {
          background: #f3f4f6;
          color: #1a1a1a;
          border: 1px solid #d1d5db;
        }
        .alert {
          background: #fef3c7;
          border: 1px solid #fde047;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .alert-title {
          color: #854d0e;
          font-weight: 600;
          margin-bottom: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
      `}</style>
    </head>
    <body>
      <div className="container">
        {/* Header */}
        <div className="header">
          <h1>🆕 Novo Cadastro Profissional</h1>
          <span className="badge">ID: {professionalId}</span>
        </div>

        {/* Alert */}
        <div className="alert">
          <div className="alert-title">⚠️ Ação Necessária</div>
          <div>Este cadastro precisa ser analisado e aprovado no painel administrativo.</div>
        </div>

        {/* Dados Pessoais */}
        <div className="section">
          <h2>👤 Dados Pessoais</h2>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Nome Completo</div>
              <div className="info-value">{professionalName}</div>
            </div>
            <div className="info-item">
              <div className="info-label">CPF</div>
              <div className="info-value">{professionalCPF}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Email</div>
              <div className="info-value">{professionalEmail}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Telefone</div>
              <div className="info-value">{professionalPhone}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Localização</div>
              <div className="info-value">{city} - {state}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Experiência</div>
              <div className="info-value">
                {hasExperience ? `Sim - ${yearsOfExperience || 'N/A'}` : 'Não'}
              </div>
            </div>
          </div>
        </div>

        {/* Categorias */}
        <div className="section">
          <h2>🎯 Categorias de Interesse</h2>
          <div className="categories">
            {categories.map((category, index) => (
              <span key={index} className="category-tag">{category}</span>
            ))}
          </div>
        </div>

        {/* Documentos */}
        <div className="section">
          <h2>📄 Documentos Enviados</h2>
          <div className="documents">
            <strong>✓ {documentsUploaded.length} documentos recebidos:</strong>
            <ul>
              {documentsUploaded.map((doc, index) => (
                <li key={index}>{doc}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <a href={`${HRX_CONTACT_INFO.siteUrl}/admin/profissionais/${professionalId}`} className="button button-primary">
            Analisar Cadastro
          </a>
          <a href={`${HRX_CONTACT_INFO.siteUrl}/admin/profissionais`} className="button button-secondary">
            Ver Todos os Cadastros
          </a>
        </div>

        {/* Footer */}
        <div className="footer">
          <p>📧 Sistema de Notificações {HRX_CONTACT_INFO.nomeEmpresa}</p>
          <p style={{ marginTop: '5px', fontSize: '12px' }}>
            {HRX_CONTACT_INFO.site}
          </p>
          <p style={{ marginTop: '5px', fontSize: '12px' }}>
            Este email é apenas para administradores da plataforma.
          </p>
        </div>
      </div>
    </body>
  </html>
);
