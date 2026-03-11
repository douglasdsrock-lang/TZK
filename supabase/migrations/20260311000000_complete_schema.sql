-- ==========================================
-- 1. TABELAS CORE
-- ==========================================

-- Categorias de Conquistas
CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Conquistas (Achievements)
CREATE TABLE public.achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    points INTEGER DEFAULT 0,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Alunos/Jogadores (Students)
CREATE TABLE public.students (
    id UUID PRIMARY KEY, -- Vinculado ao ID do Auth
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT UNIQUE NOT NULL,
    class TEXT,
    birth_date DATE,
    gender TEXT DEFAULT 'male',
    notes TEXT,
    status TEXT DEFAULT 'active',
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    achievements JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 2. AUTOMAÇÃO (TIMESTAMPS)
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================
-- 3. SEGURANÇA (RLS)
-- ==========================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PARA CATEGORIES
CREATE POLICY "Admin total access categories" ON public.categories FOR ALL 
USING (auth.jwt() ->> 'email' = 'agencia.unrocket@gmail.com');
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);

-- POLÍTICAS PARA ACHIEVEMENTS
CREATE POLICY "Admin total access achievements" ON public.achievements FOR ALL 
USING (auth.jwt() ->> 'email' = 'agencia.unrocket@gmail.com');
CREATE POLICY "Public read achievements" ON public.achievements FOR SELECT USING (true);

-- POLÍTICAS PARA STUDENTS
CREATE POLICY "Admin total access students" ON public.students FOR ALL 
USING (auth.jwt() ->> 'email' = 'agencia.unrocket@gmail.com');
CREATE POLICY "Students view own profile" ON public.students FOR SELECT 
USING (auth.uid() = id);
