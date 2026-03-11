'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { 
  Trophy, 
  Target, 
  Zap, 
  Star, 
  ArrowUpRight,
  Shield,
  Flame,
  Sword,
  Lock,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from './AuthGuard';
import { getAvatarUrl } from '@/lib/utils';
import { StudentAvatar } from './StudentAvatar';

import { supabase } from '@/lib/supabase';
import { useCallback } from 'react';

export function DashboardHome() {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState<any>(null);
  const [currentMission, setCurrentMission] = useState<any>(null);
  const [lockedMission, setLockedMission] = useState<any>(null);
  const [eventMission, setEventMission] = useState<any>(null);
  const [rankPosition, setRankPosition] = useState<string>('...');
  const [nextLevelTarget, setNextLevelTarget] = useState<number>(10);
  const [nextLevelAchievement, setNextLevelAchievement] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!user || !user.email) return;

    try {
      // 1. Fetch student data
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('email', user.email)
        .single();

      if (studentError && studentError.code !== 'PGRST116') throw studentError;
      
      const mappedStudent = student ? {
        id: student.id,
        firstName: student.first_name,
        lastName: student.last_name,
        email: student.email,
        class: student.class,
        level: student.level,
        achievements: student.achievements || []
      } : null;
      
      setStudentData(mappedStudent);

      // 2. Fetch all students for rank
      const { data: allStudents } = await supabase
        .from('students')
        .select('email, level, achievements')
        .order('level', { ascending: false });

      if (allStudents) {
        const sorted = [...allStudents].sort((a: any, b: any) => {
          if ((b.level || 0) !== (a.level || 0)) return (b.level || 0) - (a.level || 0);
          return (b.achievements?.length || 0) - (a.achievements?.length || 0);
        });
        const pos = sorted.findIndex((s: any) => s.email === user.email);
        if (pos !== -1) setRankPosition(`#${pos + 1}`);
      }

      // 3. Fetch achievements and missions
      const { data: achievements } = await supabase.from('achievements').select('*');
      const { data: missions } = await supabase.from('missions').select('*');

      if (achievements && missions) {
        const now = new Date();
        
        // Event mission
        const activeTimed = missions
          .filter((m: any) => {
            if (m.type !== 'timed' && m.type !== 'event') return false;
            if (!m.deadline) return true;
            return new Date(m.deadline) > now;
          })
          .sort((a: any, b: any) => new Date(a.deadline || 0).getTime() - new Date(b.deadline || 0).getTime());
        
        setEventMission(activeTimed[0] || null);

        if (mappedStudent) {
          const studentLevel = mappedStudent.level || 1;
          const studentAchievements = mappedStudent.achievements || [];

          // Standard missions
          const standardMissions = missions
            .filter((m: any) => m.type === 'standard')
            .sort((a: any, b: any) => (a.sequence || 0) - (b.sequence || 0));

          const completedMissionIds = studentAchievements
            .map((sa: any) => {
              const ach = achievements.find(a => a.id === sa.achievementId);
              return missions.find(m => m.linked_achievement_id === ach?.id)?.id;
            })
            .filter(Boolean);

          const nextMission = standardMissions.find(m => !completedMissionIds.includes(m.id));
          setCurrentMission(nextMission || null);

          if (nextMission) {
            const nextIdx = standardMissions.indexOf(nextMission);
            setLockedMission(standardMissions[nextIdx + 1] || null);
          }

          // Next level target
          const levelAchievements = achievements
            .filter(a => a.type === 'level')
            .sort((a, b) => (a.required_level || 0) - (b.required_level || 0));

          const nextLevelAch = levelAchievements.find(a => (a.required_level || 0) > studentLevel);
          if (nextLevelAch) {
            setNextLevelAchievement(nextLevelAch);
            setNextLevelTarget(nextLevelAch.required_level);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('public:dashboard')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Auto-leveling logic
  useEffect(() => {
    if (!studentData || !user) return;

    const checkAutoUnlock = async () => {
      const { data: achievements } = await supabase
        .from('achievements')
        .select('*')
        .eq('type', 'level');

      if (!achievements) return;

      const studentLevel = studentData.level || 1;
      const studentAchievements = studentData.achievements || [];

      const toUnlock = achievements.filter(a => 
        (a.required_level || 0) <= studentLevel && 
        !studentAchievements.some((sa: any) => sa.achievementId === a.id)
      );

      if (toUnlock.length > 0) {
        const newAchievements = [
          ...studentAchievements,
          ...toUnlock.map(a => ({ achievementId: a.id, level: a.level || 0 }))
        ];

        // Recalculate level
        const { data: allAchievements } = await supabase.from('achievements').select('*');
        const newLevel = newAchievements.reduce((sum: number, sa: any) => {
          const def = allAchievements?.find(d => d.id === sa.achievementId);
          return sum + (def?.level || 0);
        }, 0);

        await supabase
          .from('students')
          .update({ 
            achievements: newAchievements,
            level: newLevel,
            updated_at: new Date().toISOString()
          })
          .eq('id', studentData.id);
      }
    };

    checkAutoUnlock();
  }, [studentData, user]);

  const stats = [
    { label: 'Total de Conquistas', value: studentData?.achievements?.length || 0, icon: Trophy, color: 'text-[#F74C00]' },
    { label: 'Nível Atual', value: studentData?.level || 0, icon: Star, color: 'text-[#FFDA1F]' },
    { label: 'Rank Global', value: rankPosition, icon: Shield, color: 'text-blue-400' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-[#151518] border border-white/5 p-6 md:p-10">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#F74C00]/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <div className="w-24 h-24 md:w-32 md:h-32">
              <StudentAvatar 
                src={user?.user_metadata?.avatar_url || undefined}
                firstName={user?.user_metadata?.full_name?.split(' ')[0] || 'User'}
                lastName={user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || ''}
                gender={studentData?.gender}
                className="w-full h-full"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 md:-bottom-3 md:-right-3 w-8 h-8 md:w-10 md:h-10 bg-[#FFDA1F] text-black font-black rounded-lg flex items-center justify-center border-4 border-[#151518] text-xs md:text-sm">
              {studentData?.level || 1}
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight">
                BEM-VINDO DE VOLTA, <span className="text-[#F74C00] uppercase">{user?.user_metadata?.full_name?.split(' ')[0] || 'JOGADOR'}</span>
              </h1>
              <p className="text-gray-400 mt-1 text-sm md:text-base">Sua jornada continua. 3 novas missões disponíveis hoje.</p>
            </div>
            
            <div className="space-y-2 max-w-md mx-auto md:mx-0">
              <div className="flex justify-between text-xs font-mono font-bold uppercase tracking-wider">
                <span className="text-gray-500">
                  {nextLevelAchievement ? `Próximo Alvo: ${nextLevelAchievement.name}` : 'Progresso de Nível'}
                </span>
                <span className="text-[#FFDA1F]">
                  {Math.min(100, Math.round(((studentData?.level || 0) / nextLevelTarget) * 100))}%
                </span>
              </div>
              <div className="h-3 bg-[#0A0A0B] rounded-full overflow-hidden border border-white/5 p-0.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, ((studentData?.level || 0) / nextLevelTarget) * 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-[#F74C00] to-[#FFDA1F] rounded-full shadow-[0_0_10px_rgba(247,76,0,0.3)]"
                />
              </div>
              <p className="text-[10px] text-gray-500 font-mono">
                Nível {studentData?.level || 0} / {nextLevelTarget}
              </p>
            </div>
          </div>

          <button className="w-full md:w-auto px-8 py-4 bg-[#F74C00] hover:bg-[#ff5a14] text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">
            <Zap size={20} />
            RETOMAR MISSÃO
          </button>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#151518] border border-white/5 p-6 rounded-2xl flex items-center gap-5 group hover:border-[#F74C00]/30 transition-all"
          >
            <div className={`w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-display font-black mt-1">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Next Mission & Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#151518] border border-white/5 rounded-3xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-bold flex items-center gap-2">
              <Target className="text-[#F74C00]" size={24} />
              MISSÕES DA JORNADA
            </h3>
          </div>
          
          <div className="space-y-4">
            {/* Current Mission */}
            <div>
              <p className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest mb-2">Missão Atual</p>
              {currentMission ? (
                <div className="bg-[#0A0A0B] border border-[#F74C00]/20 rounded-2xl p-6 flex items-start gap-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#F74C00]/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-[#F74C00]/10 transition-all"></div>
                  <div className="w-12 h-12 rounded-xl bg-[#F74C00]/10 flex items-center justify-center text-[#F74C00] shrink-0 relative z-10">
                    <Sword size={24} />
                  </div>
                  <div className="space-y-2 relative z-10">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-lg uppercase">{currentMission.title}</h4>
                      <span className="text-[9px] font-mono font-bold bg-[#F74C00] text-white px-2 py-0.5 rounded">ATIVO</span>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {currentMission.description || 'Nenhuma descrição disponível.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0A0A0B] border border-white/5 rounded-2xl p-6 text-center text-gray-500 italic text-sm">
                  Você completou todas as missões disponíveis!
                </div>
              )}
            </div>

            {/* Next Mission (Locked) */}
            {lockedMission && (
              <div>
                <p className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest mb-2">Próximo Desafio</p>
                <div className="bg-[#0A0A0B]/50 border border-white/5 rounded-2xl p-6 flex items-start gap-4 opacity-50 grayscale">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 shrink-0">
                    <Lock size={24} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-lg uppercase">{lockedMission.title}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Complete a missão anterior para desbloquear.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#151518] border border-white/5 rounded-3xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-bold flex items-center gap-2">
              <Flame className="text-[#FFDA1F]" size={24} />
              EVENTO TEMPORÁRIO
            </h3>
            <span className="text-[10px] font-mono font-bold bg-[#FFDA1F]/10 text-[#FFDA1F] px-3 py-1 rounded-full border border-[#FFDA1F]/20 animate-pulse">
              AO VIVO
            </span>
          </div>
          
          {eventMission ? (
            <div className="bg-[#0A0A0B] border border-white/5 rounded-2xl p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#FFDA1F]/10 flex items-center justify-center text-[#FFDA1F] shrink-0">
                <Zap size={24} />
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-lg uppercase">{eventMission.title}</h4>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {eventMission.description || 'Nenhuma descrição disponível.'}
                </p>
                {eventMission.deadline && (
                  <p className="text-[10px] font-mono text-[#FFDA1F] uppercase mt-2">
                    Expira em: {eventMission.deadline.toDate ? eventMission.deadline.toDate().toLocaleDateString() : new Date(eventMission.deadline).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#0A0A0B] border border-white/5 rounded-2xl p-6 text-center text-gray-500 italic text-sm">
              Nenhum evento temporário ativo.
            </div>
          )}
          
          <div className="pt-4 grid grid-cols-2 gap-4">
            <div className="bg-[#0A0A0B] p-4 rounded-2xl border border-white/5 text-center">
              <p className="text-[10px] font-mono text-gray-500 uppercase">Sequência Semanal</p>
              <p className="text-2xl font-display font-black text-[#FFDA1F]">14 DIAS</p>
            </div>
            <div className="bg-[#0A0A0B] p-4 rounded-2xl border border-white/5 text-center">
              <p className="text-[10px] font-mono text-gray-500 uppercase">Pontos de Habilidade</p>
              <p className="text-2xl font-display font-black text-blue-400">2.450</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
