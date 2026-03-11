-- Create Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  age INTEGER,
  class TEXT,
  profile_photo TEXT,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  level_required INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Student Achievements (Many-to-Many)
CREATE TABLE IF NOT EXISTS student_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, achievement_id)
);

-- Create Missions table
CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('standard', 'timed')),
  sequence INTEGER,
  deadline TIMESTAMPTZ,
  linked_achievement_id UUID REFERENCES achievements(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Students can read all achievements and missions
CREATE POLICY "Allow public read access on achievements" ON achievements
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on missions" ON missions
  FOR SELECT USING (true);

-- Students can read their own data
CREATE POLICY "Students can read own data" ON students
  FOR SELECT USING (auth.uid()::text = email OR auth.jwt() ->> 'email' = email);

-- Admin policy (simplified for now, assuming admin email check)
-- In a real app, you'd use a role or a specific admin table
CREATE POLICY "Admins have full access to students" ON students
  FOR ALL USING (auth.jwt() ->> 'email' = 'agencia.unrocket@gmail.com');

CREATE POLICY "Admins have full access to achievements" ON achievements
  FOR ALL USING (auth.jwt() ->> 'email' = 'agencia.unrocket@gmail.com');

CREATE POLICY "Admins have full access to missions" ON missions
  FOR ALL USING (auth.jwt() ->> 'email' = 'agencia.unrocket@gmail.com');

CREATE POLICY "Admins have full access to student_achievements" ON student_achievements
  FOR ALL USING (auth.jwt() ->> 'email' = 'agencia.unrocket@gmail.com');

-- Students can read their own achievements
CREATE POLICY "Students can read own achievements" ON student_achievements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students 
      WHERE students.id = student_achievements.student_id 
      AND (students.email = auth.jwt() ->> 'email')
    )
  );
