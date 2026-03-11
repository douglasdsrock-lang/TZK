'use client';

import React from 'react';
import { 
  Home, 
  Trophy, 
  User, 
  Users, 
  LogOut, 
  LayoutDashboard,
  ChevronRight,
  Target,
  Medal,
  X
} from 'lucide-react';
import { useAuth } from './AuthGuard';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }: SidebarProps) {
  const { isAdmin, logout } = useAuth();

  const menuItems = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'ranking', label: 'Ranking Global', icon: Medal },
    { id: 'achievements', label: 'Minhas Conquistas', icon: Trophy },
    { id: 'account', label: 'Minha Conta', icon: User },
  ];

  if (isAdmin) {
    menuItems.push({ id: 'management', label: 'Gestão de Alunos', icon: Users });
    menuItems.push({ id: 'achievement-management', label: 'Conquistas', icon: Trophy });
    menuItems.push({ id: 'mission-management', label: 'Missões', icon: Target });
  }

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 w-72 h-screen bg-[#0F0F12] border-r border-white/5 flex flex-col transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#F74C00] to-[#FFDA1F] rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <LayoutDashboard className="text-black" size={24} />
            </div>
            <span className="text-2xl font-display font-black tracking-tighter">
              TZK<span className="text-[#F74C00]">.</span>
            </span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-500 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        <p className="px-4 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">
          Menu Principal
        </p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group relative overflow-hidden",
                isActive 
                  ? "bg-[#F74C00]/10 text-[#F74C00]" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3 relative z-10">
                <Icon size={20} className={cn(isActive ? "text-[#F74C00]" : "text-gray-500 group-hover:text-white")} />
                <span className="font-semibold text-sm">{item.label}</span>
              </div>
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-[#F74C00]"
                />
              )}
              <ChevronRight size={14} className={cn("transition-transform", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50")} />
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all"
        >
          <LogOut size={20} />
          <span className="font-semibold text-sm">Sair</span>
        </button>
      </div>
    </aside>
    </>
  );
}
