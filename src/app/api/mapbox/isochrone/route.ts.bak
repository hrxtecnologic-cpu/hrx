import { NextResponse } from 'next/server';
import { getIsochrone } from '@/lib/mapbox-isochrone';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { latitude, longitude, minutes, profile } = body;

    if (!latitude || !longitude || !minutes) {
      return NextResponse.json(
        { error: 'Latitude, longitude e minutes são obrigatórios' },
        { status: 400 }
      );
    }

    const isochrone = await getIsochrone(
      { latitude, longitude },
      { minutes, profile: profile || 'driving' }
    );

    if (!isochrone) {
      return NextResponse.json(
        { error: 'Erro ao calcular isochrone' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      polygon: isochrone.polygon,
      minutes: isochrone.minutes,
      center: isochrone.center,
    });
  } catch (error: any) {
    console.error('Erro na API de isochrone:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
