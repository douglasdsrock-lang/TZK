-- ==========================================
-- UNIVERSAL ADMIN ROLE FUNCTION UPDATE
-- ==========================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  _is_admin BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Verifica pelos e-mails dos administradores principais (hardcoded)
  IF auth.jwt() ->> 'email' IN ('agencia.unrocket@gmail.com', 'geracaotzk@gmail.com', 'geovanna.sena430@gmail.com') THEN
    RETURN TRUE;
  END IF;

  -- Verifica se o auth.uid() específico está na lista (opcional, adicione outros se precisar)
  IF auth.uid()::text = 'OMCUqpvEF9Zjg28ivP95zosy0zJ3' THEN
    RETURN TRUE;
  END IF;

  -- Verifica se o usuário possui a role 'admin' na tabela students
  -- Usamos o tratamento de erro caso a coluna role não exista
  BEGIN
    EXECUTE 'SELECT role = ''admin'' FROM public.students WHERE id = $1'
    INTO _is_admin
    USING auth.uid();
  EXCEPTION WHEN undefined_column THEN
    _is_admin := FALSE;
  END;

  RETURN COALESCE(_is_admin, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the insert policy for notifications to use is_admin() as well
DROP POLICY IF EXISTS "Users can insert notifications for themselves" ON public.notifications;
CREATE POLICY "Users can insert notifications for themselves"
    ON public.notifications FOR INSERT
    WITH CHECK (
        auth.uid() = user_id OR
        public.is_admin()
    );
