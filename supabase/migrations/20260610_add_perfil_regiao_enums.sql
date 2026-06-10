-- ══════════════════════════════════════════════════════════
-- REVERSÃO: remove enums rígidos criados anteriormente
-- ══════════════════════════════════════════════════════════
DROP INDEX IF EXISTS profiles_perfil_idx;
DROP INDEX IF EXISTS profiles_regiao_idx;
DROP INDEX IF EXISTS profiles_regiao_perfil_idx;

ALTER TABLE profiles
  DROP COLUMN IF EXISTS perfil,
  DROP COLUMN IF EXISTS regiao;

DROP TYPE IF EXISTS perfil_consultor;
DROP TYPE IF EXISTS regiao_geografica;

-- ══════════════════════════════════════════════════════════
-- Tabela de referência: perfis_consultor
-- ══════════════════════════════════════════════════════════
CREATE TABLE perfis_consultor (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       text        NOT NULL UNIQUE,
  slug       text        NOT NULL UNIQUE,
  descricao  text,
  ativo      boolean     NOT NULL DEFAULT true,
  ordem      integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════
-- Tabela de referência: regioes_geograficas
-- ══════════════════════════════════════════════════════════
CREATE TABLE regioes_geograficas (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       text        NOT NULL UNIQUE,
  slug       text        NOT NULL UNIQUE,
  ativo      boolean     NOT NULL DEFAULT true,
  ordem      integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Dados iniciais — perfis
INSERT INTO perfis_consultor (nome, slug, descricao, ordem) VALUES
  ('Consultor Hunter',    'hunter',   'Foco em prospecção e abertura de novos clientes',        1),
  ('Consultor Farmer',    'farmer',   'Foco em manutenção e crescimento da carteira atual',     2),
  ('Consultor de Canais', 'canais',   'Especialista em canais digitais e plataformas',          3),
  ('Consultor Híbrido',   'hibrido',  'Atua tanto na prospecção quanto na gestão de carteira', 4),
  ('Acesso Gerencial',    'gerencial','Perfil com visão gerencial de equipe e resultados',      5);

-- Dados iniciais — regiões
INSERT INTO regioes_geograficas (nome, slug, ordem) VALUES
  ('Norte',                'norte',              1),
  ('Nordeste',             'nordeste',           2),
  ('Centro-Oeste',         'centro_oeste',       3),
  ('Sudeste',              'sudeste',            4),
  ('Sul',                  'sul',                5),
  ('Grande São Paulo',     'grande_sao_paulo',   6),
  ('Interior de São Paulo','interior_sao_paulo', 7);

-- ══════════════════════════════════════════════════════════
-- Colunas text em profiles (slug como referência flexível)
-- ══════════════════════════════════════════════════════════
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS perfil text NULL,
  ADD COLUMN IF NOT EXISTS regiao text NULL;

CREATE INDEX IF NOT EXISTS profiles_perfil_idx        ON profiles (perfil);
CREATE INDEX IF NOT EXISTS profiles_regiao_idx        ON profiles (regiao);
CREATE INDEX IF NOT EXISTS profiles_regiao_perfil_idx ON profiles (regiao, perfil);

-- ══════════════════════════════════════════════════════════
-- RLS
-- ══════════════════════════════════════════════════════════
ALTER TABLE perfis_consultor    ENABLE ROW LEVEL SECURITY;
ALTER TABLE regioes_geograficas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura autenticada — perfis"
  ON perfis_consultor FOR SELECT TO authenticated USING (true);

CREATE POLICY "Leitura autenticada — regioes"
  ON regioes_geograficas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role gerencia perfis"
  ON perfis_consultor FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role gerencia regioes"
  ON regioes_geograficas FOR ALL TO service_role USING (true) WITH CHECK (true);
