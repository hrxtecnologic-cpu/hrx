/**
 * API: Geocodificação em Batch
 *
 * Geocodifica múltiplos profissionais/fornecedores de uma vez
 * Atualiza latitude/longitude automaticamente
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { geocodeAddress } from '@/lib/mapbox-geocoding';
import { logger } from '@/lib/logger';

interface GeocodeResult {
  id: string;
  success: boolean;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ids } = body; // type: 'professionals' | 'suppliers' | 'events'

    if (!type || !ids || !Array.isArray(ids)) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros inválidos. Envie { type, ids }' },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();
    const results: GeocodeResult[] = [];

    // Mapear tipo para tabela
    const tableMap = {
      professionals: 'professionals',
      suppliers: 'equipment_suppliers',
      events: 'event_projects',
    };

    const table = tableMap[type as keyof typeof tableMap];

    if (!table) {
      return NextResponse.json(
        { success: false, error: 'Tipo inválido. Use: professionals, suppliers, events' },
        { status: 400 }
      );
    }

    // Processar cada ID
    for (const id of ids) {
      try {
        // Buscar dados do registro
        let query;
        if (type === 'professionals') {
          query = supabase
            .from(table)
            .select('id, street, number, neighborhood, city, state, cep')
            .eq('id', id)
            .single();
        } else if (type === 'suppliers') {
          query = supabase
            .from(table)
            .select('id, address, city, state, zip_code')
            .eq('id', id)
            .single();
        } else {
          // events
          query = supabase
            .from(table)
            .select('id, venue_name, venue_address, venue_city, venue_state, venue_zip')
            .eq('id', id)
            .single();
        }

        const { data: record, error: fetchError } = await query;

        if (fetchError || !record) {
          results.push({
            id,
            success: false,
            error: 'Registro não encontrado',
          });
          continue;
        }

        // Montar endereço
        let address;
        if (type === 'events') {
          address = {
            street: record.venue_address, // endereço completo
            city: record.venue_city,
            state: record.venue_state,
            zipCode: record.venue_zip,
            country: 'br',
          };
        } else if (type === 'professionals') {
          address = {
            street: record.street,
            number: record.number,
            neighborhood: record.neighborhood,
            city: record.city,
            state: record.state,
            zipCode: record.cep,
            country: 'br',
          };
        } else {
          // suppliers - só tem 'address' (texto completo)
          address = {
            street: record.address,
            city: record.city,
            state: record.state,
            zipCode: record.zip_code,
            country: 'br',
          };
        }

        // Validar se tem cidade/estado
        if (!address.city || !address.state) {
          results.push({
            id,
            success: false,
            error: 'Cidade e estado são obrigatórios',
          });
          continue;
        }

        // Geocodificar
        const geocoded = await geocodeAddress(address);

        if (!geocoded) {
          results.push({
            id,
            success: false,
            error: 'Endereço não encontrado pelo Mapbox',
          });
          continue;
        }

        // Atualizar registro
        const { error: updateError } = await supabase
          .from(table)
          .update({
            latitude: geocoded.latitude,
            longitude: geocoded.longitude,
          })
          .eq('id', id);

        if (updateError) {
          results.push({
            id,
            success: false,
            error: 'Erro ao atualizar coordenadas',
          });
          continue;
        }

        results.push({
          id,
          success: true,
          latitude: geocoded.latitude,
          longitude: geocoded.longitude,
          formattedAddress: geocoded.formattedAddress,
        });

        logger.info('Geocodificação bem-sucedida', {
          type,
          id,
          latitude: geocoded.latitude,
          longitude: geocoded.longitude,
        });

        // Rate limiting: aguardar 100ms entre requisições
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        logger.error('Erro ao geocodificar registro', { type, id, error });
        results.push({
          id,
          success: false,
          error: 'Erro interno ao processar',
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          successful,
          failed,
        },
      },
    });
  } catch (error) {
    logger.error('Erro na API de geocodificação batch', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET: Buscar registros sem coordenadas
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'professionals' | 'suppliers' | 'events'

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Parâmetro type é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // Mapear tipo para tabela
    const tableMap = {
      professionals: 'professionals',
      suppliers: 'equipment_suppliers',
      events: 'event_projects',
    };

    const table = tableMap[type as keyof typeof tableMap];

    if (!table) {
      return NextResponse.json(
        { success: false, error: 'Tipo inválido. Use: professionals, suppliers, events' },
        { status: 400 }
      );
    }

    // Buscar registros sem coordenadas
    let query = supabase.from(table);

    if (type === 'events') {
      query = query.select('id, venue_city, venue_state');
    } else {
      query = query.select('id, city, state');
    }

    const { data, error } = await query
      .or('latitude.is.null,longitude.is.null')
      .limit(100);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar registros' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        type,
        count: data?.length || 0,
        records: data || [],
      },
    });
  } catch (error) {
    logger.error('Erro ao buscar registros sem coordenadas', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
