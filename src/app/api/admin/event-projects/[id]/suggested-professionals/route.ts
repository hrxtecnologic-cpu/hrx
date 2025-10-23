/**
 * =====================================================
 * API: Sugestões Inteligentes de Profissionais
 * =====================================================
 * Usa algoritmo de scoring multi-critério
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface SuggestedProfessional {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  categories: string[];
  city: string;
  state: string;
  distance_km: number;
  total_score: number;
  distance_score: number;
  category_score: number;
  experience_score: number;
  availability_score: number;
  performance_score: number;
  score_breakdown: {
    distance_km: number;
    categories_match: number;
    categories_required: number;
    has_availability: boolean;
    weights: {
      distance: string;
      category: string;
      experience: string;
      availability: string;
      performance: string;
    };
  };
  has_experience: boolean;
  years_of_experience: string;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: projectId } = await context.params;

    // Buscar dados do projeto
    const { data: project, error: projectError } = await supabase
      .from('event_projects')
      .select('event_date, latitude, longitude')
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
    const maxDistance = parseInt(searchParams.get('max_distance') || '999999'); // km - SEM LIMITE por padrão
    const minScore = parseFloat(searchParams.get('min_score') || '0'); // 0-100 - Mostra TODOS por padrão
    const limit = parseInt(searchParams.get('limit') || '100'); // Aumentado para 100
    const categoriesParam = searchParams.get('categories'); // "Fotografia,Videomaker"

    // Parse categorias
    const requiredCategories = categoriesParam
      ? categoriesParam.split(',').map(c => c.trim()).filter(Boolean)
      : null;

    // Chamar função SQL de sugestões inteligentes
    const { data: suggestions, error: suggestionsError } = await supabase.rpc(
      'get_suggested_professionals',
      {
        p_event_lat: project.latitude,
        p_event_lon: project.longitude,
        p_event_date: project.event_date,
        p_required_categories: requiredCategories,
        p_max_distance_km: maxDistance,
        p_min_score: minScore,
        p_limit: limit,
      }
    );

    if (suggestionsError) {
      console.error('Erro ao buscar sugestões:', suggestionsError);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar sugestões de profissionais' },
        { status: 500 }
      );
    }

    // Formatar resposta
    const formattedSuggestions: SuggestedProfessional[] = (suggestions || []).map((prof: any) => ({
      id: prof.id,
      full_name: prof.full_name,
      email: prof.email,
      phone: prof.phone,
      categories: prof.categories || [],
      city: prof.city,
      state: prof.state,
      distance_km: parseFloat(prof.distance_km || 0),
      total_score: parseFloat(prof.total_score || 0),
      distance_score: parseFloat(prof.distance_score || 0),
      category_score: parseFloat(prof.category_score || 0),
      experience_score: parseFloat(prof.experience_score || 0),
      availability_score: parseFloat(prof.availability_score || 0),
      performance_score: parseFloat(prof.performance_score || 0),
      score_breakdown: prof.score_breakdown,
      has_experience: prof.has_experience,
      years_of_experience: prof.years_of_experience,
    }));

    return NextResponse.json({
      success: true,
      data: {
        professionals: formattedSuggestions,
        total: formattedSuggestions.length,
        filters: {
          max_distance_km: maxDistance,
          min_score: minScore,
          required_categories: requiredCategories,
        },
        project: {
          id: projectId,
          event_date: project.event_date,
          latitude: project.latitude,
          longitude: project.longitude,
        },
      },
    });
  } catch (error) {
    console.error('Erro na API de sugestões:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
