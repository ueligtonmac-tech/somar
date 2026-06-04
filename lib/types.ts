export type Role = 'builder' | 'admin' | 'consultant'
export type DocumentStatus = 'processing' | 'ready' | 'error'
export type QuestionStatus = 'answered' | 'pending' | 'validated' | 'escalated'
export type ModelUsed = 'gemini' | 'claude' | 'gpt' | 'none'
export type SourceType = 'pdf' | 'pptx' | 'docx' | 'manual'

export interface Profile {
  id: string
  full_name: string | null
  email: string
  role: Role
  whatsapp: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface Module {
  id: string
  slug: string
  title: string
  description: string | null
  order_index: number
  published: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Card {
  id: string
  module_id: string
  title: string
  scenario: string | null
  challenge: string | null
  explanation: string | null
  action_hint: string | null
  order_index: number
  published: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  title: string
  source_type: SourceType
  file_path: string | null
  status: DocumentStatus
  error_message: string | null
  uploaded_by: string | null
  created_at: string
}

export interface DocumentChunk {
  id: string
  document_id: string
  content: string
  embedding: number[] | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface AgentQuestion {
  id: string
  user_id: string
  card_id: string | null
  question: string
  answer: string | null
  model_used: ModelUsed | null
  confidence: number | null
  status: QuestionStatus
  escalated_to: string | null
  created_at: string
}

export interface ValidatedAnswer {
  id: string
  question_id: string
  answer: string
  validated_by: string
  added_to_kb: boolean
  created_at: string
}

export interface UserProgress {
  id: string
  user_id: string
  module_id: string
  cards_seen: number
  completed: boolean
  last_seen_at: string | null
}
