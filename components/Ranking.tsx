'use client';

import React, { useEffect, useState } from 'react';
import { 
  Trophy, 
  Medal, 
  Star, 
  Search,
  Loader2,
  Crown
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from './AuthGuard';

import { supabase } from '@/lib/supabase';

export function Ranking() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
  }, []);

  const fetchRanking = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('level', { ascending: false })
        .order('created_at', { ascending: true }); // Secondary sort

      if (error) throw error;
      
      // Map snake_case from Postgres to camelCase for the UI
      const mappedData = (data || []).map(s => ({
        id: s.id,
        firstName: s.first_name,
        lastName: s.last_name,
        email: s.email,
        class: s.class,
        level: s.level,
        achievements: s.achievements || []
      }));

      setStudents(mappedData);
    } catch (error) {
      console.error('Error fetching ranking:', error);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
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
            className="w-full bg-[#151518] border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-10 h-10 text-[#F74C00] animate-spin mx-auto" />
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
            <div className="hidden md:grid grid-cols-[80px_1fr_120px_120px] px-8 py-4 bg-white/[0.02] border-b border-white/5">
              <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Pos</span>
              <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Jogador</span>
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
                    className={cn(
                      "group transition-all",
                      isCurrentUser ? "bg-[#F74C00]/10 border-y border-[#F74C00]/20" : "hover:bg-white/[0.02]"
                    )}
                  >
                    <div className="grid grid-cols-[50px_1fr_auto] md:grid-cols-[80px_1fr_120px_120px] items-center px-4 md:px-8 py-4 gap-4">
                      {/* Position */}
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-lg font-display font-black",
                          index < 3 ? getMedalColor(index) : "text-gray-600",
                          isCurrentUser && "text-[#F74C00]"
                        )}>
                          #{index + 1}
                        </span>
                      </div>

                      {/* Player */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-bold uppercase shrink-0",
                          index === 0 ? "bg-[#F74C00]/20 text-[#F74C00]" : "bg-white/5 text-gray-400",
                          isCurrentUser && "bg-[#F74C00] text-white"
                        )}>
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div className="truncate">
                          <p className={cn(
                            "font-bold uppercase truncate text-sm md:text-base",
                            isCurrentUser ? "text-[#F74C00]" : "text-white"
                          )}>
                            {student.firstName} {student.lastName} {isCurrentUser && "(VOCÊ)"}
                          </p>
                          <p className="text-[10px] font-mono text-gray-500 uppercase truncate">
                            {student.class}
                          </p>
                        </div>
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
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-[#F74C00]/10 flex items-center justify-center text-[#F74C00]">
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
        </div>
      )}
    </div>
  );
}

// Helper for conditional classes
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
