-- Remover as políticas antigas
DROP POLICY IF EXISTS "Admin total access categories" ON public.categories;
DROP POLICY IF EXISTS "Admin total access achievements" ON public.achievements;
DROP POLICY IF EXISTS "Admin total access students" ON public.students;

-- Criar as novas políticas que incluem o novo admin para categorias
CREATE POLICY "Admin total access categories" ON public.categories FOR ALL 
USING (
  auth.jwt() ->> 'email' = 'agencia.unrocket@gmail.com' OR 
  auth.jwt() ->> 'email' = 'geracaotzk@gmail.com'
);

-- Criar as novas políticas que incluem o novo admin para conquistas
CREATE POLICY "Admin total access achievements" ON public.achievements FOR ALL 
USING (
  auth.jwt() ->> 'email' = 'agencia.unrocket@gmail.com' OR 
  auth.jwt() ->> 'email' = 'geracaotzk@gmail.com'
);

-- Criar as novas políticas que incluem o novo admin para estudantes
CREATE POLICY "Admin total access students" ON public.students FOR ALL 
USING (
  auth.jwt() ->> 'email' = 'agencia.unrocket@gmail.com' OR 
  auth.jwt() ->> 'email' = 'geracaotzk@gmail.com'
);

-- Corrigir a política na tabela notifications para não quebrar usando uuid
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (
         auth.uid() = user_id OR
         auth.jwt() ->> 'email' = 'agencia.unrocket@gmail.com' OR
         auth.jwt() ->> 'email' = 'geracaotzk@gmail.com'
    );
