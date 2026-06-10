export interface UserProfile {
  id: string
  full_name: string | null
  email: string | null
  role: string
  phone: string | null
  whatsapp: string | null
  created_at: string
  active?: boolean
}

export interface PendingUser {
  id: string
  full_name: string | null
  email: string | null
  whatsapp: string | null
  funcao: string | null
  cidade: string | null
  created_at: string
}
