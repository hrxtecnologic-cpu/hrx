/**
 * =====================================================
 * API: Importação em Massa (CSV)
 * =====================================================
 * Importa profissionais, clientes ou fornecedores via CSV
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { withAdmin } from '@/lib/api';
import { geocodeAddress } from '@/lib/mapbox-geocoding';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';

export const POST = withAdmin(async (userId: string, request: NextRequest) => {
  try {
    // ========== Rate Limiting ==========
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(ip, RateLimitPresets.API_WRITE);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitError(rateLimitResult),
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          }
        }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 });
    }

    if (!type || !['profissionais', 'clientes', 'fornecedores'].includes(type)) {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }

    // Ler conteúdo do CSV
    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV vazio ou inválido' },
        { status: 400 }
      );
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1);

    const supabase = await createAdminClient();
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Processar cada linha
    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2; // +2 porque: +1 para índice e +1 para header
      const row = rows[i];

      if (!row.trim()) continue;

      try {
        const values = row.split(',').map(v => v.trim().replace(/^"|"$/g, '')); // Remove aspas
        const record: Record<string, string> = {};

        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });

        // Processar baseado no tipo
        if (type === 'profissionais') {
          await importProfessional(supabase, record, userId);
        } else if (type === 'clientes') {
          await importClient(supabase, record, userId);
        } else if (type === 'fornecedores') {
          await importSupplier(supabase, record, userId);
        }

        results.success++;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.failed++;
        results.errors.push(`Linha ${rowNumber}: ${errorMessage}`);
      }
    }

    return NextResponse.json(results);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[bulk-import] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar arquivo', details: errorMessage },
      { status: 500 }
    );
  }
});

interface SupabaseClient {
  from: (table: string) => {
    select: (columns: string) => {
      or: (condition: string) => {
        limit: (count: number) => {
          maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
        };
      };
      eq: (column: string, value: string) => {
        limit: (count: number) => {
          maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
        };
      };
    };
    insert: (data: Record<string, unknown>) => Promise<{ error: unknown }>;
  };
}

async function importProfessional(supabase: SupabaseClient, record: Record<string, string>, userId: string) {
  const cpf = record.cpf?.replace(/\D/g, '');
  const phone = record.phone?.replace(/\D/g, '');
  const cep = record.cep?.replace(/\D/g, '');

  // Parse categories (JSON array string)
  let categories = [];
  try {
    categories = JSON.parse(record.categories || '[]');
  } catch {
    // Se não for JSON, tentar split por vírgula
    categories = record.categories?.split(',').map(c => c.trim()).filter(Boolean) || [];
  }

  // Verificar duplicado
  const { data: existing } = await supabase
    .from('professionals')
    .select('id')
    .or(`cpf.eq.${cpf},email.eq.${record.email}`)
    .limit(1)
    .maybeSingle();

  if (existing) {
    throw new Error(`Profissional já existe (CPF ou email duplicado)`);
  }

  // Parse availability
  const availability = {
    weekdays: record.weekdays === 'true',
    weekends: record.weekends === 'true',
    holidays: record.holidays === 'true',
    night: record.night === 'true',
    travel: record.travel === 'true',
  };

  // Fazer geocoding do endereço
  let latitude = null;
  let longitude = null;

  try {
    const geocoded = await geocodeAddress({
      street: record.street,
      number: record.number,
      city: record.city,
      state: record.state,
      zipCode: cep,
      country: 'br',
    });

    if (geocoded) {
      latitude = geocoded.latitude;
      longitude = geocoded.longitude;
    }
  } catch (geocodeError) {
    console.error('[import-professional] Erro ao geocodificar:', geocodeError);
  }

  const { error } = await supabase.from('professionals').insert({
    full_name: record.full_name,
    cpf,
    birth_date: record.birth_date || null,
    email: record.email,
    phone,
    cep,
    street: record.street,
    number: record.number,
    complement: record.complement || null,
    neighborhood: record.neighborhood,
    city: record.city,
    state: record.state?.toUpperCase(),
    latitude,
    longitude,
    categories,
    subcategories: {},
    certifications: {},
    has_experience: record.has_experience === 'true',
    years_of_experience: record.years_of_experience || null,
    experience_description: record.experience_description || null,
    availability,
    service_radius_km: parseInt(record.service_radius_km || '50'),
    status: 'approved',
    documents: {},
    portfolio: [],
  });

  if (error) throw error;
}

async function importClient(supabase: SupabaseClient, record: Record<string, string>, userId: string) {
  // Project number será gerado automaticamente pelo trigger
  const phone = record.client_phone?.replace(/\D/g, '');
  const cnpj = record.client_cnpj?.replace(/\D/g, '') || null;

  // Fazer geocoding do endereço do evento
  let latitude = null;
  let longitude = null;

  try {
    const geocoded = await geocodeAddress({
      street: record.venue_address,
      city: record.venue_city,
      state: record.venue_state,
      zipCode: record.venue_zip,
      country: 'br',
    });

    if (geocoded) {
      latitude = geocoded.latitude;
      longitude = geocoded.longitude;
      console.log('[import-client] Geocoding bem-sucedido:', {
        address: record.venue_address,
        city: record.venue_city,
        latitude,
        longitude,
      });
    } else {
      console.warn('[import-client] Não foi possível geocodificar o endereço:', {
        address: record.venue_address,
        city: record.venue_city,
      });
    }
  } catch (geocodeError) {
    console.error('[import-client] Erro ao geocodificar:', geocodeError);
    // Continua o import mesmo sem geocoding
  }

  // Cliente apenas fornece os dados do evento e orçamento
  // HRX Admin irá adicionar profissionais e equipamentos depois
  const { error } = await supabase.from('event_projects').insert({
    client_name: record.client_name,
    client_email: record.client_email,
    client_phone: phone,
    client_company: record.client_company || null,
    client_cnpj: cnpj,
    event_name: record.event_name,
    event_type: record.event_type,
    event_description: record.event_description || null,
    event_date: record.event_date || null,
    start_time: record.start_time || null,
    end_time: record.end_time || null,
    expected_attendance: record.expected_attendance ? parseInt(record.expected_attendance) : null,
    venue_name: record.venue_name || null,
    venue_address: record.venue_address,
    venue_city: record.venue_city,
    venue_state: record.venue_state?.toUpperCase(),
    venue_zip: record.venue_zip?.replace(/\D/g, '') || null,
    latitude,
    longitude,
    budget_range: record.budget_range || null,
    client_budget: record.client_budget ? parseFloat(record.client_budget) : null,
    is_urgent: record.is_urgent === 'true',
    additional_notes: record.additional_notes || null,
    profit_margin: 20, // Margem padrão, admin pode ajustar depois
    status: 'new',
    created_by: userId,
  });

  if (error) throw error;
}

async function importSupplier(supabase: SupabaseClient, record: Record<string, string>, userId: string) {
  const cnpj = record.cnpj?.replace(/\D/g, '');
  const phone = record.phone?.replace(/\D/g, '');
  const zip_code = record.zip_code?.replace(/\D/g, '');

  // Parse equipment_types (JSON array string)
  let equipment_types = [];
  try {
    equipment_types = JSON.parse(record.equipment_types || '[]');
  } catch {
    // Se não for JSON, tentar split por vírgula
    equipment_types = record.equipment_types?.split(',').map(t => t.trim()).filter(Boolean) || [];
  }

  // Verificar duplicado
  const { data: existing } = await supabase
    .from('equipment_suppliers')
    .select('id')
    .or(`email.eq.${record.email}${cnpj ? `,cnpj.eq.${cnpj}` : ''}`)
    .limit(1)
    .maybeSingle();

  if (existing) {
    throw new Error(`Fornecedor já existe (email ou CNPJ duplicado)`);
  }

  // Fazer geocoding do endereço
  let latitude = null;
  let longitude = null;

  try {
    const geocoded = await geocodeAddress({
      street: record.address,
      city: record.city,
      state: record.state,
      zipCode: zip_code,
      country: 'br',
    });

    if (geocoded) {
      latitude = geocoded.latitude;
      longitude = geocoded.longitude;
    }
  } catch (geocodeError) {
    console.error('[import-supplier] Erro ao geocodificar:', geocodeError);
  }

  const { error } = await supabase.from('equipment_suppliers').insert({
    company_name: record.company_name,
    legal_name: record.legal_name || record.company_name,
    contact_name: record.contact_name,
    email: record.email,
    phone,
    cnpj,
    address: record.address || null,
    city: record.city || null,
    state: record.state?.toUpperCase() || null,
    zip_code,
    latitude,
    longitude,
    equipment_types,
    equipment_catalog: [],
    delivery_radius_km: record.delivery_radius_km ? parseInt(record.delivery_radius_km) : 50,
    shipping_fee_per_km: record.shipping_fee_per_km ? parseFloat(record.shipping_fee_per_km) : 0,
    status: 'active',
  });

  if (error) throw error;
}

// Configurar para aceitar até 10MB
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
