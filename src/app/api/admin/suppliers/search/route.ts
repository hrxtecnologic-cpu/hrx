import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth';
import { logger } from '@/lib/logger';

/**
 * POST /api/admin/suppliers/search
 *
 * Busca avançada de fornecedores com filtros múltiplos
 *
 * Body:
 * {
 *   query?: string,               // Busca textual em todos os campos
 *   status?: 'active' | 'inactive' | 'all',
 *   equipment_types?: string[],   // Filtro por tipos de equipamento
 *   page?: number,                // Paginação (default: 1)
 *   limit?: number                // Limite por página (default: 20)
 * }
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se é admin
    const { isAdmin: userIsAdmin } = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem buscar fornecedores.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      query = '',
      status = 'all',
      equipment_types = [],
      page = 1,
      limit = 20,
    } = body;

    const supabase = await createClient();

    // Construir query base
    let queryBuilder = supabase
      .from('equipment_suppliers')
      .select('*', { count: 'exact' });

    // Filtro de status
    if (status && status !== 'all') {
      queryBuilder = queryBuilder.eq('status', status);
    }

    // Filtro de tipos de equipamento
    if (equipment_types && equipment_types.length > 0) {
      // Usar contains para verificar se algum dos tipos está no array JSONB
      queryBuilder = queryBuilder.contains('equipment_types', equipment_types);
    }

    // Busca textual (usando OR para buscar em múltiplos campos)
    if (query && query.trim()) {
      const searchTerm = `%${query.trim()}%`;

      queryBuilder = queryBuilder.or(
        `company_name.ilike.${searchTerm},` +
        `contact_name.ilike.${searchTerm},` +
        `email.ilike.${searchTerm},` +
        `phone.ilike.${searchTerm}`
      );
    }

    // Ordenação e paginação
    const offset = (page - 1) * limit;
    queryBuilder = queryBuilder
      .order('company_name', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data: suppliers, error, count } = await queryBuilder;

    if (error) {
      logger.error('Erro ao buscar fornecedores', error);
      throw error;
    }

    // Buscar estatísticas de orçamentos para TODOS os fornecedores de uma vez (otimização N+1)
    const supplierIds = (suppliers || []).map(s => s.id);

    let quotationsBySupplier: Record<string, any[]> = {};

    if (supplierIds.length > 0) {
      const { data: allQuotations } = await supabase
        .from('supplier_quotations')
        .select('id, status, total_price, supplier_id')
        .in('supplier_id', supplierIds);

      // Agrupar quotations por supplier_id
      quotationsBySupplier = (allQuotations || []).reduce((acc, quotation) => {
        const supplierId = quotation.supplier_id;
        if (!acc[supplierId]) {
          acc[supplierId] = [];
        }
        acc[supplierId].push(quotation);
        return acc;
      }, {} as Record<string, any[]>);
    }

    // Calcular stats para cada fornecedor usando os dados já carregados
    const suppliersWithStats = (suppliers || []).map((supplier) => {
      const quotations = quotationsBySupplier[supplier.id] || [];

      const total = quotations.length;
      const submitted = quotations.filter(q => ['submitted', 'accepted'].includes(q.status)).length;
      const accepted = quotations.filter(q => q.status === 'accepted').length;
      const rejected = quotations.filter(q => q.status === 'rejected').length;
      const acceptanceRate = submitted > 0 ? Math.round((accepted / submitted) * 100) : 0;

      // Calcular ticket médio dos orçamentos aceitos
      const acceptedQuotations = quotations.filter(q => q.status === 'accepted' && q.total_price);
      const avgTicket = acceptedQuotations.length > 0
        ? acceptedQuotations.reduce((sum, q) => sum + (q.total_price || 0), 0) / acceptedQuotations.length
        : 0;

      return {
        ...supplier,
        stats: {
          totalQuotations: total,
          submittedQuotations: submitted,
          acceptedQuotations: accepted,
          rejectedQuotations: rejected,
          acceptanceRate,
          avgTicket,
        },
      };
    });

    logger.debug('Busca de fornecedores executada', {
      userId,
      query,
      status,
      equipment_types,
      resultsCount: suppliers?.length || 0,
      totalCount: count,
    });

    return NextResponse.json({
      success: true,
      data: suppliersWithStats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Erro na busca de fornecedores', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Erro ao buscar fornecedores' },
      { status: 500 }
    );
  }
}
