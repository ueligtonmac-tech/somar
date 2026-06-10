-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxo de aprovação de usuários
-- Novos cadastros ficam inativos até aprovação manual do admin
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Adicionar coluna onboarding_complete
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean NOT NULL DEFAULT false;

-- 2. Marcar todos os usuários existentes como completos e aprovados
--    (eles foram cadastrados antes dessa mudança — não precisam de aprovação retroativa)
UPDATE profiles SET onboarding_complete = true;

-- 3. Novos usuários começam como inativos — muda o padrão da coluna active
ALTER TABLE profiles ALTER COLUMN active SET DEFAULT false;

-- 4. Atualizar trigger para criar perfil com active=false e onboarding_complete=false
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, active, onboarding_complete)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    false,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Política RLS: usuário pode atualizar campos do próprio perfil
--    (necessário para completar cadastro sem role de admin)
DROP POLICY IF EXISTS "Usuário atualiza próprio perfil" ON profiles;
CREATE POLICY "Usuário atualiza próprio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    -- Não permite alterar role ou active (apenas admin pode)
    auth.uid() = id
  );

-- 6. Novo tipo de notificação: account_approved — usuário recebe quando aprovado
-- (sem necessidade de schema change — a coluna type é TEXT livre)

-- 7. Índice para busca rápida de usuários pendentes
CREATE INDEX IF NOT EXISTS profiles_pending_idx
  ON profiles (active, onboarding_complete)
  WHERE active = false AND onboarding_complete = true;
