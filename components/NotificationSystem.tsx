'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, Zap, X, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerCelebration, triggerLevelUp } from '@/lib/celebrations';
import { soundManager } from '@/lib/sounds';

export type NotificationType = 'level-up' | 'mission-complete' | 'achievement' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notif: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotif = { ...notif, id };
    
    setNotifications(prev => [...prev, newNotif]);

    if (notif.type === 'level-up') {
      triggerLevelUp();
      triggerCelebration();
      soundManager.playLevelUp?.(); // Assuming soundManager might have this or we use a default
    } else {
      soundManager.playAchievement?.();
    }

    const duration = notif.duration || 5000;
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []);

  return { notifications, addNotification, removeNotification: (id: string) => setNotifications(prev => prev.filter(n => n.id !== id)) };
}

// Global event system for notifications
export const notify = (notif: Omit<Notification, 'id'>) => {
  const event = new CustomEvent('app-notification', { detail: notif });
  window.dispatchEvent(event);
};

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const handleNotification = (e: any) => {
      const notif = e.detail;
      const id = Math.random().toString(36).substring(2, 9);
      const newNotif = { ...notif, id };
      
      setNotifications(prev => [...prev, newNotif]);

      if (notif.type === 'level-up') {
        triggerLevelUp();
        triggerCelebration();
        soundManager.playLevelUp();
      } else if (notif.type === 'mission-complete' || notif.type === 'achievement') {
        soundManager.playAchievement();
      }

      const duration = notif.duration || 5000;
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    };

    window.addEventListener('app-notification', handleNotification);
    return () => window.removeEventListener('app-notification', handleNotification);
  }, []);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'level-up': return <Star className="text-[#FFDA1F]" fill="#FFDA1F" />;
      case 'mission-complete': return <Zap className="text-[#F74C00]" fill="#F74C00" />;
      case 'achievement': return <Trophy className="text-[#FFDA1F]" />;
      default: return <Bell className="text-blue-400" />;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[10000] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9, transition: { duration: 0.2 } }}
            className={cn(
              "pointer-events-auto relative overflow-hidden backdrop-blur-3xl border p-4 rounded-2xl shadow-2xl min-w-[300px] max-w-md flex items-start gap-4 transition-all",
              notif.type === 'level-up' && "bg-[#FFDA1F]/10 border-[#FFDA1F]/20 shadow-[#FFDA1F]/5",
              notif.type === 'mission-complete' && "bg-[#F74C00]/10 border-[#F74C00]/20 shadow-[#F74C00]/5",
              notif.type === 'achievement' && "bg-white/5 border-white/10 shadow-black/20",
              notif.type === 'info' && "bg-blue-500/10 border-blue-500/20 shadow-blue-500/5"
            )}
          >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            
            {/* Progress Bar */}
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: (notif.duration || 5000) / 1000, ease: 'linear' }}
              className="absolute bottom-0 left-0 h-1 opacity-50"
              style={{ 
                backgroundColor: notif.type === 'level-up' ? '#FFDA1F' : 
                               notif.type === 'mission-complete' ? '#F74C00' : 
                               notif.type === 'info' ? '#3b82f6' :
                               'rgba(255,255,255,0.5)' 
              }}
            />

            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              {getIcon(notif.type)}
            </div>

            <div className="flex-1 pr-4">
              <h4 className="font-display font-black text-sm uppercase tracking-tight text-white">
                {notif.title}
              </h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                {notif.message}
              </p>
            </div>

            <button 
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
              className="text-gray-600 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
