# Melhorias Futuras - HRX Eventos

Lista organizada de TODOs e melhorias encontradas no código.

## 🔴 Prioridade Alta

### 1. Sistema de Notificações por Email
**Arquivos afetados**: Múltiplos
- [ ] Integrar emails de notificação para cotações aceitas
- [ ] Email para fornecedor quando cotação for aceita
- [ ] Email para fornecedores rejeitados
- [ ] Notificar admin quando nova cotação chegar

**Referências**:
- `src/app/api/suppliers/quotations/[id]/respond/route.ts:139`
- `src/app/api/admin/projects/[id]/quotations/[quotationId]/accept/route.ts:112-115`

### 2. Geolocalização Profissional (Mapbox)
**Status**: ✅ CONCLUÍDO - SPRINT 4
- [x] Implementar Geocoding API para endereços
- [x] Substituir ViaCEP + Haversine por Mapbox
- [x] Implementar Matrix API para cálculo de distâncias
- [x] Criar mapa admin para visualizar profissionais/fornecedores
- [x] Sistema de geocoding em batch automático
- [ ] Integrar Matrix API com sistema de sugestões (opcional)

**Referências**:
- `src/app/api/admin/event-projects/[id]/nearby-professionals/route.ts:53`
- `src/app/api/admin/event-projects/[id]/nearby-suppliers/route.ts:90`

### 3. Executar Migrations no Supabase
**Status**: Código pronto, aguardando execução
- [ ] Migration 020 - Sugestões inteligentes
- [ ] Migration 023 - Atualizar notifications
- [ ] Migration 021 - Funções de notifications (só funções, pular tabelas)
- [ ] Migration 022 - Relatórios e métricas
- [ ] Migration 019 - Reviews (se não existir)

**Ver**: `EXECUTAR_NO_SUPABASE.sql`

## 🟡 Prioridade Média

### 4. Integração Sentry (Logs)
**Arquivo**: `src/lib/logger.ts:132`
- [ ] Configurar Sentry para erros em produção
- [ ] Integrar logger.error() com Sentry
- [ ] Configurar source maps

### 5. Alertas de Segurança
**Arquivo**: `src/lib/logger.ts:153`
- [ ] Integrar com Slack/Discord para alertas críticos
- [ ] Email para admin em eventos de segurança
- [ ] Dashboard de eventos de segurança

### 6. Configurar Redis em Produção
**Status**: Código pronto
- [ ] Criar conta Upstash (free tier)
- [ ] Configurar REDIS_URL em variáveis de ambiente
- [ ] Testar fallback automático
- [ ] Monitorar performance

**Ver**: `REDIS_SETUP.md`

### 7. Remover Código Deprecated
**Arquivos afetados**:
- [ ] `src/types/index.ts:144` - Quote Types (usar EventProject)
- [ ] `src/app/cadastro-profissional/page.tsx:175` - Toggle categoria antigo

## 🟢 Prioridade Baixa

### 8. Reduzir console.log em APIs
**Status**: 219 ocorrências em 52 arquivos
- [ ] Substituir console.log por logger.info/debug
- [ ] Remover console.log de produção
- [ ] Configurar log levels por ambiente

### 9. Cache Warming
**Arquivo**: Novo recurso
- [ ] Implementar pre-warming de dados críticos
- [ ] Cache de categorias ao iniciar app
- [ ] Cache de event_types ao iniciar

### 10. Testes E2E Adicionais
- [ ] Teste de fluxo completo de cotação
- [ ] Teste de sistema de reviews
- [ ] Teste de notificações
- [ ] Teste de relatórios admin

## 📊 SPRINT 4 Proposta (Mapbox)

**Estimativa**: 8 horas

### Task 1: Setup + Geocoding (2h)
- Criar conta Mapbox
- Configurar API keys
- Implementar geocoding automático para endereços
- Migrar de ViaCEP para Mapbox

### Task 2: Mapa Admin (3h)
- Componente React com react-map-gl
- Visualizar profissionais no mapa
- Visualizar fornecedores no mapa
- Filtros por categoria/status

### Task 3: Matrix API (2h)
- Integrar Matrix API para cálculos precisos
- Atualizar função `get_suggested_professionals()`
- Considerar tempo de viagem além de distância

### Task 4: Testes e Ajustes (1h)
- Testar geocoding
- Testar sugestões com Matrix API
- Verificar custos (free tier 100k/mês)

## 🧹 Cleanup Contínuo

- [ ] Documentar APIs faltantes
- [ ] Revisar e atualizar README.md
- [ ] Adicionar comentários em código complexo
- [ ] Remover imports não utilizados
- [ ] Padronizar formatação de código

## 📈 Métricas e Monitoramento

- [ ] Dashboard de performance do Redis
- [ ] Métricas de cache hit rate
- [ ] Monitoramento de rate limiting
- [ ] Alertas quando quotas forem atingidas

## 🔐 Segurança

- [ ] Audit de permissões RLS no Supabase
- [ ] Review de todos os endpoints públicos
- [ ] Implementar CSRF protection
- [ ] Rate limiting mais agressivo para APIs sensíveis

---

**Última atualização**: SPRINT 4 concluído (Mapbox completo!)
**Próximo**: Executar migrations pendentes (#3) ou Sistema de Notificações por Email (#1)
