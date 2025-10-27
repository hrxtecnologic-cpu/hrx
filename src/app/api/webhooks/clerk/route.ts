import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Para testes
export async function GET() {
  return new Response('Webhook endpoint está ativo! Use POST para enviar eventos.', { status: 200 });
}

export async function POST(req: Request) {

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return new Response('Configuração inválida', { status: 500 });
  }


  // Obter headers de verificação DIRETAMENTE do Request
  const svix_id = req.headers.get('svix-id');
  const svix_timestamp = req.headers.get('svix-timestamp');
  const svix_signature = req.headers.get('svix-signature');


  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Headers svix ausentes', { status: 400 });
  }

  // Obter body
  const payload = await req.json();
  const body = JSON.stringify(payload);


  // Verificar webhook com Svix
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    return new Response('Assinatura inválida', { status: 400 });
  }

  // Processar eventos
  const eventType = evt.type;

  // USER CREATED
  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url, public_metadata } = evt.data;

    console.log('🔵 [WEBHOOK] user.created:', {
      clerk_id: id,
      email: email_addresses[0]?.email_address,
      full_name: `${first_name || ''} ${last_name || ''}`.trim(),
      user_type: (public_metadata as any)?.userType
    });

    try {
      const { data, error } = await supabase.from('users').insert({
        clerk_id: id,
        email: email_addresses[0]?.email_address || '',
        full_name: `${first_name || ''} ${last_name || ''}`.trim() || null,
        avatar_url: image_url || null,
        user_type: (public_metadata as any)?.userType || null,
        status: 'active',
      }).select();

      if (error) {
        console.error('❌ [WEBHOOK] Erro ao inserir usuário:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return new Response(JSON.stringify({
          error: 'Erro no banco de dados',
          details: error.message,
          code: error.code
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }

      console.log('✅ [WEBHOOK] Usuário criado com sucesso:', data);

    } catch (error: any) {
      console.error('❌ [WEBHOOK] Exceção ao criar usuário:', error);
      return new Response(JSON.stringify({
        error: 'Erro ao criar usuário',
        message: error.message
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  // USER UPDATED
  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url, public_metadata } = evt.data;

    console.log('🔵 [WEBHOOK] user.updated:', { clerk_id: id });

    try {
      const { error } = await supabase
        .from('users')
        .update({
          email: email_addresses[0]?.email_address || '',
          full_name: `${first_name || ''} ${last_name || ''}`.trim() || null,
          avatar_url: image_url || null,
          user_type: (public_metadata as any)?.userType || null,
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_id', id);

      if (error) {
        console.error('❌ [WEBHOOK] Erro ao atualizar usuário:', error);
        return new Response(JSON.stringify({
          error: 'Erro atualizando usuário',
          details: error.message
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }

      console.log('✅ [WEBHOOK] Usuário atualizado com sucesso');

    } catch (error: any) {
      console.error('❌ [WEBHOOK] Exceção ao atualizar usuário:', error);
      return new Response(JSON.stringify({
        error: 'Erro ao atualizar usuário',
        message: error.message
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  // USER DELETED
  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    console.log('🔵 [WEBHOOK] user.deleted:', { clerk_id: id });

    try {
    // Soft delete
      const { error } = await supabase
        .from('users')
        .update({
          status: 'deleted',
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_id', id);

      if (error) {
        console.error('❌ [WEBHOOK] Erro ao deletar usuário:', error);
        return new Response(JSON.stringify({
          error: 'Erro ao deletar usuário',
          details: error.message
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }

      console.log('✅ [WEBHOOK] Usuário deletado com sucesso');

    } catch (error: any) {
      console.error('❌ [WEBHOOK] Exceção ao deletar usuário:', error);
      return new Response(JSON.stringify({
        error: 'Erro ao deletar usuário',
        message: error.message
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  return new Response('Webhook processado com sucesso', { status: 200 });
}
