import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { professionalSchema } from '@/lib/validations/professional';
import { sendProfessionalRegistrationEmails } from '@/lib/resend/emails';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';

// IMPORTANTE: Força Node.js runtime para usar Resend
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // Verificar autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // 🔒 SECURITY: Rate limiting - 3 cadastros por hora
    const rateLimitResult = await rateLimit(userId, RateLimitPresets.REGISTRATION);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitError(rateLimitResult),
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          },
        }
      );
    }

    // Obter usuário do Clerk
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar se o userType é 'professional'
    const userType = user.publicMetadata?.userType;
    console.log('🔍 [API] userType do metadata:', userType);

    if (userType !== 'professional') {
      return NextResponse.json(
        { error: 'Apenas profissionais podem acessar esta rota' },
        { status: 403 }
      );
    }

    // Obter dados do body
    const body = await req.json();

    // Extrair documentos, portfolio e validades de documentos separadamente
    const { documents, portfolio, cnh_number, cnh_validity, cnv_validity, nr10_validity, nr35_validity, drt_validity, ...formData } = body;

    console.log('📦 [API] Documentos recebidos:', documents);
    console.log('📦 [API] Documentos (JSON):', JSON.stringify(documents, null, 2));

    // Validar com Zod
    const validatedData = professionalSchema.parse(formData);

    // Buscar o user_id no Supabase baseado no clerk_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !userData) {
      console.error('Erro ao buscar usuário:', userError);
      return NextResponse.json(
        { error: 'Usuário não encontrado no banco de dados' },
        { status: 404 }
      );
    }

    // Verificar se já existe cadastro para este usuário
    const { data: existingProfessional } = await supabase
      .from('professionals')
      .select('id')
      .eq('user_id', userData.id)
      .single();

    if (existingProfessional) {
      return NextResponse.json(
        { error: 'Você já possui um cadastro profissional' },
        { status: 400 }
      );
    }

    // Inserir profissional no banco
    const { data: professional, error: insertError } = await supabase
      .from('professionals')
      .insert({
        user_id: userData.id,
        clerk_id: userId, // Adicionar clerk_id para facilitar buscas
        full_name: validatedData.fullName,
        cpf: validatedData.cpf,
        birth_date: validatedData.birthDate,
        email: validatedData.email,
        phone: validatedData.phone,

        // Documentos específicos e validades
        cnh_number: cnh_number || null, // Obrigatório para motoristas
        cnh_validity: cnh_validity || null,
        cnv_validity: cnv_validity || null, // Obrigatório para seguranças
        nr10_validity: nr10_validity || null,
        nr35_validity: nr35_validity || null,
        drt_validity: drt_validity || null,

        // Endereço
        cep: validatedData.cep,
        street: validatedData.street,
        number: validatedData.number,
        complement: validatedData.complement,
        neighborhood: validatedData.neighborhood,
        city: validatedData.city,
        state: validatedData.state,

        // Experiência
        categories: validatedData.categories,
        has_experience: validatedData.hasExperience,
        experience_description: validatedData.experienceDescription,
        years_of_experience: validatedData.yearsOfExperience,

        // Disponibilidade
        availability: validatedData.availability,

        // Dados bancários
        bank_name: validatedData.bankName,
        account_type: validatedData.accountType,
        agency: validatedData.agency,
        account_number: validatedData.accountNumber,
        pix_key: validatedData.pixKey,

        // Documentos e portfólio
        documents: documents || {},
        portfolio: portfolio || [],

        // Controle
        accepts_notifications: validatedData.acceptsNotifications,
        status: 'pending', // Aguardando aprovação
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao inserir profissional:', insertError);
      return NextResponse.json(
        { error: 'Erro ao salvar cadastro' },
        { status: 500 }
      );
    }

    console.log(`✅ Profissional cadastrado: ${validatedData.email}`);
    console.log('📄 [API] Documentos salvos no banco:', professional.documents);

    // Enviar emails de confirmação (não bloquear a resposta)
    sendProfessionalRegistrationEmails({
      professional: {
        professionalName: validatedData.fullName,
        professionalEmail: validatedData.email,
      },
      admin: {
        professionalName: validatedData.fullName,
        professionalEmail: validatedData.email,
        professionalPhone: validatedData.phone,
        professionalCPF: validatedData.cpf,
        categories: validatedData.categories,
        hasExperience: validatedData.hasExperience,
        yearsOfExperience: validatedData.yearsOfExperience,
        city: validatedData.city,
        state: validatedData.state,
        documentsUploaded: Object.keys(documents || {}),
        professionalId: professional.id,
      },
    }).then((result) => {
      if (result.errors.length > 0) {
        console.error('Erros ao enviar emails:', result.errors);
      } else {
        console.log('✅ Emails enviados com sucesso');
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Cadastro realizado com sucesso',
        professionalId: professional.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro no POST /api/professionals:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
