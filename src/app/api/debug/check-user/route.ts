import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  console.log('🔍 Buscando usuário com clerk_id:', userId);

  // Tentar buscar o usuário
  const { data, error, count } = await supabase
    .from('users')
    .select('*', { count: 'exact' })
    .eq('clerk_id', userId);

  console.log('📊 Resultado da query:', { data, error, count });

  // Também listar todos os usuários para debug
  const { data: allUsers, count: totalUsers } = await supabase
    .from('users')
    .select('clerk_id, email', { count: 'exact' });

  console.log('📋 Total de usuários no banco:', totalUsers);
  console.log('📋 Usuários:', allUsers);

  return NextResponse.json({
    searchedClerkId: userId,
    found: !!data && data.length > 0,
    userData: data,
    error: error,
    totalUsersInDatabase: totalUsers,
    allUsers: allUsers,
  });
}
