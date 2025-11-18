import { NextResponse } from 'next/server';
import { getRoute } from '@/lib/mapbox-directions';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(ip, RateLimitPresets.PUBLIC_API);
    if (!rateLimitResult.success) return NextResponse.json(createRateLimitError(rateLimitResult), { status: 429 });
    const body = await req.json();
    const { origin, destination, profile } = body;

    if (!origin?.latitude || !origin?.longitude || !destination?.latitude || !destination?.longitude) {
      return NextResponse.json(
        { error: 'Origem e destino com latitude/longitude são obrigatórios' },
        { status: 400 }
      );
    }

    const route = await getRoute(
      { latitude: origin.latitude, longitude: origin.longitude },
      { latitude: destination.latitude, longitude: destination.longitude },
      {
        profile: profile || 'driving',
        geometry: true,
        steps: false
      }
    );

    if (!route) {
      return NextResponse.json(
        { error: 'Erro ao calcular rota' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      route: {
        distance: route.distance,
        duration: route.duration,
        distanceKm: route.distanceKm,
        durationMinutes: route.durationMinutes,
        durationHours: route.durationHours,
        geometry: route.geometry,
        cost: route.distanceKm * 2.5, // R$ 2.50/km padrão
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
