-- Allow students to update their own profile
CREATE POLICY "Students update own profile" ON public.students FOR UPDATE 
USING (auth.uid() = id);

-- Allow students to insert their own profile (for first-time setup)
CREATE POLICY "Students insert own profile" ON public.students FOR INSERT 
WITH CHECK (auth.uid() = id);
