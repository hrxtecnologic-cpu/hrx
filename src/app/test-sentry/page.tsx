'use client';

import { useState } from 'react';

export default function TestSentryPage() {
  const [resultado, setResultado] = useState<string>('');

  const testarErroCliente = () => {
    setResultado('Enviando erro do cliente...');
    try {
      // @ts-ignore - Erro proposital para testar Sentry
      funcaoQueNaoExiste();
    } catch (error) {
      setResultado('❌ Erro enviado para o Sentry! Verifique o dashboard.');
      throw error; // Re-throw para Sentry capturar
    }
  };

  const testarErroServidor = async () => {
    setResultado('Enviando erro do servidor...');
    try {
      const response = await fetch('/api/test-sentry-error');
      const data = await response.json();
      setResultado(data.message || '✅ Resposta recebida');
    } catch (error) {
      setResultado('❌ Erro capturado! Verifique o Sentry.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxWidth: '600px',
        width: '100%'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          marginBottom: '10px',
          color: '#1a202c'
        }}>
          🔍 Teste do Sentry
        </h1>

        <p style={{
          color: '#718096',
          marginBottom: '30px',
          lineHeight: '1.6'
        }}>
          Clique nos botões abaixo para enviar erros de teste para o Sentry.
          Depois verifique no dashboard:
          <a
            href="https://hrx-o6.sentry.io"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#667eea', marginLeft: '5px' }}
          >
            sentry.io
          </a>
        </p>

        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={testarErroCliente}
            style={{
              width: '100%',
              padding: '16px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '15px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#b91c1c'}
            onMouseOut={(e) => e.currentTarget.style.background = '#dc2626'}
          >
            🖥️ Testar Erro no Cliente (Browser)
          </button>

          <button
            onClick={testarErroServidor}
            style={{
              width: '100%',
              padding: '16px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#1d4ed8'}
            onMouseOut={(e) => e.currentTarget.style.background = '#2563eb'}
          >
            ⚙️ Testar Erro no Servidor (API)
          </button>
        </div>

        {resultado && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            background: resultado.includes('✅') ? '#d1fae5' : '#fee2e2',
            border: resultado.includes('✅') ? '1px solid #10b981' : '1px solid #ef4444',
            borderRadius: '8px',
            color: '#1a202c',
            fontWeight: '500'
          }}>
            {resultado}
          </div>
        )}

        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: '#f7fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '10px',
            color: '#1a202c'
          }}>
            📋 Como verificar:
          </h3>
          <ol style={{
            color: '#4a5568',
            lineHeight: '1.8',
            paddingLeft: '20px',
            margin: 0
          }}>
            <li>Clique em um dos botões acima</li>
            <li>Aguarde 5-10 segundos</li>
            <li>Acesse <a href="https://hrx-o6.sentry.io/issues/" target="_blank" style={{ color: '#667eea' }}>Issues do Sentry</a></li>
            <li>Você verá os erros listados lá</li>
          </ol>
        </div>

        <div style={{
          marginTop: '20px',
          textAlign: 'center'
        }}>
          <a
            href="/"
            style={{
              color: '#718096',
              textDecoration: 'none',
              fontSize: '14px'
            }}
          >
            ← Voltar para home
          </a>
        </div>
      </div>
    </div>
  );
}
