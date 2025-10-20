import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Usa SERVICE_ROLE para bypass RLS
);

export async function POST(req: Request) {
  try {
    // Verificar autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Parse do FormData
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Validar tamanho (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Tamanho máximo: 10MB' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use PDF ou imagens (JPG, PNG, WEBP)' },
        { status: 400 }
      );
    }

    // Gerar nome do arquivo
    const fileExt = file.name.split('.').pop();
    let fileName: string;

    if (documentType === 'portfolio') {
      const timestamp = Date.now();
      fileName = `${userId}/portfolio/photo_${timestamp}.${fileExt}`;
    } else {
      fileName = `${userId}/${documentType}.${fileExt}`;
    }

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload para Supabase Storage usando SERVICE_ROLE (ignora RLS)
    const { error: uploadError } = await supabase.storage
      .from('professional-documents')
      .upload(fileName, buffer, {
        upsert: documentType !== 'portfolio', // Portfolio não substitui, documentos sim
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // Gerar URL pública
    const { data: urlData } = supabase.storage
      .from('professional-documents')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
