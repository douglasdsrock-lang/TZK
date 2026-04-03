'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { characters } from '@/lib/characters';
import { supabase } from '@/lib/supabase';
import { soundManager } from '@/lib/sounds';

interface WelcomeScreenProps {
  user: any;
  studentData: any;
  onComplete: () => void;
}

export function WelcomeScreen({ user, studentData, onComplete }: WelcomeScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const gender = studentData?.gender || 'male';
  const filteredCharacters = characters.filter(c => c.gender === gender);

  const handleSelect = async () => {
    if (!selectedId) return;
    
    soundManager.playSelect();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({ character_id: selectedId })
        .eq('id', user.id);

      if (error) throw error;
      onComplete();
    } catch (err) {
      console.error('Error selecting character:', err);
    } finally {
      setSaving(false);
    }
  };

  const selectedChar = characters.find(c => c.id === selectedId);
  const themeColor = selectedChar?.color || '#F74C00';

  return (
    <div className="fixed inset-0 z-[100] bg-[#0A0A0B] flex items-center justify-center overflow-hidden">
      <div className="max-w-6xl w-full h-full flex flex-col p-4 md:p-8">
        <div className="flex-1 flex flex-col justify-center gap-6 md:gap-8 py-2">
          <div className="text-center space-y-2">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-5xl font-display font-black tracking-tighter"
            >
              BEM-VINDO AO <span style={{ color: themeColor }}>TZK.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-400 text-sm md:text-base max-w-xl mx-auto"
            >
              Escolha seu personagem, você pode trocar futuramente na pagina da sua conta.
            </motion.p>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-8 gap-2 md:gap-3 px-2">
            {filteredCharacters.map((char, i) => (
              <motion.button
                key={char.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 + 0.2 }}
                onClick={() => {
                  soundManager.playClick();
                  setSelectedId(char.id);
                }}
                className="relative aspect-[2/3] rounded-xl border-2 transition-all overflow-hidden group"
                style={{ 
                  borderColor: selectedId === char.id ? char.color : 'rgba(255,255,255,0.05)',
                  boxShadow: selectedId === char.id ? `0 0 15px ${char.color}33` : 'none'
                }}
              >
                <Image 
                  src={char.fullImage}
                  alt={char.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                {selectedId === char.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center shadow-xl"
                      style={{ backgroundColor: char.color }}
                    >
                      <CheckCircle2 className="text-white" size={16} />
                    </div>
                  </div>
                )}
              </motion.button>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center"
          >
            <button
              onClick={handleSelect}
              disabled={!selectedId || saving}
              className="px-10 py-3 rounded-xl font-display font-black text-lg tracking-wide transition-all active:scale-95 disabled:opacity-50 disabled:grayscale shadow-2xl"
              style={{ 
                backgroundColor: themeColor,
                color: '#000',
                boxShadow: selectedId ? `0 15px 30px ${themeColor}4D` : 'none'
              }}
            >
              {saving ? (
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              ) : (
                'INICIAR JORNADA'
              )}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
