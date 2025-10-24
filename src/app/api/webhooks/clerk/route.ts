import { Webhook } from 'svix';
import { headers } from 'next/headers';
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

    try {
      const { error } = await supabase.from('users').insert({
        clerk_id: id,
        email: email_addresses[0]?.email_address || '',
        full_name: `${first_name || ''} ${last_name || ''}`.trim() || null,
        avatar_url: image_url || null,
        user_type: (public_metadata as any)?.userType || null,
        status: 'active',
      });

      if (error) {
        return new Response('Erro no banco de dados', { status: 500 });
      }

    } catch (error) {
      return new Response('Erro ao criar usuário', { status: 500 });
    }
  }

  // USER UPDATED
  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url, public_metadata } = evt.data;

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
        return new Response('Erro atualizando usuário', { status: 500 });
      }

    } catch (error) {
      return new Response('Erro ao atualizar usuário', { status: 500 });
    }
  }

  // USER DELETED
  if (eventType === 'user.deleted') {
    const { id } = evt.data;

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
        return new Response('Erro ao deletar usuário', { status: 500 });
      }

    } catch (error) {
      return new Response('Erro ao deletar usuário', { status: 500 });
    }
  }

  return new Response('Webhook processado com sucesso', { status: 200 });
}
