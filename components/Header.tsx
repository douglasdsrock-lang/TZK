'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Bell, Settings, Menu } from 'lucide-react';
import { useAuth } from './AuthGuard';
import { supabase } from '@/lib/supabase';

interface HeaderProps {
  setActiveTab?: (tab: string) => void;
  toggleSidebar?: () => void;
}

export function Header({ setActiveTab, toggleSidebar }: HeaderProps) {
  const { user } = useAuth();
  const [hasNewMissions, setHasNewMissions] = useState(false);

  useEffect(() => {
    const checkNewMissions = async () => {
      const { data: missions } = await supabase
        .from('missions')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (missions) {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const hasNew = missions.some(m => new Date(m.created_at) > oneDayAgo);
        setHasNewMissions(hasNew);
      }
    };

    checkNewMissions();

    const channel = supabase
      .channel('public:missions_header')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'missions' }, () => {
        setHasNewMissions(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <header className="h-20 border-b border-white/5 px-4 md:px-8 flex items-center justify-between bg-[#0A0A0B]/80 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all lg:hidden"
        >
          <Menu size={24} />
        </button>
        <div className="flex-1 hidden md:block">
          {/* Search bar removed as requested */}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button 
            className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all relative"
            onClick={() => setHasNewMissions(false)}
          >
            <Bell size={20} />
            {hasNewMissions && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#F74C00] rounded-full border-2 border-[#0A0A0B]"></span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab?.('account')}
            className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
