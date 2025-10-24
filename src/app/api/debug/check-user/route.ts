import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  // 🔒 SECURITY: Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }


  // Tentar buscar o usuário
  const { data, error, count } = await supabase
    .from('users')
    .select('*', { count: 'exact' })
    .eq('clerk_id', userId);


  // Também listar todos os usuários para debug
  const { data: allUsers, count: totalUsers } = await supabase
    .from('users')
    .select('clerk_id, email', { count: 'exact' });


  return NextResponse.json({
    searchedClerkId: userId,
    found: !!data && data.length > 0,
    userData: data,
    error: error,
    totalUsersInDatabase: totalUsers,
    allUsers: allUsers,
  });
}
