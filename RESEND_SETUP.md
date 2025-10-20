# Configuração do Resend - Sistema de Emails

Este guia explica como configurar o Resend para envio de emails na plataforma HRX.

## 1. Criar Conta no Resend

1. Acesse [resend.com](https://resend.com)
2. Crie uma conta gratuitamente
3. Confirme seu email

## 2. Obter API Key

1. No dashboard do Resend, vá em **API Keys**
2. Clique em **Create API Key**
3. Dê um nome (ex: "HRX Production")
4. Copie a chave gerada (começa com `re_...`)

## 3. Configurar Domínio (Produção)

> ⚠️ **Nota**: Para desenvolvimento, você pode usar emails de teste do Resend (delivered@resend.dev)

### Para produção com domínio próprio:

1. No Resend Dashboard, vá em **Domains**
2. Clique em **Add Domain**
3. Digite seu domínio (ex: `hrx.com.br`)
4. Configure os registros DNS conforme instruções:
   - **SPF Record** (TXT)
   - **DKIM Records** (TXT)
   - **DMARC Record** (TXT)

5. Aguarde verificação (pode levar até 48h)

## 4. Configurar Variáveis de Ambiente

Adicione ao seu `.env.local`:

```env
# Resend (Sistema de Emails)
RESEND_API_KEY=re_...                    # Sua API key
RESEND_FROM_EMAIL=noreply@hrx.com.br    # Email de envio
RESEND_ADMIN_EMAIL=contato@hrx.com.br   # Email para receber notificações
```

### Valores para Desenvolvimento:

```env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=onboarding@resend.dev  # Email de teste do Resend
RESEND_ADMIN_EMAIL=seu-email@gmail.com   # Seu email pessoal
```

## 5. Emails Implementados

### 5.1. Email de Boas-Vindas (Profissional)

**Enviado quando**: Profissional completa o cadastro

**Template**: `ProfessionalWelcomeEmail`

**Conteúdo**:
- Saudação personalizada
- Confirmação de cadastro recebido
- Timeline do processo (24-48h)
- Próximos passos
- Informações de contato

**Assunto**: `Bem-vindo à HRX, {Nome}! 🎉`

### 5.2. Notificação para Admin

**Enviado quando**: Novo profissional se cadastra

**Template**: `AdminNotificationEmail`

**Conteúdo**:
- Dados completos do profissional
- Categorias selecionadas
- Documentos enviados
- Links para análise no backoffice

**Assunto**: `🆕 Novo Cadastro: {Nome} - {Cidade}/{Estado}`

## 6. Estrutura dos Templates

Os templates são componentes React localizados em:

```
src/lib/resend/
├── client.ts                          # Cliente Resend
├── emails.ts                          # Funções de envio
└── templates/
    ├── ProfessionalWelcomeEmail.tsx   # Boas-vindas
    └── AdminNotificationEmail.tsx     # Notificação admin
```

### Exemplo de uso:

```typescript
import { sendProfessionalWelcomeEmail } from '@/lib/resend/emails';

await sendProfessionalWelcomeEmail({
  professionalName: 'João Silva',
  professionalEmail: 'joao@example.com',
});
```

## 7. Testar Envio de Emails

### 7.1. Via Cadastro Profissional

1. Complete o formulário em `/cadastro-profissional`
2. Submeta o cadastro
3. Verifique os logs do servidor:
   ```
   ✅ Profissional cadastrado: email@exemplo.com
   ✅ Email de boas-vindas enviado para: email@exemplo.com
   ✅ Notificação enviada para admin: contato@hrx.com.br
   ```

### 7.2. Via Resend Dashboard

1. Acesse **Logs** no Resend Dashboard
2. Você verá todos os emails enviados
3. Clique em um email para ver detalhes:
   - Status (sent/delivered/bounced)
   - HTML renderizado
   - Tempo de envio
   - Destinatário

### 7.3. Modo de Teste (sem API Key)

Se o Resend não estiver configurado:

```
⚠️ Resend não configurado. Email não será enviado.
```

O sistema funciona normalmente, mas emails não são enviados.

## 8. Design dos Emails

### Cores utilizadas:

- **Primária**: `#DC2626` (Vermelho HRX)
- **Secundária**: `#EF4444` (Vermelho claro)
- **Background**: `#F9FAFB` (Cinza claro)
- **Texto**: `#333333` (Cinza escuro)

### Componentes visuais:

- ✅ Headers com gradiente vermelho
- ✅ Badges de status
- ✅ Cards com informações
- ✅ Tags de categorias
- ✅ Botões de ação (CTAs)
- ✅ Timeline visual
- ✅ Alertas coloridos

### Responsividade:

Todos os emails são otimizados para:
- Desktop (Outlook, Gmail, etc.)
- Mobile (iOS Mail, Gmail App)
- Webmail (Gmail web, Outlook web)

## 9. Boas Práticas

### 9.1. Evitar Spam

✅ **Fazer**:
- Usar domínio verificado
- Configurar SPF, DKIM, DMARC
- Incluir link de descadastramento (se aplicável)
- Texto alternativo para imagens

❌ **Evitar**:
- Muitas imagens
- Palavras em CAPS
- Muitos links
- Assuntos clickbait

### 9.2. Performance

- Emails são enviados de forma **não-bloqueante**
- Uso de `Promise.then()` ao invés de `await`
- Logs detalhados para debugging
- Graceful degradation se Resend não estiver configurado

### 9.3. Segurança

- API Key armazenada em variável de ambiente
- Nunca expor credenciais no frontend
- Validação de emails antes do envio

## 10. Monitoramento

### Métricas importantes:

1. **Taxa de Entrega** - % de emails entregues
2. **Taxa de Abertura** - % de emails abertos
3. **Taxa de Bounce** - % de emails rejeitados
4. **Tempo de Entrega** - Tempo médio de entrega

### No Resend Dashboard:

- **Analytics** → Veja estatísticas gerais
- **Logs** → Veja emails individuais
- **Webhooks** → Configure notificações de eventos

## 11. Troubleshooting

### Erro: "Resend não configurado"

**Causa**: `RESEND_API_KEY` não está no `.env.local`

**Solução**: Adicione a API key conforme Passo 4

### Emails não estão sendo entregues

**Possíveis causas**:
1. Domínio não verificado (produção)
2. Email de destino inválido
3. Rate limit atingido (plano gratuito: 100 emails/dia)
4. Email marcado como spam

**Solução**:
- Verifique o domínio no Resend
- Teste com email de teste: `delivered@resend.dev`
- Consulte os logs no Resend Dashboard

### Emails vão para spam

**Solução**:
- Verifique se SPF/DKIM/DMARC estão configurados
- Evite palavras spam no assunto
- Adicione texto alternativo
- Peça aos usuários para adicionar aos contatos

### Template não está renderizando

**Causa**: Erro no componente React

**Solução**:
- Verifique os logs do servidor
- Teste o componente localmente
- Valide a sintaxe HTML/CSS inline

## 12. Limites do Plano Gratuito

- ✅ **100 emails/dia**
- ✅ **1 domínio verificado**
- ✅ **API completa**
- ✅ **Logs por 7 dias**
- ✅ **Analytics básico**

Para aumentar, considere upgrade:
- Pro: 50.000 emails/mês
- Business: 100.000+ emails/mês

## 13. Próximas Implementações

- [ ] Email de aprovação de cadastro
- [ ] Email de rejeição de cadastro
- [ ] Email de nova vaga disponível
- [ ] Email de confirmação de trabalho
- [ ] Email de pagamento recebido
- [ ] Newsletter mensal

## 14. Recursos Adicionais

- **Documentação Resend**: [resend.com/docs](https://resend.com/docs)
- **React Email**: [react.email](https://react.email) (templates prontos)
- **Email Testing**: [mail-tester.com](https://www.mail-tester.com)

---

**Documentação criada em**: 2025-10-19
**Última atualização**: 2025-10-19
