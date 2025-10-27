/**
 * =====================================================
 * API: Sugestões Inteligentes de Fornecedores
 * =====================================================
 * Usa algoritmo de scoring multi-critério
 * Similar ao sistema de profissionais
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';

interface SuggestedSupplier {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  equipment_types: string[];
  city: string;
  state: string;
  distance_km: number;
  total_score: number;
  distance_score: number;
  equipment_score: number;
  performance_score: number;
  score_breakdown: {
    distance_km: number;
    equipment_match: number;
    equipment_required: number;
    weights: {
      distance: string;
      equipment: string;
      performance: string;
    };
  };
  delivery_radius_km: number;
  shipping_fee_per_km: number;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(ip, RateLimitPresets.API_READ);
    if (!rateLimitResult.success) {
      return NextResponse.json(createRateLimitError(rateLimitResult), {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
        }
      });
    }

    const supabase = await createClient();
    const { id: projectId } = await context.params;

    // Buscar dados do projeto
    const { data: project, error: projectError } = await supabase
      .from('event_projects')
      .select('latitude, longitude, equipment_needed')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    // Validar geolocalização
    if (!project.latitude || !project.longitude) {
      return NextResponse.json(
        {
          success: false,
          error: 'Projeto não possui localização definida. Configure a localização do evento primeiro.',
        },
        { status: 400 }
      );
    }

    // Parâmetros da query (opcionais)
    const searchParams = request.nextUrl.searchParams;
    const maxDistance = parseInt(searchParams.get('max_distance') || '999999'); // SEM LIMITE
    const minScore = parseFloat(searchParams.get('min_score') || '0'); // Mostra TODOS
    const limit = parseInt(searchParams.get('limit') || '100');
    const equipmentTypesParam = searchParams.get('equipment_types'); // "Som,Iluminação"

    // Parse tipos de equipamento
    let requiredEquipmentTypes: string[] | null = null;

    if (equipmentTypesParam) {
      // Veio do query param
      requiredEquipmentTypes = equipmentTypesParam.split(',').map(e => e.trim()).filter(Boolean);
    } else if (project.equipment_needed && Array.isArray(project.equipment_needed)) {
      // Pegar do projeto
      requiredEquipmentTypes = project.equipment_needed.map((item: any) => item.category).filter(Boolean);
    }

    // Chamar função SQL de sugestões inteligentes
    const { data: suggestions, error: suggestionsError } = await supabase.rpc(
      'get_suggested_suppliers',
      {
        p_event_lat: project.latitude,
        p_event_lon: project.longitude,
        p_required_equipment_types: requiredEquipmentTypes,
        p_max_distance_km: maxDistance,
        p_min_score: minScore,
        p_limit: limit,
      }
    );

    if (suggestionsError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar sugestões de fornecedores' },
        { status: 500 }
      );
    }

    // Formatar resposta
    const formattedSuggestions: SuggestedSupplier[] = (suggestions || []).map((supplier: any) => ({
      id: supplier.id,
      company_name: supplier.company_name,
      contact_name: supplier.contact_name,
      email: supplier.email,
      phone: supplier.phone,
      equipment_types: supplier.equipment_types || [],
      city: supplier.city,
      state: supplier.state,
      distance_km: parseFloat(supplier.distance_km || 0),
      total_score: parseFloat(supplier.total_score || 0),
      distance_score: parseFloat(supplier.distance_score || 0),
      equipment_score: parseFloat(supplier.equipment_score || 0),
      performance_score: parseFloat(supplier.performance_score || 0),
      score_breakdown: supplier.score_breakdown,
      delivery_radius_km: supplier.delivery_radius_km || 0,
      shipping_fee_per_km: parseFloat(supplier.shipping_fee_per_km || 0),
    }));

    return NextResponse.json({
      success: true,
      data: {
        suppliers: formattedSuggestions,
        total: formattedSuggestions.length,
        filters: {
          max_distance_km: maxDistance,
          min_score: minScore,
          required_equipment_types: requiredEquipmentTypes,
        },
        project: {
          id: projectId,
          latitude: project.latitude,
          longitude: project.longitude,
          equipment_needed: project.equipment_needed,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
