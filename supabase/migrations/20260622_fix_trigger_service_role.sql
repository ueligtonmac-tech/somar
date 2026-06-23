-- Fix: trigger protect_sensitive_columns bloqueava service role
-- O trigger verificava auth.uid() para checar se é admin/builder.
-- Quando usamos service role client, auth.uid() retorna NULL,
-- então o trigger bloqueava TODOS os UPDATEs em role/active/onboarding_complete.
-- Isso causava o erro "An error occurred in the Server Components render"
-- em TODA ação de aprovar/rejeitar/alterar role de usuário.

CREATE OR REPLACE FUNCTION public.protect_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE caller_role text;
BEGIN
  -- Service role (auth.uid() IS NULL) tem permissão total — bypass completo
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;

  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role IN ('admin', 'builder') THEN RETURN NEW; END IF;

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
$function$;
