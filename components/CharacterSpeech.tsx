'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { getCharacterById } from '@/lib/characters';

interface CharacterSpeechProps {
  characterId: string | null | undefined;
  message: string;
}

export function CharacterSpeech({ characterId, message }: CharacterSpeechProps) {
  const character = getCharacterById(characterId);

  if (!character || !message) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 pointer-events-none flex items-end gap-2 max-w-[300px] md:max-w-[400px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={message}
          initial={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
          className="relative mb-20 pointer-events-auto"
        >
          {/* Speech Bubble */}
          <div className="bg-white text-black p-4 rounded-3xl shadow-2xl border-2 border-white/20 relative">
            <p className="text-xs md:text-sm font-bold leading-tight">
              {message}
            </p>
            {/* Triangle for bubble pointing to character */}
            <div className="absolute bottom-8 -right-2 w-4 h-4 bg-white transform rotate-45 shadow-[2px_-2px_5px_rgba(0,0,0,0.1)]" />
          </div>
        </motion.div>
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-32 h-48 md:w-48 md:h-72 relative shrink-0"
      >
        <Image
          src={character.fullImage}
          alt={character.name}
          fill
          className="object-contain object-bottom"
        />
      </motion.div>
    </div>
  );
}
