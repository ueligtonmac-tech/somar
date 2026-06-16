export interface UserProfile {
  id: string
  full_name: string | null
  email: string | null
  role: string
  perfil: string | null
  funcao: string | null
  cidade: string | null
  regiao: string | null
  whatsapp: string | null
  created_at: string
  active?: boolean
}

export interface RefItem {
  slug: string
  nome: string
}

export interface PendingUser {
  id: string
  full_name: string | null
  email: string | null
  whatsapp: string | null
  funcao: string | null
  cidade: string | null
  regiao: string | null
  created_at: string
}
