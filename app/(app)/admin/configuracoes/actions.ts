'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── helpers ────────────────────────────────────────────────────────────────
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'builder'].includes(me.role ?? '')) throw new Error('Sem permissão')
  return supabase
}

function toSlug(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// ── PERFIS ─────────────────────────────────────────────────────────────────

export async function createPerfil(formData: FormData) {
  const supabase = await requireAdmin()
  const nome = (formData.get('nome') as string ?? '').trim()
  const descricao = (formData.get('descricao') as string ?? '').trim()
  if (!nome) throw new Error('Nome obrigatório')

  // max ordem atual
  const { data: last } = await supabase
    .from('perfis_consultor')
    .select('ordem')
    .order('ordem', { ascending: false })
    .limit(1)
    .single()

  const ordem = ((last?.ordem ?? 0) as number) + 1
  const slug = toSlug(nome)

  const { error } = await supabase
    .from('perfis_consultor')
    .insert({ slug, nome, descricao: descricao || null, ordem, ativo: true })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/configuracoes')
}

export async function updatePerfil(id: string, formData: FormData) {
  const supabase = await requireAdmin()
  const nome = (formData.get('nome') as string ?? '').trim()
  const descricao = (formData.get('descricao') as string ?? '').trim()
  if (!nome) throw new Error('Nome obrigatório')

  const { error } = await supabase
    .from('perfis_consultor')
    .update({ nome, descricao: descricao || null })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/configuracoes')
}

export async function togglePerfil(id: string, ativo: boolean) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from('perfis_consultor')
    .update({ ativo })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/configuracoes')
}

export async function reorderPerfis(ids: string[]) {
  const supabase = await requireAdmin()
  await Promise.all(
    ids.map((id, i) =>
      supabase.from('perfis_consultor').update({ ordem: i + 1 }).eq('id', id)
    )
  )
  revalidatePath('/admin/configuracoes')
}

// ── REGIÕES ────────────────────────────────────────────────────────────────

export async function createRegiao(formData: FormData) {
  const supabase = await requireAdmin()
  const nome = (formData.get('nome') as string ?? '').trim()
  const descricao = (formData.get('descricao') as string ?? '').trim()
  if (!nome) throw new Error('Nome obrigatório')

  const { data: last } = await supabase
    .from('regioes_geograficas')
    .select('ordem')
    .order('ordem', { ascending: false })
    .limit(1)
    .single()

  const ordem = ((last?.ordem ?? 0) as number) + 1
  const slug = toSlug(nome)

  const { error } = await supabase
    .from('regioes_geograficas')
    .insert({ slug, nome, descricao: descricao || null, ordem, ativo: true })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/configuracoes')
}

export async function updateRegiao(id: string, formData: FormData) {
  const supabase = await requireAdmin()
  const nome = (formData.get('nome') as string ?? '').trim()
  const descricao = (formData.get('descricao') as string ?? '').trim()
  if (!nome) throw new Error('Nome obrigatório')

  const { error } = await supabase
    .from('regioes_geograficas')
    .update({ nome, descricao: descricao || null })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/configuracoes')
}

export async function toggleRegiao(id: string, ativo: boolean) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from('regioes_geograficas')
    .update({ ativo })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/configuracoes')
}

export async function reorderRegioes(ids: string[]) {
  const supabase = await requireAdmin()
  await Promise.all(
    ids.map((id, i) =>
      supabase.from('regioes_geograficas').update({ ordem: i + 1 }).eq('id', id)
    )
  )
  revalidatePath('/admin/configuracoes')
}
