-- Habilitar extensão pgvector
create extension if not exists vector;

-- Perfis de usuário
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text unique not null,
  role text not null default 'consultant' check (role in ('builder', 'admin', 'consultant')),
  whatsapp text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS em profiles
alter table profiles enable row level security;

create policy "Usuário lê próprio perfil"
  on profiles for select
  using (auth.uid() = id);

create policy "Admin e builder leem todos"
  on profiles for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'builder')
    )
  );

create policy "Admin e builder atualizam usuários"
  on profiles for update
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'builder')
    )
  );

-- Trigger: criar perfil automaticamente ao registrar
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Módulos da trilha
create table if not exists modules (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  order_index integer not null default 0,
  published boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table modules enable row level security;

create policy "Consultores leem módulos publicados"
  on modules for select
  using (published = true or exists (
    select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','builder')
  ));

create policy "Admin e builder gerenciam módulos"
  on modules for all
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','builder'))
  );

-- Cards de conteúdo
create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references modules(id) on delete cascade not null,
  title text not null,
  scenario text,
  challenge text,
  explanation text,
  action_hint text,
  order_index integer not null default 0,
  published boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table cards enable row level security;

create policy "Consultores leem cards publicados"
  on cards for select
  using (published = true or exists (
    select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','builder')
  ));

create policy "Admin e builder gerenciam cards"
  on cards for all
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','builder'))
  );

-- Documentos da base de conhecimento
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_type text not null check (source_type in ('pdf','pptx','docx','manual')),
  file_path text,
  status text not null default 'processing' check (status in ('processing','ready','error')),
  error_message text,
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table documents enable row level security;

create policy "Admin e builder gerenciam documentos"
  on documents for all
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','builder'))
  );

-- Chunks vetorizados (RAG)
create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade not null,
  content text not null,
  embedding vector(1536),
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

alter table document_chunks enable row level security;

create policy "Admin e builder leem chunks"
  on document_chunks for select
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','builder'))
  );

create policy "Service role gerencia chunks"
  on document_chunks for all
  using (auth.role() = 'service_role');

-- Índice vetorial para busca semântica
create index if not exists document_chunks_embedding_idx
  on document_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Função de busca semântica
create or replace function match_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    dc.id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  where 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

-- Perguntas ao agente
create table if not exists agent_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  card_id uuid references cards(id),
  question text not null,
  answer text,
  model_used text check (model_used in ('gemini','claude','gpt','none')),
  confidence float,
  status text not null default 'answered' check (status in ('answered','pending','validated','escalated')),
  escalated_to text,
  created_at timestamptz not null default now()
);

alter table agent_questions enable row level security;

create policy "Usuário lê próprias perguntas"
  on agent_questions for select
  using (auth.uid() = user_id);

create policy "Usuário cria perguntas"
  on agent_questions for insert
  with check (auth.uid() = user_id);

create policy "Admin e builder leem todas as perguntas"
  on agent_questions for select
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','builder'))
  );

create policy "Admin e builder atualizam perguntas"
  on agent_questions for update
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','builder'))
  );

-- Respostas validadas (retroalimentação)
create table if not exists validated_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references agent_questions(id) on delete cascade not null,
  answer text not null,
  validated_by uuid references profiles(id) not null,
  added_to_kb boolean not null default false,
  created_at timestamptz not null default now()
);

alter table validated_answers enable row level security;

create policy "Admin e builder gerenciam respostas validadas"
  on validated_answers for all
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','builder'))
  );

-- Progresso do consultor
create table if not exists user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  module_id uuid references modules(id) on delete cascade not null,
  cards_seen integer not null default 0,
  completed boolean not null default false,
  last_seen_at timestamptz default now(),
  unique(user_id, module_id)
);

alter table user_progress enable row level security;

create policy "Usuário gerencia próprio progresso"
  on user_progress for all
  using (auth.uid() = user_id);

create policy "Admin e builder leem todo progresso"
  on user_progress for select
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','builder'))
  );

-- Seed inicial: módulos M1–M6
insert into modules (slug, title, description, order_index, published) values
  ('o-que-sao-canais',      'O que são canais digitais',       'Visão geral do ecossistema de canais Ultragaz',          1, true),
  ('app-whatsapp',          'App Ultragaz e WhatsApp',          'Canais de pedido direto ao cliente final',               2, true),
  ('hub-gestao-pedidos',    'HUB — Gestão de pedidos',          'Portal central de gerenciamento de pedidos da revenda',   3, true),
  ('vale-gas',              'Vale Gás — tipos e fluxo',         'Tipos de vale, validação, faturamento e reembolso',       4, true),
  ('amigu-entregadores',    'AmigU e entregadores',             'Direcionamento de pedidos e gestão de entregadores',      5, true),
  ('precificacao',          'Precificação e faturamento',       'Alteração de preços no HUB, ciclos e reembolso',          6, true)
on conflict (slug) do nothing;
