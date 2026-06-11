-- ══════════════════════════════════════════════════════════════════════
-- SECURITY HARDENING
-- ══════════════════════════════════════════════════════════════════════

-- ── 1. Corrigir check constraint de role ────────────────────────────────────
-- Adiciona 'gerencial' e 'consultor' (usado pelo frontend) sem remover 'consultant'
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('builder', 'admin', 'consultant', 'gerencial', 'consultor'));

-- ── 2. Trigger: bloqueia self-escalation de role/active ──────────────────────
-- Um usuário não-admin não pode alterar role, active, onboarding_complete
-- via RLS client. Esta trigger é a última linha de defesa.

CREATE OR REPLACE FUNCTION protect_sensitive_columns()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  caller_role text;
BEGIN
  -- Descobrir o role do chamador pelo auth.uid()
  SELECT role INTO caller_role
  FROM public.profiles
  WHERE id = auth.uid();

  -- Admins e builders podem alterar qualquer coisa
  IF caller_role IN ('admin', 'builder') THEN
    RETURN NEW;
  END IF;

  -- Se NÃO for admin/builder, bloquear mudanças em colunas sensíveis
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Não autorizado a alterar o campo role';
  END IF;

  IF NEW.active IS DISTINCT FROM OLD.active THEN
    RAISE EXCEPTION 'Não autorizado a alterar o campo active';
  END IF;

  IF NEW.onboarding_complete IS DISTINCT FROM OLD.onboarding_complete THEN
    RAISE EXCEPTION 'Não autorizado a alterar o campo onboarding_complete';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_column_protection ON profiles;
CREATE TRIGGER enforce_column_protection
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_sensitive_columns();

-- ── 3. Remover política RLS de UPDATE permissiva para próprio usuário ─────────
-- A política abaixo (se existir de migration anterior) não restringe colunas
-- e seria contornada com UPDATE direto pelo client.
-- A trigger acima garante a proteção real — a policy abaixo é retirada.
DROP POLICY IF EXISTS "Usuário atualiza próprio perfil" ON profiles;

-- Política segura: usuário só pode atualizar seus campos não-sensíveis
-- (full_name, whatsapp, phone) — a trigger bloqueia o resto.
CREATE POLICY "Usuário atualiza próprio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── 4. Coluna rejected_at em profiles ────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz NULL;

-- ── 5. Corrigir handle_new_user para atualizar email em re-auth Google ────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email)
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

-- ── 6. FK em notifications.user_id com cascade ────────────────────────────────
-- Adiciona FK apenas se não existir (evita erro em re-run)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'notifications'
      AND constraint_name = 'notifications_user_id_fkey'
  ) THEN
    ALTER TABLE notifications
      ADD CONSTRAINT notifications_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END;
$$;

-- ── 7. Índice em notifications(user_id, read) para query no layout ────────────
CREATE INDEX IF NOT EXISTS notifications_user_read_idx
  ON notifications (user_id, read);

-- ── 8. Índice composto para pending users query ───────────────────────────────
CREATE INDEX IF NOT EXISTS profiles_pending_created_idx
  ON profiles (created_at DESC)
  WHERE active = false AND onboarding_complete = true;
