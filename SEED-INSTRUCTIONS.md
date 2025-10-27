# Instruções para Popular o Banco de Dados

## Arquivos Criados

1. **seed-complete-data.sql** (29KB) - Dados completos para popular o banco
2. **verify-seed-data.sql** - Script de verificação dos dados inseridos

## Dados que Serão Inseridos

### Profissionais (10 profissionais aprovados)
- **Rio de Janeiro**: 5 profissionais
  - João Silva (Elétrica/Iluminação) - Centro
  - Maria Santos (Montagem/Desmontagem) - Copacabana
  - Pedro Oliveira (Segurança) - Barra da Tijuca
  - Ana Costa (Coordenação) - Botafogo
  - Carlos Souza (Som) - Tijuca

- **São Paulo**: 5 profissionais
  - Juliana Lima (Iluminação) - Vila Mariana
  - Roberto Alves (Estruturas/Montagem) - Pinheiros
  - Fernanda Rocha (Audiovisual) - Itaim Bibi
  - Lucas Martins (Elétrica/Som) - Moema
  - Patricia Ferreira (Coordenação/Logística) - Jardins

**Dados completos para cada profissional:**
- CPF, RG, data de nascimento
- Endereço completo com CEP
- Coordenadas GPS (latitude/longitude)
- Telefone e email
- Categorias e subcategorias
- Certificações (NR10, NR35, Bombeiro Civil, Primeiro Socorros)
- Experiência (10-15 anos)
- Disponibilidade completa
- 4 documentos (RG frente/verso, CPF, comprovante)
- 2 fotos de portfólio
- Status: approved
- Data de aprovação: 30 dias atrás

### Fornecedores (5 fornecedores ativos)
1. **SoundPro Eventos** (Rio de Janeiro) - Som e Iluminação
2. **Estruturas Premium** (São Paulo) - Estruturas e Palcos
3. **TechEvent Solutions** (Rio de Janeiro) - Tecnologia e Audiovisual
4. **Mega Eventos RJ** (Rio de Janeiro) - Multiserviços
5. **SP Eventos Premium** (São Paulo) - Multiserviços

**Dados para cada fornecedor:**
- CNPJ, razão social
- Endereço completo com coordenadas GPS
- Telefone, email, WhatsApp
- Tipos de equipamento (JSONB array)
- Precificação detalhada por categoria e item (JSONB)
- Raio de entrega (50-100km)
- Política de entrega e cancelamento
- Status: active

### Projetos (3 eventos completos)

1. **Festival Rock na Praia 2025**
   - Local: Copacabana, RJ
   - Data: 15-17 Fev 2025 (3 dias)
   - Público: 50.000 pessoas
   - Orçamento: R$ 500.000
   - Status: planning
   - Equipe: 5 profissionais alocados
   - Equipamentos: 8 itens

2. **Feira de Tecnologia e Inovação 2025**
   - Local: São Paulo, SP
   - Data: 10-12 Mar 2025 (3 dias)
   - Público: 10.000 pessoas
   - Orçamento: R$ 300.000
   - Status: planning
   - Equipe: 3 profissionais alocados
   - Equipamentos: 6 itens

3. **Casamento Ana & Carlos**
   - Local: Jardim Botânico, RJ
   - Data: 20 Abr 2025 (1 dia)
   - Público: 200 pessoas
   - Orçamento: R$ 80.000
   - Status: planning
   - Equipe: 2 profissionais alocados
   - Equipamentos: 5 itens

## Passo a Passo para Executar

### 1. Acesse o Supabase Dashboard
- Vá para: https://supabase.com/dashboard
- Selecione seu projeto HRX

### 2. Abra o SQL Editor
- No menu lateral, clique em **SQL Editor**
- Clique em **+ New query**

### 3. Execute o Seed
1. Abra o arquivo `seed-complete-data.sql` no seu editor
2. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)
5. Aguarde a execução (pode demorar 10-30 segundos)

### 4. Verifique os Dados
1. Crie uma **+ New query** no SQL Editor
2. Abra o arquivo `verify-seed-data.sql`
3. Copie e cole no SQL Editor
4. Clique em **Run**
5. Você verá várias tabelas de verificação:
   - Contagem de profissionais, fornecedores, projetos
   - Status de aprovação e ativação
   - Integridade dos relacionamentos
   - Detalhes de exemplo

## Resultados Esperados

Após executar `verify-seed-data.sql`, você deve ver:

```
Profissionais: 10 total, 10 aprovados, 10 com documentos, 10 com portfolio, 10 com coordenadas
Fornecedores: 5 total, 5 ativos, 5 com preços, 5 com coordenadas
Projetos: 3 total, 3 em planejamento, 3 com localização
Times de Projeto: 10 alocações (5 confirmados, 3 convidados, 2 planejados)
Equipamentos de Projeto: 19 equipamentos, 19 com fornecedor
```

## Teste no Sistema

Após popular o banco, teste os seguintes fluxos:

### 1. Dashboard do Profissional
- Faça login com um dos usuários profissionais
- Verifique se o dashboard mostra os dados corretamente
- Clique em "Gerenciar Documentos"
- Confirme que o formulário carrega com todos os dados preenchidos
- Verifique se as fotos de documentos e portfólio aparecem

### 2. Dashboard do Cliente (Admin)
- Visualize os projetos criados
- Veja os profissionais alocados em cada projeto
- Confira os equipamentos solicitados

### 3. Busca e Filtros
- Teste buscar profissionais por categoria
- Teste filtros de localização (Rio de Janeiro, São Paulo)
- Teste busca de fornecedores por tipo de equipamento

### 4. Geolocalização
- Verifique se os mapas mostram as coordenadas corretas
- Teste cálculo de distância (se implementado)

## Resolver Problemas

### Se der erro "user_id não encontrado"
Isso significa que os Clerk IDs precisam ser atualizados para usuários reais. Você tem duas opções:

**Opção A: Criar usuários de teste no Clerk**
1. Crie 10 usuários no Clerk com os emails do seed
2. Anote os `clerk_id` gerados
3. Atualize o seed com os IDs reais

**Opção B: Usar usuários existentes**
Execute este SQL para listar seus usuários atuais:
```sql
SELECT clerk_id, email FROM users ORDER BY created_at DESC;
```

Depois, atualize o seed substituindo os `clerk_id` fictícios pelos reais.

### Se der erro de foreign key
Certifique-se de que as constraints de RLS não estão bloqueando as inserções.

### Se alguns dados não aparecerem
Execute as queries individuais do `verify-seed-data.sql` para identificar qual tabela está com problema.

## Limpar os Dados (se necessário)

Se precisar remover os dados e recomeçar:

```sql
-- CUIDADO: Isso apaga TODOS os dados de seed
DELETE FROM project_equipment WHERE event_project_id IN (
  SELECT id FROM event_projects WHERE name LIKE '%2025%'
);

DELETE FROM project_team WHERE event_project_id IN (
  SELECT id FROM event_projects WHERE name LIKE '%2025%'
);

DELETE FROM event_projects WHERE name LIKE '%2025%';

DELETE FROM professionals WHERE clerk_id LIKE 'user_prof_%';

DELETE FROM equipment_suppliers WHERE clerk_id LIKE 'user_supplier_%';

DELETE FROM users WHERE clerk_id LIKE 'user_%';
```

## Próximos Passos

Após popular e verificar:

1. ✅ Teste o fluxo completo de edição de perfil profissional
2. ✅ Verifique se as fotos de documentos carregam corretamente
3. ✅ Teste criação de novos projetos
4. ✅ Teste alocação de profissionais em projetos
5. ✅ Verifique relatórios e dashboards
6. ✅ Teste funcionalidades de busca e filtros
7. ✅ Verifique se geolocalização está funcionando

## Suporte

Se encontrar problemas, verifique:
- Logs do console do navegador (F12)
- Logs do terminal do Next.js
- Logs do Supabase (aba Logs no dashboard)
