'use client';

import React, { useEffect, useState } from 'react';
import { 
  Trophy, 
  Shield, 
  Star, 
  Zap, 
  Target, 
  Flame, 
  Sword, 
  Medal, 
  Crown,
  Lock,
  Award,
  Gamepad2,
  Rocket,
  Ghost,
  Dribbble,
  Heart,
  Lightbulb,
  Music,
  Camera,
  Coffee,
  BookOpen,
  Compass,
  Map,
  Flag,
  Anchor,
  Wind,
  Droplets,
  Cloud,
  Moon,
  Sun,
  Gamepad,
  Joystick,
  Puzzle,
  Dices,
  Skull,
  Axe,
  Hammer,
  Wrench,
  Pickaxe,
  Gem,
  Coins,
  Wallet,
  Key,
  Lock as LockIcon,
  Unlock,
  Eye,
  Bell,
  CheckCircle,
  Upload
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from './AuthGuard';
import { supabase } from '@/lib/supabase';

const AVAILABLE_ICONS: Record<string, any> = {
  Trophy, Star, Shield, Zap, Flame, Sword, Target, Crown, Medal, Award,
  Gamepad2, Rocket, Ghost, Dribbble, Heart, Lightbulb, Music, Camera,
  Coffee, BookOpen, Compass, Map, Flag, Anchor, Wind, Droplets, Cloud,
  Moon, Sun, Gamepad, Joystick, Puzzle, Dices, Skull, Axe, Hammer,
  Wrench, Pickaxe, Gem, Coins, Wallet, Key, Lock, Unlock, Eye, Bell,
  CheckCircle
};

export function AchievementsGrid() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [studentAchievements, setStudentAchievements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const getIconComponent = (iconName: string) => {
    if (iconName?.startsWith('data:image')) {
      return function CustomIcon() {
        return (
          <div className="w-full h-full relative">
            <img src={iconName} alt="Custom Icon" className="w-full h-full object-contain" />
          </div>
        );
      };
    }
    return AVAILABLE_ICONS[iconName] || Trophy;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch achievements
        const { data: achData } = await supabase.from('achievements').select('*');
        if (achData) setAchievements(achData);

        // Fetch categories
        const { data: catData } = await supabase.from('categories').select('*');
        if (catData) {
          const mappedCats = catData.map(c => ({
            id: c.id,
            name: c.name,
            color: c.color,
            secondaryColor: c.secondary_color
          }));
          setCategories(mappedCats);
        }

        // Fetch student's achievements
        if (user?.email) {
          const { data: student } = await supabase
            .from('students')
            .select('achievements')
            .eq('email', user.email)
            .single();
          
          if (student?.achievements) {
            setStudentAchievements(student.achievements.map((a: any) => a.achievementId));
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching achievements grid data:', error);
      }
    };

    fetchData();

    const achChannel = supabase
      .channel('public:achievements_grid')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'achievements' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(achChannel);
    };
  }, [user]);

  if (loading) return <div className="p-10 text-center text-gray-500">Carregando conquistas...</div>;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-black tracking-tight">CONQUISTAS</h2>
          <p className="text-gray-500 mt-1">Desbloqueie emblemas participando de atividades do mundo real.</p>
        </div>
        <div className="flex items-center gap-4 bg-[#151518] border border-white/5 px-6 py-3 rounded-2xl min-w-[200px]">
          <div className="flex-1 text-right">
            <p className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Desbloqueadas</p>
            <p className="text-xl font-display font-black text-[#FFDA1F]">{studentAchievements.length} / {achievements.length}</p>
            <div className="mt-1 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(studentAchievements.length / achievements.length) * 100}%` }}
                className="h-full bg-[#FFDA1F]"
              />
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FFDA1F]/10 flex items-center justify-center text-[#FFDA1F] shrink-0">
            <Trophy size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {achievements.map((achievement, i) => {
          const isUnlocked = studentAchievements.includes(achievement.id);
          const Icon = getIconComponent(achievement.icon);
          
          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              whileHover={{ scale: 1.02, translateY: -5 }}
              transition={{ 
                delay: i * 0.05,
                type: "spring",
                stiffness: 260,
                damping: 20
              }}
              className={`relative group rounded-3xl p-6 border transition-all duration-500 overflow-hidden ${
                isUnlocked 
                  ? 'bg-[#151518] border-white/10 shadow-lg shadow-black/20' 
                  : 'bg-[#0F0F12] border-white/5 opacity-60 grayscale'
              }`}
              style={isUnlocked ? { 
                borderColor: achievement.type === 'level' ? 'rgba(255, 218, 31, 0.3)' : `${categories.find(c => c.id === achievement.category)?.color}4D` || 'rgba(255, 255, 255, 0.1)'
              } : {}}
            >
              {/* Background Glow & Shimmer */}
              {isUnlocked && (
                <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: [0.4, 0.8, 0.4],
                        scale: [1, 1.3, 1]
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full transition-all duration-500" 
                      style={{ 
                        backgroundColor: achievement.type === 'level' ? 'rgba(255, 218, 31, 0.15)' : `${categories.find(c => c.id === achievement.category)?.color}26` || 'rgba(255, 255, 255, 0.05)'
                      }}
                    />
                  <motion.div
                    animate={{
                      x: ['-100%', '200%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                      repeatDelay: 1
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none"
                  />
                </>
              )}

              <div className="relative z-10 space-y-4">
                <div className="flex items-start justify-between">
                  <motion.div 
                    animate={isUnlocked ? {
                      scale: [1, 1.08, 1],
                      filter: [
                        `drop-shadow(0 0 4px ${achievement.type === 'level' ? 'rgba(255, 218, 31, 0.3)' : (categories.find(c => c.id === achievement.category)?.color || 'rgba(255, 255, 255, 0.1)') + '4D'})`,
                        `drop-shadow(0 0 20px ${achievement.type === 'level' ? 'rgba(255, 218, 31, 0.7)' : (categories.find(c => c.id === achievement.category)?.color || 'rgba(255, 255, 255, 0.3)') + 'B3'})`,
                        `drop-shadow(0 0 4px ${achievement.type === 'level' ? 'rgba(255, 218, 31, 0.3)' : (categories.find(c => c.id === achievement.category)?.color || 'rgba(255, 255, 255, 0.1)') + '4D'})`
                      ]
                    } : {}}
                    transition={isUnlocked ? {
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    } : {}}
                    whileHover={isUnlocked ? { 
                      rotate: 360, 
                      scale: 1.2,
                      transition: { duration: 0.8, ease: "backOut" }
                    } : {}}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 relative ${
                    isUnlocked 
                      ? 'text-black shadow-lg' 
                      : 'bg-white/5 text-gray-600'
                  }`}
                  style={isUnlocked ? {
                    background: achievement.type === 'level' 
                      ? 'linear-gradient(to bottom right, #FFDA1F, #F74C00)' 
                      : `linear-gradient(to bottom right, ${categories.find(c => c.id === achievement.category)?.color || '#F74C00'}, ${categories.find(c => c.id === achievement.category)?.secondaryColor || categories.find(c => c.id === achievement.category)?.color || '#F74C00'})`,
                    boxShadow: achievement.type === 'level' ? '0 10px 15px -3px rgba(255, 218, 31, 0.2)' : `0 10px 15px -3px ${categories.find(c => c.id === achievement.category)?.color}33`
                  } : {}}
                  >
                    {isUnlocked ? (
                      <>
                        <motion.div
                          animate={{ 
                            rotate: [0, 10, -10, 0],
                          }}
                          transition={{ 
                            duration: 4, 
                            repeat: Infinity, 
                            ease: "easeInOut" 
                          }}
                          className="relative z-10"
                        >
                          <Icon size={28} />
                        </motion.div>
                        {/* Shine effect on the icon itself */}
                        <motion.div
                          animate={{
                            left: ['-100%', '200%'],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            repeatDelay: 3
                          }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 pointer-events-none z-20"
                        />
                      </>
                    ) : (
                      <LockIcon size={24} />
                    )}
                  </motion.div>
                  <span 
                    className={`text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full border transition-colors`}
                    style={{ 
                      backgroundColor: isUnlocked 
                        ? (achievement.type === 'level' ? 'rgba(255, 218, 31, 0.1)' : `${categories.find(c => c.id === achievement.category)?.color}1A` || 'rgba(255, 255, 255, 0.05)')
                        : 'rgba(255, 255, 255, 0.05)',
                      borderColor: isUnlocked
                        ? (achievement.type === 'level' ? 'rgba(255, 218, 31, 0.2)' : `${categories.find(c => c.id === achievement.category)?.color}33` || 'rgba(255, 255, 255, 0.05)')
                        : 'rgba(255, 255, 255, 0.05)',
                      color: isUnlocked
                        ? (achievement.type === 'level' ? '#FFDA1F' : categories.find(c => c.id === achievement.category)?.color || '#9ca3af')
                        : '#4b5563'
                    }}
                  >
                    {categories.find(c => c.id === achievement.category)?.name || achievement.category}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className={`text-lg font-display font-bold ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                    {achievement.name}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {achievement.description}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star size={12} className={isUnlocked ? 'text-[#FFDA1F]' : 'text-gray-700'} />
                    <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">
                      {achievement.type === 'level' ? `ALVO: NÍVEL ${achievement.requiredLevel}` : `GANHA: +${achievement.level} NÍVEL`}
                    </span>
                  </div>
                  {isUnlocked && (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ 
                        scale: [1, 1.05, 1],
                        opacity: 1 
                      }}
                      transition={{
                        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                      }}
                      className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-tighter"
                      style={{ color: achievement.type === 'level' ? '#FFDA1F' : categories.find(c => c.id === achievement.category)?.color || '#F74C00' }}
                    >
                      <Zap size={10} className="animate-pulse" />
                      Desbloqueado
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
