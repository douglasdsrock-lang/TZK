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
  Clock,
  ChevronRight,
  Megaphone,
  X,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthGuard';
import { getAvatarUrl, formatDate } from '@/lib/utils';
import { StudentAvatar } from './StudentAvatar';
import { getCharacterById } from '@/lib/characters';

import { supabase } from '@/lib/supabase';
import { useCallback } from 'react';

export function DashboardHome({ themeColor: propThemeColor }: { themeColor?: string }) {
  const { user, isAdmin } = useAuth();
  const [studentData, setStudentData] = useState<any>(null);
  const [currentMission, setCurrentMission] = useState<any>(null);
  const [lockedMission, setLockedMission] = useState<any>(null);
  const [eventMission, setEventMission] = useState<any>(null);
  const [eventAchievement, setEventAchievement] = useState<any>(null);
  const [rankPosition, setRankPosition] = useState<string>('...');
  const [nextLevelTarget, setNextLevelTarget] = useState<number>(10);
  const [nextLevelAchievement, setNextLevelAchievement] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!user || !user.email) return;

    try {
      console.log('Buscando dados para:', user.email, 'Admin:', isAdmin);
      
      // 1. Fetch student data
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (studentError) throw studentError;
      
      let finalStudent = student;
      
      // Se for admin e não tiver registro, criar um automaticamente para testes
      if (!finalStudent && isAdmin) {
        console.log('Admin sem registro de aluno. Criando registro de teste...');
        const { data: newStudent, error: createError } = await supabase
          .from('students')
          .insert([{
            id: user.id,
            email: user.email,
            first_name: 'Admin',
            last_name: 'System',
            level: 1,
            gender: 'male',
            class: 'Admin',
            achievements: []
          }])
          .select()
          .single();
        
        if (!createError) {
          finalStudent = newStudent;
          alert('Perfil de administrador criado com sucesso! Recarregando dados...');
        } else {
          console.error('Erro ao criar registro de admin:', createError);
          alert(`Erro ao criar perfil de admin: ${JSON.stringify(createError, null, 2)}`);
        }
      }

      const mappedStudent = finalStudent ? {
        id: finalStudent.id,
        firstName: finalStudent.first_name,
        lastName: finalStudent.last_name,
        email: finalStudent.email,
        class: finalStudent.class,
        level: finalStudent.level,
        gender: finalStudent.gender,
        characterId: finalStudent.character_id,
        achievements: finalStudent.achievements || []
      } : null;
      
      setStudentData(mappedStudent);

      // 2. Fetch all students for rank
      const { data: allStudents } = await supabase
        .from('students')
        .select('id, email, level, achievements')
        .order('level', { ascending: false });

      if (allStudents) {
        const sorted = [...allStudents].sort((a: any, b: any) => {
          if ((b.level || 0) !== (a.level || 0)) return (b.level || 0) - (a.level || 0);
          return (b.achievements?.length || 0) - (a.achievements?.length || 0);
        });
        const pos = sorted.findIndex((s: any) => s.id === user.id || s.email === user.email);
        if (pos !== -1) setRankPosition(`#${pos + 1}`);
      }

      // 3. Fetch achievements and missions
      const { data: achievements } = await supabase.from('achievements').select('*');
      const { data: missions } = await supabase.from('missions').select('*');

      if (achievements && missions) {
        const now = new Date();
        
        if (mappedStudent || isAdmin) {
          const studentLevel = mappedStudent?.level || 1;
          const studentAchievements = mappedStudent?.achievements || [];

          const completedMissionIds = studentAchievements
            .map((sa: any) => {
              const ach = achievements.find(a => a.id === sa.achievementId);
              return missions.find(m => m.linked_achievement_id === ach?.id)?.id;
            })
            .filter(Boolean);

          // Event mission
          const activeTimed = missions
            .filter((m: any) => {
              if (m.type !== 'timed' && m.type !== 'event') return false;
              if (completedMissionIds.includes(m.id)) return false; // Filter out completed
              if (!m.deadline) return true;
              const d = new Date(m.deadline);
              return !isNaN(d.getTime()) && d > now;
            })
            .sort((a: any, b: any) => {
              const da = new Date(a.deadline || 0).getTime();
              const db = new Date(b.deadline || 0).getTime();
              return (isNaN(da) ? 0 : da) - (isNaN(db) ? 0 : db);
            });
          
          setEventMission(activeTimed[0] || null);
          if (activeTimed[0]?.linked_achievement_id) {
            const ach = achievements.find(a => a.id === activeTimed[0].linked_achievement_id);
            setEventAchievement(ach || null);
          } else {
            setEventAchievement(null);
          }

          // Standard missions
          const standardMissions = missions
            .filter((m: any) => m.type === 'standard')
            .sort((a: any, b: any) => (a.sequence || 0) - (b.sequence || 0));

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

          // 4. Fetch Announcements
          const { data: annData } = await supabase
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(3);
          
          setAnnouncements(annData || []);
        }
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error.message || error);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    fetchData();

    const studentsChannel = supabase
      .channel('public:dashboard_students')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => fetchData())
      .subscribe();

    const missionsChannel = supabase
      .channel('public:dashboard_missions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'missions' }, () => fetchData())
      .subscribe();

    const achievementsChannel = supabase
      .channel('public:dashboard_achievements')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'achievements' }, () => fetchData())
      .subscribe();

    const announcementsChannel = supabase
      .channel('public:dashboard_announcements')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(studentsChannel);
      supabase.removeChannel(missionsChannel);
      supabase.removeChannel(achievementsChannel);
      supabase.removeChannel(announcementsChannel);
    };
  }, [user, fetchData]);

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

        // Create notifications for auto-unlocked achievements
        const notifications = toUnlock.map(a => ({
          user_id: studentData.id,
          title: 'Conquista Desbloqueada! 🏆',
          message: `Você liberou a conquista: ${a.name}`,
          type: 'achievement'
        }));

        // Notification for level up if level increased
        if (newLevel > (studentData.level || 0)) {
          notifications.push({
            user_id: studentData.id,
            title: 'Subiu de Nível! ⚡',
            message: `Parabéns! Você alcançou o nível ${newLevel}`,
            type: 'level'
          });
        }

        await supabase.from('notifications').insert(notifications);
      }
    };

    checkAutoUnlock();
  }, [studentData, user]);

  const character = getCharacterById(studentData?.characterId);
  const themeColor = propThemeColor || character?.color || '#F74C00';

  const stats = [
    { 
      label: 'Total de Conquistas', 
      value: studentData?.achievements?.length || 0, 
      icon: Trophy, 
      color: themeColor
    },
    { 
      label: 'Nível Atual', 
      value: studentData?.level || 0, 
      icon: Star, 
      color: themeColor
    },
    { 
      label: 'Rank Global', 
      value: rankPosition, 
      icon: Shield, 
      color: themeColor
    },
  ];

  return (
    <div 
      className="space-y-8 animate-in fade-in duration-700"
      style={{ '--theme-color': themeColor } as any}
    >
      {/* Welcome Hero */}
      <section 
        className="relative z-[60] overflow-visible rounded-3xl bg-white/5 backdrop-blur-xl border p-6 md:p-10 shadow-[0_0_40px_rgba(0,0,0,0.15)] mt-8 md:mt-12"
        style={{ 
          borderColor: `${themeColor}33`,
          boxShadow: `0 0 40px ${themeColor}26`
        }}
      >
        <div 
          className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none rounded-3xl"
          style={{ backgroundImage: `linear-gradient(to bottom right, rgba(255,255,255,0.1), ${themeColor}0D, ${themeColor}1A)` }}
        ></div>
        <div 
          className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-transparent to-transparent pointer-events-none rounded-3xl"
          style={{ backgroundImage: `linear-gradient(to left, ${themeColor}1A, transparent)` }}
        ></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="relative mt-12 mb-16 md:mt-0 md:mb-0">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-[#0A0A0B] rounded-2xl border border-white/10 flex items-center justify-center overflow-visible">
              {character ? (
                <div className="relative w-full h-full">
                  <Image 
                    src={character.fullImage}
                    alt={character.name}
                    width={240}
                    height={240}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220%] max-w-none h-auto z-[991] pointer-events-none"
                    style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.8))' }}
                    unoptimized
                  />
                </div>
              ) : (
                <StudentAvatar 
                  src={user?.user_metadata?.avatar_url || undefined}
                  firstName={user?.user_metadata?.full_name?.split(' ')[0] || 'User'}
                  lastName={user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || ''}
                  gender={studentData?.gender}
                  className="w-full h-full"
                />
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 md:-bottom-3 md:-right-3 w-8 h-8 md:w-10 md:h-10 bg-[#FFDA1F] text-black font-black rounded-lg flex items-center justify-center border-4 border-[#151518] text-xs md:text-sm z-30">
              {studentData?.level || 1}
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-4 md:pl-16">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight">
                BEM-VINDO, <span className="uppercase" style={{ color: themeColor }}>{studentData?.firstName || user?.user_metadata?.full_name?.split(' ')[0] || 'JOGADOR'}</span>
              </h1>
              <p className="text-gray-400 mt-1 text-sm md:text-base">Sua jornada continua. {eventMission ? '1 evento especial' : '3 novas missões'} disponível hoje.</p>
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
                  className="h-full rounded-full"
                  style={{ 
                    background: `linear-gradient(to right, ${themeColor}, #FFDA1F)`,
                    boxShadow: `0 0 10px ${themeColor}4D`
                  }}
                />
              </div>
              <p className="text-[10px] text-gray-500 font-mono">
                Nível {studentData?.level || 0} / {nextLevelTarget}
              </p>
            </div>
          </div>
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
            className="relative overflow-hidden bg-[#151518]/40 backdrop-blur-xl border p-6 rounded-2xl flex items-center gap-5 group hover:scale-[1.02] transition-all duration-300"
            style={{ borderColor: `${stat.color}33` }}
          >
            <div 
              className="absolute inset-0 opacity-50 pointer-events-none" 
              style={{ backgroundImage: `linear-gradient(to bottom right, ${stat.color}1A, transparent)` }}
            />
            
            <div 
              className="relative z-10 w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform"
              style={{ color: stat.color }}
            >
              <stat.icon size={28} />
            </div>
            <div className="relative z-10">
              <p className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-display font-black mt-1">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Announcements Panel */}
      {announcements.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Megaphone className="h-5 w-5" style={{ color: themeColor }} />
            <h3 className="text-lg font-display font-bold uppercase tracking-wider text-white">Comunicados</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {announcements.map((ann, i) => (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSelectedAnnouncement(ann)}
                className="group relative cursor-pointer rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 transition-all hover:bg-white/[0.08] hover:translate-y-[-4px]"
                style={{ 
                  '--hover-color': themeColor,
                } as React.CSSProperties}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-1.5 h-1.5 rounded-full" 
                      style={{ backgroundColor: themeColor, boxShadow: `0 0 8px ${themeColor}` }}
                    />
                    <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-tighter">
                      {formatDate(ann.created_at)}
                    </span>
                  </div>
                  <ArrowUpRight className="h-3 w-3 text-gray-600 group-hover:text-[var(--hover-color)] transition-colors" />
                </div>
                <h4 className="text-base font-bold text-white mb-2 line-clamp-1 group-hover:text-[var(--hover-color)] transition-colors">
                  {ann.title}
                </h4>
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                  {ann.content}
                </p>
                
                {/* Dynamic Border on Hover */}
                <div 
                  className="absolute inset-0 border border-transparent group-hover:border-[var(--hover-color)]/30 rounded-2xl transition-colors pointer-events-none"
                  style={{ '--hover-color': themeColor } as React.CSSProperties}
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Announcement Modal */}
      <AnimatePresence>
        {selectedAnnouncement && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAnnouncement(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#151518]/90 backdrop-blur-2xl shadow-2xl"
            >
              <div 
                className="absolute top-0 left-0 w-full h-1"
                style={{ backgroundColor: themeColor }}
              />
              
              <div className="p-8 md:p-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-xl bg-white/5"
                      style={{ color: themeColor }}
                    >
                      <Megaphone className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight">
                        Comunicado
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>Publicado em {formatDate(selectedAnnouncement.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedAnnouncement(null)}
                    className="p-2 rounded-full bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <h4 className="text-xl font-bold text-white leading-tight">
                    {selectedAnnouncement.title}
                  </h4>
                  <div className="h-px bg-white/5 w-full" />
                  <div className="max-h-[40vh] overflow-y-auto pr-4 custom-scrollbar">
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-lg">
                      {selectedAnnouncement.content}
                    </p>
                  </div>
                </div>

                <div className="mt-10 flex justify-end">
                  <button
                    onClick={() => setSelectedAnnouncement(null)}
                    className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-105 active:scale-95"
                    style={{ backgroundColor: themeColor }}
                  >
                    ENTENDIDO
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Next Mission & Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div 
          className="relative overflow-hidden bg-[#F74C00]/5 backdrop-blur-xl border rounded-3xl p-8 space-y-6"
          style={{ 
            backgroundColor: `${themeColor}0D`,
            borderColor: `${themeColor}33`
          }}
        >
          <div className="relative z-10 flex items-center justify-between">
            <h3 className="text-xl font-display font-bold flex items-center gap-2">
              <Target style={{ color: themeColor }} size={24} />
              SUAS MISSÕES
            </h3>
          </div>
          
          <div className="space-y-4">
            {/* Current Mission */}
            <div>
              <p className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest mb-2">Missão Atual</p>
              {currentMission ? (
                <div 
                  className="bg-white/[0.03] backdrop-blur-md border rounded-2xl p-6 flex items-start gap-4 relative overflow-hidden group"
                  style={{ borderColor: `${themeColor}26` }}
                >
                  <div 
                    className="absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 blur-2xl group-hover:opacity-100 opacity-50 transition-all"
                    style={{ backgroundColor: themeColor }}
                  ></div>
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 relative z-10"
                    style={{ backgroundColor: `${themeColor}1A`, color: themeColor }}
                  >
                    <Sword size={24} />
                  </div>
                  <div className="space-y-2 relative z-10">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-lg uppercase">{currentMission.title}</h4>
                      <span 
                        className="text-[9px] font-mono font-bold text-white px-2 py-0.5 rounded-full border"
                        style={{ backgroundColor: `${themeColor}33`, borderColor: `${themeColor}4D` }}
                      >ATIVO</span>
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

        <div 
          className="relative overflow-hidden bg-[#151518]/40 backdrop-blur-xl border rounded-3xl p-8 space-y-6"
          style={{ borderColor: `${themeColor}33` }}
        >
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: `linear-gradient(to bottom right, ${themeColor}0D, transparent)` }}
          ></div>
          <div className="relative z-10 flex items-center justify-between">
            <h3 className="text-xl font-display font-bold flex items-center gap-2">
              <Flame style={{ color: themeColor }} size={24} />
              EVENTO TEMPORÁRIO
            </h3>
            <span 
              className="text-[10px] font-mono font-bold px-3 py-1 rounded-full border animate-pulse"
              style={{ 
                backgroundColor: `${themeColor}1A`, 
                color: themeColor,
                borderColor: `${themeColor}33`
              }}
            >
              AO VIVO
            </span>
          </div>
          
          {eventMission ? (
            <div 
              className="bg-white/[0.03] backdrop-blur-md border rounded-2xl p-6 flex items-start gap-4"
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${themeColor}1A`, color: themeColor }}
              >
                <Zap size={24} />
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-lg uppercase">{eventMission.title}</h4>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {eventMission.description || 'Nenhuma descrição disponível.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-[#0A0A0B] border border-white/5 rounded-2xl p-6 text-center text-gray-500 italic text-sm">
              Nenhum evento temporário ativo.
            </div>
          )}
          
          <div className="pt-4 grid grid-cols-2 gap-4">
            <div className="bg-[#0A0A0B] p-4 rounded-2xl border border-white/5 text-center">
              <p className="text-[10px] font-mono text-gray-500 uppercase">Tempo Restante</p>
              <p className="text-xl md:text-2xl font-display font-black uppercase" style={{ color: themeColor }}>
                {eventMission?.deadline ? (() => {
                  const now = new Date();
                  const end = new Date(eventMission.deadline);
                  const diff = end.getTime() - now.getTime();
                  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                  return days > 0 ? `${days} DIAS` : 'HOJE';
                })() : '--'}
              </p>
            </div>
            <div className="bg-[#0A0A0B] p-4 rounded-2xl border border-white/5 text-center flex flex-col justify-center">
              <p className="text-[10px] font-mono text-gray-500 uppercase">Recompensa</p>
              <p className="text-sm md:text-base font-display font-black uppercase line-clamp-1" style={{ color: '#FFDA1F' }}>
                {eventAchievement ? eventAchievement.name : 'NENHUMA'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
