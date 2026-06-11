-- Adiciona descricao em regioes_geograficas (estava em perfis_consultor, mas não aqui)
ALTER TABLE regioes_geograficas
  ADD COLUMN IF NOT EXISTS descricao text;

-- Políticas de escrita para admin/builder usando RLS baseado em role do profile
-- (o createClient() do servidor usa as credenciais do usuário autenticado)

CREATE POLICY "Admin gerencia perfis"
  ON perfis_consultor FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'builder')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'builder')
    )
  );

CREATE POLICY "Admin gerencia regioes"
  ON regioes_geograficas FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'builder')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'builder')
    )
  );
