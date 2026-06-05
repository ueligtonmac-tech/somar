import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Salva apenas os metadados após upload direto ao Storage pelo cliente
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['admin', 'builder'].includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { title, description, category, storagePath, fileSize } = await req.json()
    if (!title || !storagePath) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const service = await createServiceClient()

    const { data: { publicUrl } } = service.storage
      .from('biblioteca')
      .getPublicUrl(storagePath)

    const { data: newFile, error: dbError } = await service
      .from('library_files')
      .insert({
        title,
        description: description || null,
        category: category || null,
        file_url: publicUrl,
        file_name: storagePath,
        file_size: fileSize || null,
        active: true,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (dbError) throw new Error(dbError.message)

    return NextResponse.json({ file: newFile })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao salvar'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
