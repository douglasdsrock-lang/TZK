-- ==========================================
-- UNIVERSAL ADMIN ROLE FUNCTION
-- ==========================================
-- Esta função verifica se o usuário autenticado é um administrador,
-- seja por e-mail ou pela coluna 'role' na tabela students.
-- Usamos SECURITY DEFINER para evitar recursão infinita no RLS.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  _is_admin BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Verifica pelos e-mails dos administradores principais (hardcoded)
  IF auth.jwt() ->> 'email' IN ('agencia.unrocket@gmail.com', 'geracaotzk@gmail.com') THEN
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


-- ==========================================
-- APLICAR POLÍTICAS A TODAS AS TABELAS
-- ==========================================

-- 1. categories
DROP POLICY IF EXISTS "Admin total access categories" ON public.categories;
CREATE POLICY "Admin total access categories" ON public.categories FOR ALL USING (public.is_admin());

-- 2. achievements
DROP POLICY IF EXISTS "Admin total access achievements" ON public.achievements;
CREATE POLICY "Admin total access achievements" ON public.achievements FOR ALL USING (public.is_admin());

-- 3. students
-- Atenção: Mantemos a política de SELECT para o próprio usuário e ALL para admin
DROP POLICY IF EXISTS "Admin total access students" ON public.students;
CREATE POLICY "Admin total access students" ON public.students FOR ALL USING (public.is_admin());

-- 4. missions (Se a tabela não existir, estas linhas irão lançar aviso/erro mas podem ser executadas)
DROP POLICY IF EXISTS "Admin total access missions" ON public.missions;
CREATE POLICY "Admin total access missions" ON public.missions FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public read missions" ON public.missions;
CREATE POLICY "Public read missions" ON public.missions FOR SELECT USING (true);

-- 5. announcements
DROP POLICY IF EXISTS "Admin total access announcements" ON public.announcements;
CREATE POLICY "Admin total access announcements" ON public.announcements FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public read announcements" ON public.announcements;
CREATE POLICY "Public read announcements" ON public.announcements FOR SELECT USING (true);

-- 6. clans
DROP POLICY IF EXISTS "Admin total access clans" ON public.clans;
CREATE POLICY "Admin total access clans" ON public.clans FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public read clans" ON public.clans;
CREATE POLICY "Public read clans" ON public.clans FOR SELECT USING (true);

-- 7. notifications
-- Para notificações, os admin podem ver todas, e usuários as suas.
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin());
