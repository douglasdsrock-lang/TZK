-- Seed initial achievements
INSERT INTO achievements (name, description, icon, category, level_required) VALUES
('Iniciante', 'Bem-vindo ao projeto! Sua jornada começa aqui.', 'Star', 'Clan', 1),
('Atleta Dedicado', 'Frequência de 100% nos treinos do mês.', 'Flame', 'Esportivo', 1),
('Mestre da Estratégia', 'Demonstrou excelente visão de jogo.', 'Target', 'Clan', 3),
('Líder Positivo', 'Ajudou um colega a superar um desafio.', 'Crown', 'Social', 2),
('Nota 10', 'Manteve boas notas na escola.', 'Medal', 'Acadêmico', 1);

-- Note: Students should be created via Auth or Admin UI to ensure UUIDs match if using Supabase Auth
