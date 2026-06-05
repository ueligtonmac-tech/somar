import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['admin', 'builder'].includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const title = (formData.get('title') as string)?.trim()
    const description = (formData.get('description') as string)?.trim()
    const category = (formData.get('category') as string)?.trim()

    if (!file || !title) {
      return NextResponse.json({ error: 'Arquivo e título são obrigatórios' }, { status: 400 })
    }

    if (!file.type.includes('pdf')) {
      return NextResponse.json({ error: 'Apenas arquivos PDF são aceitos' }, { status: 400 })
    }

    const service = await createServiceClient()

    // Upload para Supabase Storage
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${timestamp}_${safeName}`

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await service.storage
      .from('biblioteca')
      .upload(storagePath, arrayBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) throw new Error(uploadError.message)

    // URL pública
    const { data: { publicUrl } } = service.storage
      .from('biblioteca')
      .getPublicUrl(storagePath)

    // Salva no banco
    const { data: newFile, error: dbError } = await service
      .from('library_files')
      .insert({
        title,
        description: description || null,
        category: category || null,
        file_url: publicUrl,
        file_name: storagePath,
        file_size: file.size,
        active: true,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (dbError) throw new Error(dbError.message)

    return NextResponse.json({ file: newFile })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao fazer upload'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
