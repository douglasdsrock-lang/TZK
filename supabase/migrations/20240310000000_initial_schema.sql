-- Initial Schema for TZK SaaS

-- Students Table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  class TEXT,
  birth_date DATE,
  gender TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  level INTEGER DEFAULT 1,
  achievements JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements Table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category_id UUID,
  level INTEGER DEFAULT 1,
  type TEXT DEFAULT 'standard',
  required_level INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  secondary_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Missions Table
CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'standard',
  sequence INTEGER DEFAULT 0,
  deadline TIMESTAMP WITH TIME ZONE,
  linked_achievement_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read access for students" ON students FOR SELECT USING (true);
CREATE POLICY "Public read access for achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Public read access for categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read access for missions" ON missions FOR SELECT USING (true);

-- Admin write access (Example: check by email or custom claim)
-- This is a simplified example, in production you'd use service roles or specific admin checks
CREATE POLICY "Admin full access for students" ON students FOR ALL USING (auth.jwt() ->> 'email' = 'agencia.unrocket@gmail.com');
CREATE POLICY "Admin full access for achievements" ON achievements FOR ALL USING (auth.jwt() ->> 'email' = 'agencia.unrocket@gmail.com');
CREATE POLICY "Admin full access for categories" ON categories FOR ALL USING (auth.jwt() ->> 'email' = 'agencia.unrocket@gmail.com');
CREATE POLICY "Admin full access for missions" ON missions FOR ALL USING (auth.jwt() ->> 'email' = 'agencia.unrocket@gmail.com');
