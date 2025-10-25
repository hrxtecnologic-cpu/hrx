import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log('\n🧪 [TEST MODE] Cadastro Profissional (sem Clerk)');
    console.log('📦 Dados recebidos:', JSON.stringify(body, null, 2));

    // 1. Criar user de teste com UUID válido
    const testUserId = randomUUID();
    const testUser = {
      id: testUserId,
      clerk_id: `user_test_${Date.now()}`,
      email: body.email,
      full_name: body.fullName,
      user_type: 'professional',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('👤 Criando user de teste:', testUser);

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single();

    if (userError) {
      console.error('❌ Erro ao criar user:', userError);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    console.log('✅ User criado:', user);

    // 2. Criar perfil professional
    // Gerar CPF único para teste (formato válido mas fictício)
    const timestamp = Date.now().toString();
    const uniqueCpf = `999.${timestamp.slice(-6, -3)}.${timestamp.slice(-3)}-99`;

    const professional = {
      user_id: user.id,
      clerk_id: user.clerk_id,
      email: body.email,
      full_name: body.fullName,
      cpf: uniqueCpf,
      birth_date: body.birthDate,
      phone: body.phone,
      cep: body.cep,
      street: body.street,
      number: body.number,
      complement: body.complement,
      neighborhood: body.neighborhood,
      city: body.city,
      state: body.state,
      categories: body.categories,
      has_experience: body.hasExperience,
      experience_description: body.experienceDescription,
      years_of_experience: body.yearsOfExperience,
      availability: body.availability,
      status: 'pending',
      accepts_notifications: body.acceptsNotifications,
      documents: body.documents || {},
      portfolio: body.portfolio || [],
      subcategories: body.subcategories || {},
      certifications: body.certifications || {},
      latitude: body.latitude,
      longitude: body.longitude,
      // Campos de validade das certificações
      cnh_number: body.cnh_number,
      cnh_validity: body.cnh_validity,
      cnv_validity: body.cnv_validity,
      nr10_validity: body.nr10_validity,
      nr35_validity: body.nr35_validity,
      drt_validity: body.drt_validity,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('👨‍💼 Criando perfil professional:', professional);

    const { data: prof, error: profError } = await supabase
      .from('professionals')
      .insert(professional)
      .select()
      .single();

    if (profError) {
      console.error('❌ Erro ao criar professional:', profError);
      return NextResponse.json({ error: profError.message }, { status: 500 });
    }

    console.log('✅ Professional criado:', prof);

    // 3. Criar validações de documentos (se houver documentos)
    if (body.documents && Object.keys(body.documents).length > 0) {
      const documentValidations = Object.entries(body.documents).map(([type, url]) => ({
        professional_id: prof.id,
        document_type: type,
        document_url: url as string,
        status: 'pending',
        version: 1,
      }));

      console.log('📄 Criando validações de documentos:', documentValidations);

      const { error: docsError } = await supabase
        .from('document_validations')
        .insert(documentValidations);

      if (docsError) {
        console.error('⚠️  Erro ao criar validações:', docsError);
      } else {
        console.log(`✅ ${documentValidations.length} validações criadas`);
      }
    }

    console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log(`📊 Professional ID: ${prof.id}`);
    console.log(`📊 User ID: ${user.id}`);
    console.log(`📊 Status: ${prof.status}`);

    return NextResponse.json({
      success: true,
      message: 'Cadastro de teste criado com sucesso!',
      data: {
        professional: prof,
        user: user,
      },
    });
  } catch (error: any) {
    console.error('❌ Erro no teste:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar cadastro de teste' },
      { status: 500 }
    );
  }
}
