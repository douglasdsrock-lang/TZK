'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { 
  Users, 
  User,
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Trophy, 
  X,
  Check,
  Loader2,
  MoreVertical,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn, getAvatarUrl } from '@/lib/utils';
import { StudentAvatar } from './StudentAvatar';
import { ClanManagement } from './ClanManagement';

import { useAuth } from './AuthGuard';

import { supabase } from '@/lib/supabase';


const studentSchema = z.object({
  firstName: z.string().min(2, 'Nome muito curto'),
  lastName: z.string().min(2, 'Sobrenome muito curto'),
  email: z.string().email('Email inválido'),
  clan_id: z.string().nullable().optional(),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
  entryDate: z.string().min(1, 'Data de entrada é obrigatória'),
  uniqueId: z.string().min(1, 'ID único é obrigatório'),
  gender: z.enum(['male', 'female'], { message: 'Sexo é obrigatório' }),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  password: z.string().optional().or(z.literal('')),
});

type StudentFormValues = z.infer<typeof studentSchema>;

// ...

export function StudentManagement() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'students' | 'clans'>('students');
  const [students, setStudents] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clans, setClans] = useState<any[]>([]); // Adicionado estado para clans

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isAssigningAchievements, setIsAssigningAchievements] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingAchievementId, setTogglingAchievementId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      status: 'active',
    }
  });

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('first_name', { ascending: true });

      if (error) throw error;

      const mapped = (data || []).map(s => ({
        id: s.id,
        firstName: s.first_name,
        lastName: s.last_name,
        email: s.email,
        class: s.class,
        birthDate: s.birth_date,
        entryDate: s.entry_date,
        uniqueId: s.unique_id,
        gender: s.gender,
        characterId: s.character_id,
        status: s.status,
        notes: s.notes,
        level: s.level,
        achievements: s.achievements || []
      }));

      setStudents(mapped);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAchievements = async () => {
    const { data } = await supabase.from('achievements').select('*');
    setAchievements(data || []);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*');
    setCategories(data || []);
  };

  const fetchClans = async () => {
    const { data } = await supabase.from('clans').select('id, name, icon');
    setClans(data || []);
  };

  useEffect(() => {
    fetchStudents();
    fetchAchievements();
    fetchCategories();
    fetchClans();

    const studentsChannel = supabase
      .channel('public:students_mgmt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        fetchStudents();
      })
      .subscribe();

    const clansChannel = supabase
      .channel('public:clans_mgmt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clans' }, () => {
        fetchClans();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(studentsChannel);
      supabase.removeChannel(clansChannel);
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = students.filter(student => {
    const searchLower = searchQuery.toLowerCase();
    return (
      student.firstName?.toLowerCase().includes(searchLower) ||
      student.lastName?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower) ||
      student.class?.toLowerCase().includes(searchLower) ||
      student.status?.toLowerCase().includes(searchLower)
    );
  });

  const adminStudent = students.find(s => s.email === user?.email);

  const onSubmit = async (data: StudentFormValues) => {
    setFormError(null);
    if (!editingStudent && data.password && data.password.length < 6) {
      setFormError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    // Check for duplicate uniqueId
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .eq('unique_id', data.uniqueId);
    
    if (existing && existing.length > 0 && (!editingStudent || existing[0].id !== editingStudent.id)) {
      setFormError('O ID único já está sendo utilizado por outro aluno. Por favor, escolha um novo ID.');
      return;
    }

    try {
      const payload = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        clan_id: data.clan_id,
        birth_date: data.birthDate,
        entry_date: data.entryDate,
        unique_id: data.uniqueId,
        gender: data.gender,
        status: data.status,
        notes: data.notes,
        updated_at: new Date().toISOString()
      };

      if (editingStudent) {
        const { error } = await supabase
          .from('students')
          .update(payload)
          .eq('id', editingStudent.id);
        if (error) throw error;

        // Update password if provided
        if (newPassword) {
          const response = await fetch('/api/admin/update-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: editingStudent.id, newPassword })
          });
          if (!response.ok) throw new Error('Erro ao atualizar senha');
        }
      } else {
        // Use our new API route to create student without hijacking session
        const response = await fetch('/api/admin/create-student', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            fullName: `${data.firstName} ${data.lastName}`,
            studentData: payload
          })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Erro ao criar aluno');
      }
      closeModal();
    } catch (err: any) {
      const errorMessage = err.message || JSON.stringify(err);
      console.error('Error saving student details:', errorMessage);
      
      if (errorMessage.includes('unique constraint') || errorMessage.includes('students_unique_id_idx')) {
        setFormError('O ID único já está sendo utilizado por outro aluno. Por favor, escolha um novo ID.');
      } else {
        setFormError(`Erro ao salvar aluno: ${errorMessage}`);
      }
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const { error } = await supabase.from('students').delete().eq('id', deletingId);
      if (error) throw error;
      setDeletingId(null);
    } catch (err) {
      console.error('Error deleting student:', err);
    }
  };

  const toggleAchievement = async (student: any, achievementId: string) => {
    if (togglingAchievementId) return;
    setTogglingAchievementId(achievementId);

    const currentAchievements = student.achievements || [];
    const existingIndex = currentAchievements.findIndex((a: any) => a.achievementId === achievementId);
    
    let newAchievements;
    if (existingIndex >= 0) {
      // Remove achievement
      newAchievements = currentAchievements.filter((a: any) => a.achievementId !== achievementId);
    } else {
      // Add achievement with its defined level
      const achievementDef = achievements.find(a => a.id === achievementId);
      const level = achievementDef?.level || 1;
      newAchievements = [...currentAchievements, { achievementId, level }];
    }
    
    // Calculate total level as sum of achievement levels from the source of truth (achievements collection)
    const newLevel = newAchievements.reduce((sum: number, a: any) => {
      const def = achievements.find(d => d.id === a.achievementId);
      return sum + (def?.level || 0);
    }, 0);
    
    try {
      const { error } = await supabase
        .from('students')
        .update({
          achievements: newAchievements,
          level: newLevel,
          updated_at: new Date().toISOString()
        })
        .eq('id', student.id);
      
      if (error) throw error;

      // Create notifications
      const achievementDef = achievements.find(a => a.id === achievementId);
      const isNowUnlocked = existingIndex < 0;

      if (isNowUnlocked && achievementDef) {
        // Notification for achievement
        await supabase.from('notifications').insert({
          user_id: student.id, // Assuming student.id is the auth user id, but wait...
          // I need to check if student.id is the auth user id.
          // In this app, it seems student.id is the UUID from the students table.
          // Let's check if there's a mapping.
          // Actually, looking at AuthGuard, the user.id is the auth.uid.
          // The students table has an 'id' which is likely the auth.uid.
          title: 'Conquista Desbloqueada! 🏆',
          message: `Você liberou a conquista: ${achievementDef.name}`,
          type: 'achievement'
        });

        // Notification for level up if level increased
        if (newLevel > (student.level || 0)) {
          await supabase.from('notifications').insert({
            user_id: student.id,
            title: 'Subiu de Nível! ⚡',
            message: `Parabéns! Você alcançou o nível ${newLevel}`,
            type: 'level'
          });
        }
      }
      
      // Update local state for immediate feedback if it's the modal student
      if (isAssigningAchievements && isAssigningAchievements.id === student.id) {
        setIsAssigningAchievements({
          ...isAssigningAchievements,
          achievements: newAchievements,
          level: newLevel
        });
      }
    } catch (err) {
      console.error('Error toggling achievement:', err);
    } finally {
      setTogglingAchievementId(null);
    }
  };

  const fetchNextTzkId = async () => {
    const { data } = await supabase
      .from('students')
      .select('unique_id')
      .like('unique_id', 'tzk%')
      .order('unique_id', { ascending: false })
      .limit(1);

    if (data && data.length > 0 && data[0].unique_id) {
      const currentId = parseInt(data[0].unique_id.replace('tzk', ''));
      return `tzk${String(currentId + 1).padStart(3, '0')}`;
    }
    return 'tzk101';
  };

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setValue('password', pass);
  };

  const openModal = async (student: any = null, isEdit: boolean = false) => {
    setFormError(null);
    setEditingStudent(isEdit ? student : null);
    if (student) {
      reset({
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        clan_id: student.clan_id,
        birthDate: student.birthDate,
        entryDate: student.entryDate,
        uniqueId: student.uniqueId,
        gender: student.gender || 'male',
        notes: student.notes || '',
        status: student.status,
      });
    } else {
      const nextId = await fetchNextTzkId();
      reset({
        firstName: '',
        lastName: '',
        email: '',
        clan_id: '',
        birthDate: '',
        entryDate: new Date().toISOString().split('T')[0],
        uniqueId: nextId,
        gender: 'male',
        notes: '',
        status: 'active',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    setNewPassword('');
    reset();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex gap-4 border-b border-white/5 mb-6">
        <button onClick={() => setActiveTab('students')} className={cn("px-4 py-3 font-bold text-sm", activeTab === 'students' ? "text-[#F74C00] border-b-2 border-[#F74C00]" : "text-gray-500")}>ALUNOS</button>
        <button onClick={() => setActiveTab('clans')} className={cn("px-4 py-3 font-bold text-sm", activeTab === 'clans' ? "text-[#F74C00] border-b-2 border-[#F74C00]" : "text-gray-500")}>CLÃS</button>
      </div>

          {activeTab === 'clans' ? <ClanManagement /> : (
        <>
          <div className="flex flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-display font-black tracking-tight">GESTÃO DE ALUNOS</h2>
              <p className="text-gray-500 mt-1 text-xs md:text-sm hidden sm:block">Gerencie jogadores, atribua conquistas e acompanhe o progresso.</p>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              {isAdmin && (
                adminStudent ? (
                  <button 
                    onClick={() => setIsAssigningAchievements(adminStudent)}
                    className="bg-white/5 hover:bg-white/10 text-white px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95 border border-white/10 text-[10px] md:text-sm whitespace-nowrap"
                  >
                    <Trophy size={16} className="text-[#F74C00]" />
                    <span className="hidden xs:inline">MINHAS CONQUISTAS</span>
                    <span className="xs:hidden">CONQUISTAS</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => openModal({
                      firstName: user?.user_metadata?.full_name?.split(' ')[0] || 'Admin',
                      lastName: user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
                      email: user?.email,
                      class: 'Administração',
                      birthDate: new Date().toISOString().split('T')[0],
                      gender: 'male',
                      status: 'active'
                    })}
                    className="bg-white/5 hover:bg-white/10 text-white px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95 border border-white/10 text-[10px] md:text-sm whitespace-nowrap"
                  >
                    <User size={16} className="text-[#F74C00]" />
                    ATIVAR PERFIL
                  </button>
                )
              )}
              <button 
                onClick={() => openModal()}
                className="bg-[#F74C00] hover:bg-[#ff5a14] text-white px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-500/20 text-[10px] md:text-sm whitespace-nowrap"
              >
                <Plus size={16} />
                ADICIONAR ALUNO
              </button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nome, turma ou status..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#151518] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all"
              />
            </div>
            <button className="px-4 py-3 bg-[#151518] border border-white/5 rounded-xl text-gray-400 hover:text-white flex items-center gap-2 transition-all">
              <Filter size={18} />
              Filtros
            </button>
          </div>

          <div className="bg-[#151518] border border-white/5 rounded-3xl overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-4 py-4 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">ID</th>
                    <th className="px-4 py-4 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Aluno</th>
                    <th className="px-4 py-4 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Clã</th>
                    <th className="px-4 py-4 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Nível</th>
                    <th className="px-4 py-4 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Conquistas</th>
                    <th className="px-4 py-4 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Status</th>
                    <th className="px-4 py-4 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest text-right whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <Loader2 className="w-8 h-8 text-[#F74C00] animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        Nenhum aluno encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-4 py-4">
                          <span className="font-mono text-xs text-gray-400">{student.uniqueId}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="hidden sm:block">
                              <StudentAvatar 
                                src={student.profilePhoto}
                                firstName={student.firstName}
                                lastName={student.lastName}
                                gender={student.gender}
                                characterId={student.characterId}
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white text-xs md:text-sm truncate">{student.firstName} {student.lastName}</p>
                              <p className="text-[9px] md:text-[10px] text-gray-500 font-mono truncate">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-[10px] md:text-xs font-semibold text-gray-300 whitespace-nowrap">
                            {student.class}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-[#FFDA1F]/10 flex items-center justify-center text-[#FFDA1F] text-[10px] md:text-xs font-black">
                              {student.level}
                            </div>
                            <div className="w-12 lg:w-24 h-1 bg-[#0A0A0B] rounded-full overflow-hidden hidden lg:block">
                              <div className="h-full bg-gradient-to-r from-[#F74C00] to-[#FFDA1F]" style={{ width: `${Math.min(100, (student.level || 0) * 10)}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <button 
                            onClick={() => setIsAssigningAchievements(student)}
                            className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs font-bold text-[#F74C00] hover:underline whitespace-nowrap"
                          >
                            <Trophy size={12} />
                            {student.achievements?.length || 0} <span className="hidden sm:inline">Conquistas</span>
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider whitespace-nowrap",
                            student.status === 'active' ? "bg-emerald-500/10 text-emerald-500" : "bg-gray-500/10 text-gray-500"
                          )}>
                            <span className={cn("w-1 h-1 rounded-full", student.status === 'active' ? "bg-emerald-500" : "bg-gray-500")}></span>
                            {student.status === 'active' ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 transition-opacity">
                            <button 
                              onClick={() => openModal(student, true)}
                              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                              title="Editar"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleDelete(student.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                              title="Excluir"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Student Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[10000] flex items-start justify-center p-4 md:p-10 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#151518] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h3 className="text-xl font-display font-bold">
                  {editingStudent ? 'EDITAR JOGADOR' : 'ADICIONAR NOVO JOGADOR'}
                </h3>
                <button onClick={closeModal} className="p-2 text-gray-500 hover:text-white rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Nome</label>
                    <input 
                      {...register('firstName')}
                      className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all"
                      placeholder="ex: João"
                    />
                    {errors.firstName && <p className="text-red-500 text-[10px]">{errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Sobrenome</label>
                    <input 
                      {...register('lastName')}
                      className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all"
                      placeholder="ex: Silva"
                    />
                    {errors.lastName && <p className="text-red-500 text-[10px]">{errors.lastName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Email</label>
                    <input 
                      {...register('email')}
                      type="email"
                      className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all"
                      placeholder="joao.silva@email.com"
                    />
                    {errors.email && <p className="text-red-500 text-[10px]">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Clã</label>
                    <select 
                      {...register('clan_id')}
                      className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all appearance-none"
                    >
                      <option value="">Selecione um clã</option>
                      {clans.map(clan => (
                        <option key={clan.id} value={clan.id}>{clan.name}</option>
                      ))}
                    </select>
                    {errors.clan_id && <p className="text-red-500 text-[10px]">{errors.clan_id.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Data de Nascimento</label>
                    <input 
                      type="date"
                      {...register('birthDate')}
                      className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all"
                    />
                    {errors.birthDate && <p className="text-red-500 text-[10px]">{errors.birthDate.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Data de Entrada</label>
                    <input 
                      type="date"
                      {...register('entryDate')}
                      className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all"
                    />
                    {errors.entryDate && <p className="text-red-500 text-[10px]">{errors.entryDate.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">ID ÚNICO</label>
                    <input 
                      {...register('uniqueId')}
                      className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all font-mono"
                    />
                    {errors.uniqueId && <p className="text-red-500 text-[10px]">{errors.uniqueId.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Status</label>
                    <select 
                      {...register('status')}
                      className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all appearance-none"
                    >
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Sexo</label>
                    <select 
                      {...register('gender')}
                      className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all appearance-none"
                    >
                      <option value="male">Masculino</option>
                      <option value="female">Feminino</option>
                    </select>
                    {errors.gender && <p className="text-red-500 text-[10px]">{errors.gender.message}</p>}
                  </div>
                  {!editingStudent && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Senha</label>
                        <button type="button" onClick={generatePassword} className="text-[10px] text-[#F74C00] hover:text-[#ff5a14] font-bold">GERAR SENHA</button>
                      </div>
                      <input 
                        type="text"
                        {...register('password')}
                        className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all"
                        placeholder="Insira ou gere uma senha"
                      />
                      {errors.password && <p className="text-red-500 text-[10px]">{errors.password.message}</p>}
                    </div>
                  )}
                </div>

                {editingStudent && (
                  <div className="space-y-2 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Alterar Senha (Opcional)</label>
                      <button type="button" onClick={generatePassword} className="text-[10px] text-[#F74C00] hover:text-[#ff5a14] font-bold">GERAR SENHA</button>
                    </div>
                    <input 
                      type="password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setValue('password', e.target.value);
                      }}
                      className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all"
                      placeholder="Deixe em branco para manter a atual"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Notas Administrativas</label>
                  <textarea 
                    {...register('notes')}
                    rows={3}
                    className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all resize-none"
                    placeholder="Adicione notas internas sobre o aluno..."
                  />
                </div>

                {formError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm">
                    {formError}
                  </div>
                )}

                <div className="pt-4 flex items-center justify-end gap-4">
                  <button 
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 text-gray-400 hover:text-white font-bold transition-all"
                  >
                    CANCELAR
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#F74C00] hover:bg-[#ff5a14] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={18} />}
                    {editingStudent ? 'SALVAR ALTERAÇÕES' : 'CRIAR JOGADOR'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Achievement Assignment Modal */}
      <AnimatePresence>
        {isAssigningAchievements && (
          <div className="fixed inset-0 z-[10000] flex items-start justify-center p-4 md:p-10 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#151518] border border-white/10 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl my-auto"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div>
                  <h3 className="text-xl font-display font-bold">ATRIBUIR CONQUISTAS</h3>
                  <p className="text-xs text-gray-500 mt-1">Jogador: {isAssigningAchievements.firstName} {isAssigningAchievements.lastName}</p>
                </div>
                <button onClick={() => setIsAssigningAchievements(null)} className="p-2 text-gray-500 hover:text-white rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-3">
                {achievements.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 italic">
                    Nenhuma conquista definida no sistema.
                  </div>
                ) : (
                  achievements.map((achievement) => {
                    const achievementData = isAssigningAchievements.achievements?.find((a: any) => a.achievementId === achievement.id);
                    const isUnlocked = !!achievementData;
                    const isToggling = togglingAchievementId === achievement.id;

                    return (
                      <div
                        key={achievement.id}
                        className={cn(
                          "w-full p-4 rounded-2xl border transition-all relative overflow-hidden",
                          isUnlocked 
                            ? "bg-[#F74C00]/10 border-[#F74C00]/30" 
                            : "bg-[#0A0A0B] border-white/5",
                          isToggling && "opacity-60 grayscale-[0.5]"
                        )}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0",
                              isUnlocked ? "bg-[#F74C00] text-black shadow-lg shadow-orange-500/20" : "bg-white/5 text-gray-700"
                            )}>
                              {isToggling ? <Loader2 size={24} className="animate-spin" /> : <Trophy size={24} />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-base text-white truncate">{achievement.name}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">{achievement.category}</span>
                                <span className="hidden xs:block w-1 h-1 rounded-full bg-gray-700"></span>
                                {achievement.type === 'level' ? (
                                  <span className="text-[10px] text-[#FFDA1F] font-bold font-mono uppercase">ALVO: NÍVEL {achievement.required_level}</span>
                                ) : (
                                  <span className="text-[10px] text-[#FFDA1F] font-bold font-mono uppercase">RECOMPENSA: +{achievement.level} NÍVEL</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => toggleAchievement(isAssigningAchievements, achievement.id)}
                            disabled={isToggling}
                            className={cn(
                              "w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border flex items-center justify-center gap-2",
                              isUnlocked 
                                ? "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20" 
                                : "bg-[#F74C00] border-[#F74C00] text-white hover:bg-[#ff5a14] shadow-lg shadow-orange-500/20",
                              isToggling && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {isToggling ? (
                              <>
                                <Loader2 size={14} className="animate-spin" />
                                PROCESSANDO...
                              </>
                            ) : (
                              isUnlocked ? 'REMOVER' : 'ATRIBUIR'
                            )}
                          </button>
                        </div>
                        {isToggling && (
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            className="absolute bottom-0 left-0 h-1 bg-[#F74C00]"
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end">
                <button 
                  onClick={() => setIsAssigningAchievements(null)}
                  className="bg-white/5 hover:bg-white/10 text-white px-8 py-3 rounded-xl font-bold transition-all"
                >
                  CONCLUÍDO
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#151518] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
                  <Trash2 size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold">EXCLUIR ALUNO?</h3>
                  <p className="text-sm text-gray-500 mt-2">Esta ação não pode ser desfeita. Todos os dados do aluno serão perdidos.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button 
                    onClick={() => setDeletingId(null)}
                    className="w-full sm:flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all"
                  >
                    CANCELAR
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="w-full sm:flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all"
                  >
                    EXCLUIR
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
