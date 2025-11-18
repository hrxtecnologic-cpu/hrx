/**
 * API Response Helpers
 *
 * Helpers para criar respostas padronizadas da API
 * Todas as APIs devem usar estes helpers para manter consistência
 *
 * Formato padrão:
 * {
 *   success: boolean;
 *   data?: T;
 *   message?: string;
 *   error?: string;
 *   errors?: ValidationError[];
 * }
 */

import { NextResponse } from 'next/server';
import type { ApiResponse, PaginatedResponse, ValidationError, StatusResponse } from '@/types';

// =====================================================
// Success Responses
// =====================================================

/**
 * Retorna resposta de sucesso padronizada
 *
 * @param data - Dados a retornar
 * @param message - Mensagem opcional de sucesso
 * @param status - Status HTTP (padrão: 200)
 */
export function successResponse<T>(
  data?: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

/**
 * Retorna resposta de criação bem-sucedida (201)
 *
 * @param data - Dados do recurso criado
 * @param message - Mensagem opcional
 */
export function createdResponse<T>(
  data: T,
  message?: string
): NextResponse<ApiResponse<T>> {
  return successResponse(data, message, 201);
}

/**
 * Retorna resposta de sucesso sem conteúdo (204)
 *
 * @param message - Mensagem opcional
 */
export function noContentResponse(message?: string): NextResponse {
  if (message) {
    return NextResponse.json(
      { success: true, message },
      { status: 204 }
    );
  }
  return new NextResponse(null, { status: 204 });
}

// =====================================================
// Error Responses
// =====================================================

/**
 * Retorna resposta de erro padronizada
 *
 * @param error - Mensagem de erro
 * @param status - Status HTTP (padrão: 500)
 */
export function errorResponse(
  error: string,
  status: number = 500
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

/**
 * Retorna resposta de validação com múltiplos erros
 *
 * @param errors - Array de erros de validação
 * @param message - Mensagem geral (opcional)
 */
export function validationErrorResponse(
  errors: ValidationError[],
  message: string = 'Erro de validação'
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      errors,
    },
    { status: 400 }
  );
}

/**
 * Retorna resposta de não autenticado (401)
 *
 * @param message - Mensagem de erro
 */
export function unauthorizedResponse(
  message: string = 'Não autenticado'
): NextResponse<ApiResponse> {
  return errorResponse(message, 401);
}

/**
 * Retorna resposta de acesso negado (403)
 *
 * @param message - Mensagem de erro
 */
export function forbiddenResponse(
  message: string = 'Acesso negado'
): NextResponse<ApiResponse> {
  return errorResponse(message, 403);
}

/**
 * Retorna resposta de não encontrado (404)
 *
 * @param message - Mensagem de erro
 */
export function notFoundResponse(
  message: string = 'Recurso não encontrado'
): NextResponse<ApiResponse> {
  return errorResponse(message, 404);
}

/**
 * Retorna resposta de conflito (409)
 *
 * @param message - Mensagem de erro
 */
export function conflictResponse(
  message: string = 'Conflito ao processar requisição'
): NextResponse<ApiResponse> {
  return errorResponse(message, 409);
}

/**
 * Retorna resposta de bad request (400)
 *
 * @param message - Mensagem de erro
 */
export function badRequestResponse(
  message: string = 'Requisição inválida'
): NextResponse<ApiResponse> {
  return errorResponse(message, 400);
}

/**
 * Retorna resposta de rate limit excedido (429)
 *
 * @param message - Mensagem de erro
 */
export function rateLimitResponse(
  message: string = 'Muitas requisições. Tente novamente mais tarde.'
): NextResponse<ApiResponse> {
  return errorResponse(message, 429);
}

/**
 * Retorna resposta de erro interno do servidor (500)
 *
 * @param message - Mensagem de erro
 */
export function internalErrorResponse(
  message: string = 'Erro interno do servidor'
): NextResponse<ApiResponse> {
  return errorResponse(message, 500);
}

// =====================================================
// Paginated Responses
// =====================================================

/**
 * Retorna resposta paginada padronizada
 *
 * @param data - Array de dados
 * @param total - Total de registros
 * @param page - Página atual
 * @param limit - Itens por página
 * @param message - Mensagem opcional
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  message?: string
): NextResponse<PaginatedResponse<T>> {
  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;

  return NextResponse.json(
    {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
      message,
    },
    { status: 200 }
  );
}

// =====================================================
// Status Update Responses
// =====================================================

/**
 * Retorna resposta de atualização de status
 *
 * @param status - Novo status
 * @param message - Mensagem de sucesso
 * @param updatedBy - ID do usuário que atualizou
 */
export function statusUpdateResponse(
  status: string,
  message: string,
  updatedBy?: string
): NextResponse<StatusResponse> {
  return NextResponse.json(
    {
      success: true,
      status,
      message,
      updatedBy,
      updatedAt: new Date().toISOString(),
    },
    { status: 200 }
  );
}

// =====================================================
// Helper para tratar erros de catch
// =====================================================

/**
 * Processa erro capturado e retorna resposta apropriada
 *
 * @param error - Erro capturado
 * @param defaultMessage - Mensagem padrão se erro não tiver mensagem
 */
export function handleError(
  error: unknown,
  defaultMessage: string = 'Erro ao processar requisição'
): NextResponse<ApiResponse> {
  console.error('API Error:', error);

  if (error instanceof Error) {
    // Erros conhecidos do Supabase/PostgreSQL
    if ('code' in error) {
      const pgError = error as { code?: string; detail?: string; message?: string };

      // Violação de constraint único
      if (pgError.code === '23505') {
        return conflictResponse('Este registro já existe');
      }

      // Violação de foreign key
      if (pgError.code === '23503') {
        return badRequestResponse('Referência inválida');
      }

      // Violação de not null
      if (pgError.code === '23502') {
        return badRequestResponse('Campos obrigatórios faltando');
      }
    }

    return internalErrorResponse(error instanceof Error ? error.message : defaultMessage);
  }

  return internalErrorResponse(defaultMessage);
}

// =====================================================
// Type Guards
// =====================================================

/**
 * Verifica se uma resposta é de sucesso
 */
export function isSuccessResponse(response: ApiResponse): boolean {
  return response.success === true;
}

/**
 * Verifica se uma resposta é de erro
 */
export function isErrorResponse(response: ApiResponse): boolean {
  return response.success === false;
}
