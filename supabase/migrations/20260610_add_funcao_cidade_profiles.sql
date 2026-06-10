-- Adiciona campos de função e cidade ao perfil do usuário
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS funcao text,
  ADD COLUMN IF NOT EXISTS cidade text;
