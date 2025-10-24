/**
 * GET /api/admin/suppliers/[id]/equipment
 *
 * Retorna os equipamentos cadastrados de um fornecedor específico
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id: supplierId } = await context.params;
    const supabase = await createClient();

    // Buscar equipamentos do fornecedor
    const { data: equipment, error } = await supabase
      .from('supplier_equipment')
      .select('*')
      .eq('supplier_id', supplierId)
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar equipamentos do fornecedor:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar equipamentos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      equipment: equipment || [],
      total: equipment?.length || 0,
    });
  } catch (error) {
    console.error('Erro na API de equipamentos do fornecedor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
