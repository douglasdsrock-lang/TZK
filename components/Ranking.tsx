'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Trophy, 
  Medal, 
  Star, 
  Search,
  Loader2,
  Crown,
  X as CloseIcon,
  User,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthGuard';
import { StudentAvatar } from './StudentAvatar';

import { supabase } from '@/lib/supabase';
import { soundManager } from '@/lib/sounds';
import { getCharacterById } from '@/lib/characters';
import Image from 'next/image';
import { CharacterSpeech } from './CharacterSpeech';

export function Ranking({ themeColor }: { themeColor: string }) {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);

  const fetchRanking = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*, clans(name, icon)')
        .order('level', { ascending: false })
        .order('created_at', { ascending: true }); // Secondary sort

      if (error) throw error;
      
      // Map snake_case from Postgres to camelCase for the UI
      const mappedData = (data || []).map(s => ({
        id: s.id,
        firstName: s.first_name,
        lastName: s.last_name,
        email: s.email,
        clan: s.clans,
        level: s.level,
        gender: s.gender,
        characterId: s.character_id,
        achievements: s.achievements || []
      }));

      setStudents(mappedData);
      
      const current = mappedData.find(s => s.email === user?.email);
      if (current) {
        setCurrentUserData({
          ...current,
          rank: mappedData.indexOf(current) + 1,
          totalStudents: mappedData.length
        });
      }
    } catch (error) {
      console.error('Error fetching ranking:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchRanking();

    // Real-time subscription
    const channel = supabase
      .channel('public:students')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        fetchRanking();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRanking]);

  const filteredStudents = students.filter(s => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0: return 'text-[#FFDA1F]'; // Gold
      case 1: return 'text-gray-300';   // Silver
      case 2: return 'text-[#CD7F32]'; // Bronze
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-40">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-display font-black tracking-tight uppercase">RANKING GLOBAL</h2>
          <p className="text-gray-500 mt-1">Os melhores jogadores da temporada.</p>
        </div>
        <div className="relative max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text"
            placeholder="Buscar jogador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#151518] border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none transition-all"
            style={{ borderColor: 'rgba(255,255,255,0.05)' }}
            onFocus={(e) => e.currentTarget.style.borderColor = themeColor}
            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto" style={{ color: themeColor }} />
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="py-20 text-center bg-[#151518] rounded-3xl border border-white/5">
          <Trophy className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum jogador encontrado.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Ranking List */}
          <div className="bg-[#151518] border border-white/5 rounded-3xl overflow-hidden">
            <div className="hidden md:grid grid-cols-[80px_1fr_120px_120px_120px] px-8 py-4 bg-white/[0.02] border-b border-white/5 items-center gap-4">
              <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Pos</span>
              <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Jogador</span>
              <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest text-center">Clã</span>
              <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest text-center">Nível</span>
              <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest text-center">Conquistas</span>
            </div>
            
            <div className="divide-y divide-white/5">
              {filteredStudents.map((student, index) => {
                const isCurrentUser = student.email === user?.email;
                return (
                  <motion.div 
                    key={student.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      soundManager.playClick();
                      setSelectedStudent(student);
                    }}
                    className={cn(
                      "group transition-all cursor-pointer",
                      isCurrentUser ? "border-y" : "hover:bg-white/[0.02]"
                    )}
                    style={{ 
                      backgroundColor: isCurrentUser ? `${themeColor}1A` : undefined,
                      borderColor: isCurrentUser ? `${themeColor}33` : undefined
                    }}
                  >
                    <div className="grid grid-cols-[50px_1fr_auto] md:grid-cols-[80px_1fr_120px_120px_120px] items-center px-4 md:px-8 py-4 gap-4">
                      {/* Position */}
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-lg font-display font-black",
                          index < 3 ? getMedalColor(index) : (isCurrentUser ? "" : "text-gray-600")
                        )}
                        style={{ color: (isCurrentUser && index >= 3) ? themeColor : undefined }}
                        >
                          #{index + 1}
                        </span>
                      </div>

                      {/* Player */}
                      <div className="flex items-center gap-3 min-w-0">
                        <StudentAvatar 
                          firstName={student.firstName}
                          lastName={student.lastName}
                          gender={student.gender}
                          characterId={student.characterId}
                          size="md"
                          className={cn(
                            "shrink-0",
                            isCurrentUser && "border-[#F74C00]/50"
                          )}
                        />
                        <div className="truncate">
                          <p className={cn(
                            "font-bold uppercase truncate text-sm md:text-base",
                            isCurrentUser ? "" : "text-white"
                          )}
                          style={{ color: isCurrentUser ? themeColor : undefined }}
                          >
                            {student.firstName} {student.lastName} {isCurrentUser && "(VOCÊ)"}
                          </p>
                        </div>
                      </div>

                      {/* Clan */}
                      <div className="hidden md:flex justify-center items-center">
                        {student.clan?.icon ? (
                          <img src={student.clan.icon} alt={student.clan.name} className="w-8 h-8 object-contain" />
                        ) : (
                          <span className="text-xs font-mono text-gray-500">-</span>
                        )}
                      </div>

                      {/* Level & Achievements (Mobile: Compact, Desktop: Columns) */}
                      <div className="flex md:contents items-center gap-4">
                        {/* Level */}
                        <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2">
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-[#FFDA1F]/10 flex items-center justify-center text-[#FFDA1F]">
                            <Star size={14} fill="currentColor" />
                          </div>
                          <span className="text-sm md:text-xl font-display font-black text-white">
                            {student.level || 0}
                          </span>
                        </div>

                        {/* Achievements */}
                        <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2">
                          <div 
                            className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${themeColor}1A`, color: themeColor }}
                          >
                            <Trophy size={14} />
                          </div>
                          <span className="text-sm md:text-xl font-display font-black text-white">
                            {student.achievements?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Student Profile Popup */}
          <AnimatePresence>
            {selectedStudent && (
              <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedStudent(null)}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-2xl bg-[#151518]/60 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row"
                >
                  {/* Close Button */}
                  <button 
                    onClick={() => setSelectedStudent(null)}
                    className="absolute top-6 right-6 z-20 p-2 text-gray-500 hover:text-white transition-colors bg-black/20 rounded-full backdrop-blur-md"
                  >
                    <CloseIcon size={24} />
                  </button>

                  {/* Character Image Side */}
                  <div className="w-full md:w-1/2 relative aspect-square md:aspect-auto bg-gradient-to-br from-white/5 to-transparent flex items-end justify-center overflow-hidden">
                    {(() => {
                      const char = getCharacterById(selectedStudent.characterId);
                      if (char) {
                        return (
                          <>
                            <div 
                              className="absolute inset-0 opacity-20 blur-3xl"
                              style={{ backgroundColor: char.color }}
                            />
                            <motion.div
                              initial={{ y: 100, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.2, type: "spring", damping: 15 }}
                              className="relative z-10 w-full h-full"
                            >
                              <picture className="absolute inset-0 w-full h-full p-4">
                                <source srcSet={char.fullImage} type="image/avif" />
                                <img src={char.fullImageFallback} alt={char.name} className="w-full h-full object-contain object-bottom" />
                              </picture>
                            </motion.div>
                          </>
                        );
                      }
                      return (
                        <div className="w-full h-full flex items-center justify-center text-gray-700">
                          <User size={120} />
                        </div>
                      );
                    })()}
                  </div>

                  {/* Info Side */}
                  <div className="w-full md:w-1/2 p-8 flex flex-col justify-center space-y-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-[0.3em]">Perfil do Aluno</p>
                      <h3 className="text-3xl font-display font-black text-white uppercase tracking-tight">
                        {selectedStudent.firstName} {selectedStudent.lastName}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Award size={14} style={{ color: themeColor }} />
                        <span className="text-xs font-mono uppercase tracking-widest">{selectedStudent.class}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-1">
                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Nível Atual</p>
                        <div className="flex items-center gap-2 text-[#FFDA1F]">
                          <Star size={18} fill="currentColor" />
                          <span className="font-display font-black text-2xl">
                            {selectedStudent.level || 0}
                          </span>
                        </div>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-1">
                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Conquistas</p>
                        <div className="flex items-center gap-2" style={{ color: themeColor }}>
                          <Trophy size={18} />
                          <span className="font-display font-black text-2xl">
                            {selectedStudent.achievements?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={() => setSelectedStudent(null)}
                        className="w-full py-4 rounded-2xl font-display font-black text-lg tracking-widest transition-all active:scale-95 shadow-xl"
                        style={{ 
                          backgroundColor: themeColor,
                          color: '#000',
                          boxShadow: `0 10px 20px ${themeColor}33`
                        }}
                      >
                        VOLTAR AO RANKING
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {currentUserData && (
        <CharacterSpeech 
          characterId={currentUserData.characterId}
          message={(() => {
            const { rank, totalStudents } = currentUserData;
            if (rank === 1) return "Uau, não acredito, você chegou em primeirooo, isso merece uma comemoração.";
            if (rank <= 3) return "Não acredito, você conseguiu, só os melhores chegam aqui, parabéns por chegar no top 3";
            if (rank <= 10) return "Uau, você é incrível, parabéns por chegar no top 10";
            
            const percentage = (rank / totalStudents) * 100;
            if (percentage <= 50) return "Sua posição é incrível, você está entre os 50% melhores, continue avançando nas missões para chegar ao topo!";
            
            return "Você acabou de começar, continue fazendo seu TZK para continuar subindo.";
          })()}
        />
      )}
    </div>
  );
}

// Helper for conditional classes
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
