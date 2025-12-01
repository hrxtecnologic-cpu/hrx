import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const { isAdmin: userIsAdmin, userId } = await isAdmin();

    return NextResponse.json({
      isAdmin: userIsAdmin,
      userId,
    });
  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    return NextResponse.json(
      { isAdmin: false, userId: null },
      { status: 500 }
    );
  }
}
