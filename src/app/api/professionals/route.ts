import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { professionalSchema } from '@/lib/validations/professional';
import { validateDocumentsForCategories, validateDocumentsForSubcategories, formatDocumentValidationErrors } from '@/lib/validations/documents';
import { sendProfessionalRegistrationEmails } from '@/lib/resend/emails';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import {
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  successResponse,
  createdResponse,
  badRequestResponse,
  internalErrorResponse,
} from '@/lib/api-response';
import { logger } from '@/lib/logger';

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
      return unauthorizedResponse();
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
      return notFoundResponse('Usuário não encontrado');
    }

    // Verificar se o userType é 'professional' ou se é admin
    const metadata = user.publicMetadata as { userType?: string; isAdmin?: boolean; role?: string };
    const userType = metadata?.userType;
    const isAdmin = metadata?.isAdmin === true || metadata?.role === 'admin';

    logger.debug('userType do metadata', { userType, isAdmin, role: metadata?.role, userId });

    // Permitir acesso para profissionais e admins
    if (userType !== 'professional' && !isAdmin) {
      return forbiddenResponse('Apenas profissionais e administradores podem acessar esta rota');
    }

    // Obter dados do body
    const body = await req.json();

    // Extrair documentos, portfolio, validades e novos campos separadamente
    const { documents, portfolio, cnh_number, cnh_validity, cnv_validity, nr10_validity, nr35_validity, drt_validity, subcategories, certifications, latitude, longitude, ...formData } = body;

    logger.debug('Documentos recebidos', {
      userId,
      documentTypes: documents ? Object.keys(documents) : [],
      documentCount: documents ? Object.keys(documents).length : 0,
      certifications: certifications ? Object.keys(certifications) : []
    });

    // ========== Mesclar certificações nos documentos para validação ==========
    // Os certificados (CNV, CNH, NR10, etc) vêm no objeto 'certifications'
    // Precisamos mapeá-los para o formato esperado pelo validador de documentos
    const certToDocMap: Record<string, string> = {
      'cnh': 'cnh_photo',
      'cnv': 'cnv_photo',
      'nr10': 'nr10_certificate',
      'nr35': 'nr35_certificate',
      'drt': 'drt_photo',
    };

    const mergedDocuments: Record<string, string> = { ...(documents || {}) };
    const mergedValidities: Record<string, string | null> = {
      cnh_validity: cnh_validity || null,
      cnv_validity: cnv_validity || null,
      nr10_validity: nr10_validity || null,
      nr35_validity: nr35_validity || null,
      drt_validity: drt_validity || null,
    };

    // Mesclar certificações
    if (certifications) {
      Object.entries(certifications).forEach(([certCode, certData]) => {
        const cert = certData as { document_url?: string; validity?: string };
        const docType = certToDocMap[certCode];

        if (docType && cert?.document_url) {
          mergedDocuments[docType] = cert.document_url;
        }

        // Extrair validade da certificação se não foi passada diretamente
        if (cert?.validity) {
          const validityKey = `${certCode}_validity`;
          if (!mergedValidities[validityKey]) {
            mergedValidities[validityKey] = cert.validity;
          }
        }
      });
    }

    logger.debug('Documentos mesclados para validação', {
      userId,
      mergedDocuments: Object.keys(mergedDocuments),
      mergedValidities
    });

    // Validar com Zod
    const validatedData = professionalSchema.parse(formData);

    // Buscar ou criar o user_id no Supabase baseado no clerk_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .maybeSingle();

    // Se não existe, criar automaticamente (webhook pode ter falhado)
    if (!userData) {
      logger.info('Usuário não encontrado, criando automaticamente...', { userId, isAdmin });

      // Determinar o user_type correto
      // Se for admin cadastrando, criar como professional (já que está na rota de professional)
      // Se for professional, criar como professional
      const userTypeToCreate = isAdmin ? 'professional' : 'professional';

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          clerk_id: userId,
          email: user.emailAddresses[0]?.emailAddress || '',
          full_name: user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.username || 'Sem nome',
          user_type: userTypeToCreate,
          status: 'active',
        })
        .select('id')
        .single();

      if (createError || !newUser) {
        logger.error('Erro ao criar usuário automaticamente', createError, { userId });
        return internalErrorResponse('Erro ao criar usuário no banco de dados');
      }

      userData = newUser;
      logger.info('Usuário criado automaticamente com sucesso', { userId, supabaseUserId: newUser.id, userType: userTypeToCreate });
    }

    // Verificar se já existe cadastro para este usuário
    const { data: existingProfessional } = await supabase
      .from('professionals')
      .select('id')
      .eq('user_id', userData.id)
      .maybeSingle();

    if (existingProfessional) {
      logger.warn('Tentativa de criar profissional duplicado', {
        professionalId: existingProfessional.id,
        userId
      });
      return badRequestResponse(
        'Já existe um cadastro para este usuário. Use PATCH /api/professionals/me para atualizar.'
      );
    }

    // Verificar duplicação por CPF
    const { data: professionalByCPF } = await supabase
      .from('professionals')
      .select('id')
      .eq('cpf', validatedData.cpf)
      .maybeSingle();

    if (professionalByCPF) {
      logger.warn('Tentativa de criar profissional com CPF duplicado', {
        cpf: validatedData.cpf.substring(0, 3) + '***',
        userId
      });
      return badRequestResponse('Já existe um cadastro com este CPF');
    }

    // ========== Validar Documentos Obrigatórios ==========
    // Usar documentos e validades mesclados (inclui certificações)
    const validityFields = mergedValidities;

    // ✨ NOVO: Usar subcategorias ao invés de categorias para validação de documentos
    const categoriesToValidate = subcategories && subcategories.length > 0
      ? subcategories
      : validatedData.categories;

    logger.debug('Validando documentos', {
      userId,
      usandoSubcategorias: !!subcategories,
      subcategories,
      categories: validatedData.categories,
      categoriesToValidate,
      mergedDocumentKeys: Object.keys(mergedDocuments)
    });

    // Usar mergedDocuments que inclui documentos básicos + certificações
    const documentValidation = subcategories && subcategories.length > 0
      ? validateDocumentsForSubcategories(subcategories, mergedDocuments, validityFields)
      : validateDocumentsForCategories(validatedData.categories, mergedDocuments, validityFields);

    if (!documentValidation.valid) {
      const errorMessage = formatDocumentValidationErrors(documentValidation);

      logger.warn('Validação de documentos falhou', {
        userId,
        subcategories,
        categories: validatedData.categories,
        missingRequired: documentValidation.missingRequired,
        missingValidity: documentValidation.missingValidity,
        errorCount: documentValidation.errors.length
      });

      return badRequestResponse(
        `Documentos inválidos ou incompletos: ${errorMessage}`,
        {
          validation: {
            errors: documentValidation.errors,
            warnings: documentValidation.warnings,
            missingRequired: documentValidation.missingRequired,
            missingValidity: documentValidation.missingValidity,
          }
        }
      );
    }

    // Log de avisos (documentos expirados, recomendados faltando)
    if (documentValidation.warnings && documentValidation.warnings.length > 0) {
      logger.info('Avisos de validação de documentos', {
        userId,
        warnings: documentValidation.warnings.map(w => `${w.label}: ${w.reason}`)
      });
    }

    logger.info('Validação de documentos aprovada', {
      userId,
      categories: validatedData.categories,
      documentCount: documents ? Object.keys(documents).length : 0
    });

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

        // Documentos específicos e validades (usar valores mesclados)
        cnh_number: cnh_number || null, // Obrigatório para motoristas
        cnh_validity: mergedValidities.cnh_validity || null,
        cnv_validity: mergedValidities.cnv_validity || null, // Obrigatório para seguranças
        nr10_validity: mergedValidities.nr10_validity || null,
        nr35_validity: mergedValidities.nr35_validity || null,
        drt_validity: mergedValidities.drt_validity || null,

        // Endereço
        cep: validatedData.cep,
        street: validatedData.street,
        number: validatedData.number,
        complement: validatedData.complement,
        neighborhood: validatedData.neighborhood,
        city: validatedData.city,
        state: validatedData.state,

        // Geolocalização
        latitude: latitude || null,
        longitude: longitude || null,

        // Raio de Atuação
        service_radius_km: validatedData.serviceRadiusKm || 50,

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

        // Novo sistema de subcategorias e certificações
        subcategories: subcategories || {},
        certifications: certifications || {},

        // Controle
        accepts_notifications: validatedData.acceptsNotifications,
        status: 'pending', // Aguardando aprovação
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Erro ao inserir profissional', insertError, { userId });
      return internalErrorResponse('Erro ao salvar cadastro');
    }

    logger.info('Profissional cadastrado com sucesso', {
      professionalId: professional.id,
      userId,
      documentCount: professional.documents ? Object.keys(professional.documents).length : 0
    });

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
        logger.error('Erros ao enviar emails de cadastro', undefined, {
          professionalId: professional.id,
          errorCount: result.errors.length
        });
      } else {
        logger.info('Emails de cadastro enviados com sucesso', {
          professionalId: professional.id
        });
      }
    });

    return createdResponse(
      { professionalId: professional.id },
      'Cadastro realizado com sucesso'
    );
  } catch (error) {
    logger.error('Erro no POST /api/professionals', error instanceof Error ? error : undefined, {
      errorName: error instanceof Error ? error.name : 'unknown'
    });

    if (error instanceof Error && error.name === 'ZodError') {
      return badRequestResponse('Dados inválidos');
    }

    return internalErrorResponse('Erro interno do servidor');
  }
}
