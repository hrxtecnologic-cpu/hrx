import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - List professionals with filters
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    const supabase = await createClient();
    let query = supabase
      .from('professionals')
      .select('id, full_name, email, phone, categories, status')
      .order('full_name', { ascending: true });

    // Filtrar por status se fornecido
    if (status) {
      query = query.eq('status', status);
    }

    const { data: professionals, error } = await query;

    if (error) {
      throw error;
    }

    // Filtrar por categoria no lado do cliente (já que categories é um array JSON)
    let filtered = professionals || [];
    if (category) {
      filtered = filtered.filter(p =>
        p.categories && Array.isArray(p.categories) && p.categories.includes(category)
      );
    }

    return NextResponse.json(filtered);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar profissionais' },
      { status: 500 }
    );
  }
}
