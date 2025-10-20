# Guia de Teste - Cadastro Profissional

## 📋 Respostas às suas perguntas:

### 1. É possível testar por aqui?
**Sim, parcialmente.** Posso:
- ✅ Verificar a estrutura dos dados
- ✅ Validar o schema do formulário
- ✅ Verificar se a API está configurada corretamente
- ❌ **NÃO posso**: Fazer upload de arquivos reais (precisa do navegador)

### 2. Para onde o usuário é redirecionado?
Após finalizar com sucesso, o usuário vai para:
**`/cadastro-profissional/sucesso`**

A página mostra:
- ✅ Mensagem de sucesso animada
- 📧 Aviso sobre email de confirmação
- ⏱️ "Análise em até 48 horas úteis"
- 📬 Informações de contato (email + WhatsApp)
- 🏠 Botão "Voltar para Home"

### 3. Emails automáticos estão funcionando?
**✅ SIM!** O sistema envia **2 emails automáticos**:

**Email 1 - Para o Profissional:**
- ✉️ Assunto: "Bem-vindo à HRX, [Nome]! 🎉"
- 📝 Template: `SimpleWelcomeEmail`
- 📤 Enviado para: email do profissional

**Email 2 - Para o Admin:**
- ✉️ Assunto: "🆕 Novo Cadastro: [Nome] - [Cidade]/[Estado]"
- 📝 Template: `AdminNotificationEmail`
- 📤 Enviado para: `hrxtecnologic@gmail.com`
- 📊 Contém todos os dados do cadastro

---

## 🧪 Como Testar Manualmente (Navegador)

### Passo 1: Preparar Dados de Teste
Use esses dados de exemplo:

**Dados Pessoais:**
- Nome: João da Silva Teste
- CPF: 123.456.789-10
- Data Nascimento: 01/01/1990
- Email: seu-email-teste@gmail.com
- Telefone: (21) 99999-9999

**Endereço:**
- CEP: 20040-020 (busca automática)
- Número: 123
- Complemento: Apto 101

**Categorias:**
- Marque: Segurança, Logística/Staff

**Experiência:**
- ☑️ Tenho experiência anterior
- Anos: 3-5
- Descrição: "Trabalhei em mais de 50 eventos de grande porte incluindo shows e festivais."

**Disponibilidade:**
- Marque: Segunda a Sexta, Finais de Semana

**Documentos:**
- Upload qualquer imagem JPG/PNG (será aceito)

**Termos:**
- ☑️ Aceito os termos
- ☑️ Aceito notificações

### Passo 2: Acessar Formulário
```
http://localhost:3000/cadastro-profissional
```

### Passo 3: Preencher e Enviar

### Passo 4: Verificar Sucesso
Você será redirecionado para:
```
http://localhost:3000/cadastro-profissional/sucesso
```

### Passo 5: Verificar no Supabase
1. Acesse Supabase Dashboard
2. Vá em **Table Editor** → `professionals`
3. Deve aparecer novo registro com status `pending`
4. Vá em **Storage** → `professional-documents`
5. Deve ter as fotos/documentos enviados

### Passo 6: Verificar Emails
- Verifique inbox de `seu-email-teste@gmail.com` (email de boas-vindas)
- Verifique inbox de `hrxtecnologic@gmail.com` (notificação admin)
- ⚠️ Pode cair em spam na primeira vez

---

## 🔍 Verificar Status dos Emails

### Via Terminal (depois do cadastro):
Cheque os logs do servidor:
```bash
# Procure por linhas como:
✅ Email de boas-vindas enviado para: joao@email.com (ID: xxx)
✅ Notificação enviada para admin: hrxtecnologic@gmail.com (ID: xxx)
```

### Via Resend Dashboard:
1. Acesse: https://resend.com/emails
2. Login com conta configurada
3. Veja lista de emails enviados
4. Status: "Delivered" = sucesso

---

## 🐛 Troubleshooting

### Email não chega?
- Verificar variável `RESEND_API_KEY` no `.env.local`
- Verificar se domínio foi verificado no Resend
- Checar pasta de spam
- Ver logs do servidor para erros

### Dados não salvam no Supabase?
- Executar `fix-rls-simple.sql` no Supabase
- Verificar `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`
- Ver console do navegador para erros

### Upload falha?
- Verificar bucket `professional-documents` existe
- Verificar bucket está configurado como público
- Arquivo deve ser < 10MB

---

## 📊 Fluxo Completo

```
Usuário preenche formulário
        ↓
Upload de documentos (via /api/upload)
        ↓
Submissão do formulário (via /api/professionals)
        ↓
Validação com Zod
        ↓
Busca user_id no Supabase (via clerk_id)
        ↓
Insere profissional na tabela com status "pending"
        ↓
Envia 2 emails em paralelo (profissional + admin)
        ↓
Redireciona para /cadastro-profissional/sucesso
        ↓
Profissional recebe email de confirmação
        ↓
Admin recebe notificação com todos os dados
```

---

## ✅ Checklist Pré-Teste

- [ ] Servidor rodando (`npm run dev`)
- [ ] Cache limpo (`.next` removido)
- [ ] Navegador com cache limpo (Ctrl+Shift+R)
- [ ] Usuário autenticado no Clerk
- [ ] Usuário tem `userType: professional` no Clerk
- [ ] Variáveis de ambiente configuradas
- [ ] SQL `fix-rls-simple.sql` executado
- [ ] Bucket `professional-documents` existe e é público

---

## 📝 Dados Esperados no Supabase

**Tabela `professionals`:**
```json
{
  "id": "uuid",
  "user_id": "uuid (da tabela users)",
  "clerk_id": "user_xxx",
  "full_name": "João da Silva Teste",
  "cpf": "123.456.789-10",
  "birth_date": "1990-01-01",
  "email": "joao@email.com",
  "phone": "(21) 99999-9999",
  "cep": "20040-020",
  "street": "...",
  "number": "123",
  "city": "Rio de Janeiro",
  "state": "RJ",
  "categories": ["Segurança", "Logística/Staff"],
  "has_experience": true,
  "experience_description": "...",
  "years_of_experience": "3-5",
  "availability": {
    "weekdays": true,
    "weekends": true,
    "holidays": false,
    "night": false,
    "travel": false
  },
  "documents": {
    "rg_front": "https://...",
    "rg_back": "https://...",
    "cpf": "https://..."
  },
  "portfolio": ["https://...", "https://..."],
  "status": "pending",
  "accepts_notifications": true,
  "created_at": "2025-01-20T...",
  "updated_at": "2025-01-20T..."
}
```
