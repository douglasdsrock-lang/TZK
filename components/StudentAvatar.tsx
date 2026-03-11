'use client';

import React from 'react';
import Image from 'next/image';
import { User, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudentAvatarProps {
  src?: string;
  firstName: string;
  lastName: string;
  gender?: 'male' | 'female';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function StudentAvatar({ firstName, lastName, gender, className, size = 'md' }: StudentAvatarProps) {
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

  const isFemale = gender === 'female';
  const bgColor = isFemale ? 'bg-pink-500/20' : 'bg-blue-500/20';
  const textColor = isFemale ? 'text-pink-500' : 'text-blue-500';
  const borderColor = isFemale ? 'border-pink-500/30' : 'border-blue-500/30';

  return (
    <div className={cn(
      "flex items-center justify-center rounded-xl border",
      bgColor,
      textColor,
      borderColor,
      sizeClasses[size],
      className
    )}>
      {isFemale ? (
        <UserRound size={iconSizes[size]} />
      ) : (
        <User size={iconSizes[size]} />
      )}
    </div>
  );
}
