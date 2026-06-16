-- ============================================================
-- Migration: schema dump das tabelas sem migration prévia
-- Gerado em: 2026-06-15 via Supabase MCP (produção)
-- Estas tabelas foram criadas diretamente no console Supabase
-- e nunca tiveram migration correspondente.
-- ============================================================

-- Extensão necessária para vetores
CREATE EXTENSION IF NOT EXISTS vector;

-- ── MODULES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS modules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  title text NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (slug)
);

-- ── CARDS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  scenario text,
  challenge text,
  explanation text,
  action_hint text,
  order_index integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  video_url text,
  pdf_url text,
  pdf_name text,
  embedding vector,
  PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS cards_embedding_idx ON cards USING hnsw (embedding vector_cosine_ops);

-- ── BOT_MESSAGES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bot_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  user_id uuid,
  role text NOT NULL,
  content text NOT NULL,
  model_used text,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS bot_messages_conversation_idx ON bot_messages (conversation_id);
CREATE INDEX IF NOT EXISTS bot_messages_user_idx ON bot_messages (user_id);

-- ── BOT_KNOWLEDGE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bot_knowledge (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  source_feedback_id uuid,
  approved boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  embedding vector,
  PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS bot_knowledge_embedding_idx ON bot_knowledge USING hnsw (embedding vector_cosine_ops);

-- ── BOT_FEEDBACK ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bot_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  user_id uuid,
  question text NOT NULL,
  answer text NOT NULL,
  score integer NOT NULL,
  escalated boolean DEFAULT false,
  reviewed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  admin_answer text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  PRIMARY KEY (id)
);

-- ── LIBRARY_FILES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS library_files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  active boolean DEFAULT true,
  uploaded_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- ── DOCUMENT_CHUNKS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_chunks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES library_files(id) ON DELETE CASCADE,
  content text NOT NULL,
  embedding vector,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- ── NOTIFICATIONS ─────────────────────────────────────────────
-- (tabela já existia, aqui apenas para referência de schema)
CREATE TABLE IF NOT EXISTS notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON notifications (user_id, read);

-- ── PERFIS_CONSULTOR ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS perfis_consultor (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text NOT NULL,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (nome),
  UNIQUE (slug)
);

-- ── REGIOES_GEOGRAFICAS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS regioes_geograficas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (nome),
  UNIQUE (slug)
);

-- ── RPCs (funções de busca semântica) ─────────────────────────

CREATE OR REPLACE FUNCTION public.match_knowledge(
  query_embedding vector,
  match_threshold double precision DEFAULT 0.6,
  match_count integer DEFAULT 6
)
RETURNS TABLE(id uuid, question text, answer text, similarity double precision)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
    SELECT bk.id, bk.question, bk.answer,
           1 - (bk.embedding <=> query_embedding) AS similarity
    FROM bot_knowledge bk
    WHERE bk.approved = true
      AND bk.embedding IS NOT NULL
      AND 1 - (bk.embedding <=> query_embedding) > match_threshold
    ORDER BY bk.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.match_cards(
  query_embedding vector,
  match_threshold double precision DEFAULT 0.55,
  match_count integer DEFAULT 4
)
RETURNS TABLE(id uuid, title text, scenario text, challenge text, explanation text, similarity double precision)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
    SELECT c.id, c.title, c.scenario, c.challenge, c.explanation,
           1 - (c.embedding <=> query_embedding) AS similarity
    FROM cards c
    WHERE c.embedding IS NOT NULL
      AND 1 - (c.embedding <=> query_embedding) > match_threshold
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.match_chunks(
  query_embedding vector,
  match_threshold double precision DEFAULT 0.55,
  match_count integer DEFAULT 5
)
RETURNS TABLE(id uuid, content text, metadata jsonb, similarity double precision)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
    SELECT dc.id, dc.content, dc.metadata,
           1 - (dc.embedding <=> query_embedding) AS similarity
    FROM document_chunks dc
    WHERE dc.embedding IS NOT NULL
      AND 1 - (dc.embedding <=> query_embedding) > match_threshold
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
