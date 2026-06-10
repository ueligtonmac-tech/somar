-- ══════════════════════════════════════════════════════════
-- Enum: perfil_consultor
-- Tipo de atuação comercial — atribuído pelo admin na aprovação
-- ══════════════════════════════════════════════════════════
CREATE TYPE perfil_consultor AS ENUM (
  'hunter',
  'farmer',
  'canais',
  'hibrido',
  'gerencial'
);

-- ══════════════════════════════════════════════════════════
-- Enum: regiao_geografica
-- Área geográfica de atuação — preenchida pelo usuário no cadastro
-- ══════════════════════════════════════════════════════════
CREATE TYPE regiao_geografica AS ENUM (
  'norte',
  'nordeste',
  'centro_oeste',
  'sudeste',
  'sul',
  'grande_sao_paulo',
  'interior_sao_paulo'
);

-- ══════════════════════════════════════════════════════════
-- Adiciona colunas à tabela profiles
-- ══════════════════════════════════════════════════════════
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS perfil  perfil_consultor  NULL,
  ADD COLUMN IF NOT EXISTS regiao  regiao_geografica NULL;

-- ══════════════════════════════════════════════════════════
-- Índices para filtros frequentes no painel admin
-- ══════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS profiles_perfil_idx        ON profiles (perfil);
CREATE INDEX IF NOT EXISTS profiles_regiao_idx        ON profiles (regiao);
CREATE INDEX IF NOT EXISTS profiles_regiao_perfil_idx ON profiles (regiao, perfil);
