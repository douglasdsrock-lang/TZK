'use client';

import React from 'react';
import Image from 'next/image';
import { User, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCharacterById } from '@/lib/characters';

interface StudentAvatarProps {
  src?: string;
  firstName: string;
  lastName: string;
  gender?: 'male' | 'female';
  characterId?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function StudentAvatar({ firstName, lastName, gender, characterId, className, size = 'md' }: StudentAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-32 h-32',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 32,
    xl: 64,
  };

  const character = getCharacterById(characterId);
  const themeColor = character?.color || (gender === 'female' ? '#EC4899' : '#3B82F6');
  
  const isFemale = gender === 'female';
  const bgColor = isFemale ? 'bg-pink-500/20' : 'bg-blue-500/20';
  const textColor = isFemale ? 'text-pink-500' : 'text-blue-500';
  const borderColor = isFemale ? 'border-pink-500/30' : 'border-blue-500/30';

  if (character) {
    return (
      <div 
        className={cn(
          "relative rounded-xl border overflow-hidden",
          sizeClasses[size],
          className
        )}
        style={{ borderColor: `${themeColor}4D` }}
      >
        <Image 
          src={character.profileImage}
          alt={character.name}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "flex items-center justify-center rounded-xl border",
        sizeClasses[size],
        className
      )}
      style={{ 
        backgroundColor: `${themeColor}33`,
        color: themeColor,
        borderColor: `${themeColor}4D`
      }}
    >
      {isFemale ? (
        <UserRound size={iconSizes[size]} />
      ) : (
        <User size={iconSizes[size]} />
      )}
    </div>
  );
}
