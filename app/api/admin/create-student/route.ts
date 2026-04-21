import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, password, fullName, studentData } = await req.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

    if (!supabaseUrl || !serviceRoleKey) {
      const missing = [];
      if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
      if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
      
      return NextResponse.json(
        { error: `Configuração incompleta: Variáveis ausentes: ${missing.join(', ')}. Se você estiver no Vercel, adicione-as no Dashboard do projeto e faça um novo deploy. Se estiver no AI Studio, verifique a aba Secrets.` },
        { status: 500 }
      );
    }

    // Validação de formato (Chaves Supabase são JWTs e começam com eyJ)
    if (!serviceRoleKey.startsWith('eyJ')) {
      const hint = serviceRoleKey.substring(0, 3);
      return NextResponse.json(
        { error: `A SUPABASE_SERVICE_ROLE_KEY fornecida parece estar em um formato inválido (começa com "${hint}..."). Certifique-se de que copiou a chave "service_role" (SECRET) completa do painel do Supabase (Settings > API).` },
        { status: 500 }
      );
    }

    if (serviceRoleKey === anonKey) {
      return NextResponse.json(
        { error: 'ERRO: Você usou a "Anon Key" no lugar da "Service Role Key". Vá ao Supabase > Settings > API, copie a chave "service_role" (a secreta) e atualize os segredos do AI Studio.' },
        { status: 500 }
      );
    }

    // Initialize Supabase with Service Role Key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    let authUser;

    // 1. Try to create the user directly
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (authError) {
      if (authError.message.includes('Bearer token')) {
        return NextResponse.json(
          { error: 'O Supabase rejeitou a chave de administrador. Verifique se a SUPABASE_SERVICE_ROLE_KEY está correta e se você reiniciou o servidor após salvá-la.' },
          { status: 401 }
        );
      }
      // If user already exists, we need to find their ID
      if (authError.message.includes('already registered') || authError.status === 422) {
        // Since we can't list all users easily, we'll try to get this specific user by email
        // Note: admin.listUsers is the only way to find by email in admin API
        // If this fails again, the key is definitely not a service_role key
        const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) {
          throw new Error(`A chave SUPABASE_SERVICE_ROLE_KEY parece ser inválida ou não tem permissões de admin. Erro: ${listError.message}`);
        }
        authUser = listData.users.find(u => u.email === email);
        if (!authUser) throw new Error('Usuário já existe no Auth, mas não foi encontrado na listagem.');
      } else {
        throw authError;
      }
    } else {
      authUser = authData.user;
    }

    if (!authUser) throw new Error('Falha ao obter ou criar usuário de autenticação.');

    // 2. Create Student Record in public table
    const studentPayload: any = {
      id: authUser.id,
      email: email.toLowerCase().trim(),
      first_name: fullName.split(' ')[0],
      last_name: fullName.split(' ').slice(1).join(' '),
      level: 1,
      experience: 0,
      status: studentData.status || 'active',
      class: studentData.class || null,
      birth_date: studentData.birth_date || null,
      entry_date: studentData.entry_date || null,
      unique_id: studentData.unique_id || null,
      gender: studentData.gender || 'male',
      notes: studentData.notes || null,
      created_at: new Date().toISOString()
    };

    // Only add achievements if explicitly provided
    if (studentData.achievements) {
      studentPayload.achievements = studentData.achievements;
    }

    const { error: dbError } = await supabaseAdmin
      .from('students')
      .insert([studentPayload]);

    if (dbError) {
      console.error('Database Insert Error:', dbError);
      throw new Error(`Erro no banco de dados: ${dbError.message}`);
    }

    return NextResponse.json({ success: true, user: authUser });
  } catch (error: any) {
    console.error('Full API Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Erro interno no servidor',
      details: error
    }, { status: 400 });
  }
}
