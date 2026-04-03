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
import { soundManager } from '@/lib/sounds';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
  themeColor: string;
}

export function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  setIsOpen,
  isCollapsed,
  setIsCollapsed,
  themeColor
}: SidebarProps) {
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-[999] h-screen bg-[#0F0F12] border-r border-white/5 flex flex-col transition-all duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        isCollapsed ? "w-20" : "w-72"
      )}>
        <div className={cn(
          "flex items-center justify-between transition-all duration-300",
          isCollapsed ? "p-4 flex-col gap-4" : "p-8"
        )}>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shrink-0"
              style={{ 
                background: `linear-gradient(to bottom right, ${themeColor}, #FFDA1F)`,
                boxShadow: `0 5px 15px ${themeColor}33`
              }}
            >
              <LayoutDashboard className="text-black" size={24} />
            </div>
            {!isCollapsed && (
              <span 
                className="text-2xl font-display font-black tracking-tighter whitespace-nowrap"
                style={{ color: themeColor }}
              >
                TZK.
              </span>
            )}
          </div>
          
          <button 
            onClick={() => {
              soundManager.playClick();
              setIsCollapsed(!isCollapsed);
            }}
            className={cn(
              "p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all hidden lg:flex items-center justify-center",
              isCollapsed && "rotate-180"
            )}
          >
            <ChevronRight size={20} />
          </button>

          <button 
            onClick={() => {
              soundManager.playClick();
              setIsOpen(false);
            }}
            className="p-2 text-gray-500 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {!isCollapsed && (
          <p className="px-4 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">
            Menu Principal
          </p>
        )}
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "w-full flex items-center px-4 py-3.5 rounded-xl transition-all group relative overflow-hidden",
                isActive 
                  ? "text-white" 
                  : "text-gray-400 hover:bg-white/5",
                isCollapsed ? "justify-center" : "justify-between"
              )}
              style={{ 
                backgroundColor: isActive ? `${themeColor}1A` : 'transparent',
                color: isActive ? themeColor : undefined
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = themeColor;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '';
                }
              }}
            >
              <div className="flex items-center gap-3 relative z-10">
                <Icon size={20} className={cn(isActive ? "" : "text-gray-500 group-hover:text-white", "shrink-0")} style={{ color: isActive ? themeColor : undefined }} />
                {!isCollapsed && <span className="font-semibold text-sm whitespace-nowrap">{item.label}</span>}
              </div>
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ backgroundColor: themeColor }}
                />
              )}
              {!isCollapsed && (
                <ChevronRight size={14} className={cn("transition-transform", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50")} />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button 
          onClick={() => {
            soundManager.playClick();
            logout();
          }}
          title={isCollapsed ? "Sair" : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all",
            isCollapsed ? "justify-center" : ""
          )}
        >
          <LogOut size={20} className="shrink-0" />
          {!isCollapsed && <span className="font-semibold text-sm">Sair</span>}
        </button>
      </div>
    </aside>
    </>
  );
}
