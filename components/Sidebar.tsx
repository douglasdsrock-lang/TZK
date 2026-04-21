'use client';

import React, { useEffect, useState } from 'react';
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
  Megaphone,
  X,
  MessageCircle,
  Download
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
  studentData?: any;
}

export function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  setIsOpen,
  isCollapsed,
  setIsCollapsed,
  themeColor,
  studentData
}: SidebarProps) {
  const { isAdmin, logout } = useAuth();

  const studentItems = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'ranking', label: 'Ranking Global', icon: Medal },
    { id: 'achievements', label: 'Minhas Conquistas', icon: Trophy },
    { id: 'account', label: 'Minha Conta', icon: User },
    { id: 'community', label: 'Entrar na comunidade', icon: MessageCircle },
    { id: 'download', label: 'Baixar App', icon: Download },
  ];

  const adminItems = [
    { id: 'management', label: 'Gestão de Alunos', icon: Users },
    { id: 'achievement-management', label: 'Conquistas', icon: Trophy },
    { id: 'mission-management', label: 'Missões', icon: Target },
    { id: 'communication', label: 'Comunicação', icon: Megaphone },
  ];

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const renderMenuItem = (item: any) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    
    const handleClick = () => {
      if (item.id === 'download') {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult: any) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('User accepted the A2HS prompt');
            }
            setDeferredPrompt(null);
          });
        } else {
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
          const isAndroid = /Android/.test(navigator.userAgent);
          
          if (isIOS) {
            alert('Para instalar: toque no botão "Compartilhar" do Safari e selecione "Adicionar à Tela de Início".');
          } else if (isAndroid) {
            alert('Para instalar: toque nos três pontinhos do navegador e selecione "Instalar aplicativo" ou "Adicionar à tela de início".');
          } else {
            alert('Para instalar: verifique a barra de endereços do navegador. Se houver um ícone de instalação, clique nele. Caso contrário, tente adicionar o site aos favoritos na sua tela inicial.');
          }
        }
      } else {
        setActiveTab(item.id);
      }
    };
    
    return (
      <button
        key={item.id}
        onClick={handleClick}
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
  };

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 h-screen bg-[#0F0F12] border-r border-white/5 flex flex-col transition-all duration-300 lg:translate-x-0",
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
              <div className="flex flex-col">
                <span 
                  className="text-2xl font-display font-black tracking-tighter whitespace-nowrap leading-none"
                  style={{ color: themeColor }}
                >
                  TZK.
                </span>
                {studentData && (
                  <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest mt-1">
                    Nível {studentData.level || 1}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {isCollapsed && studentData && (
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border border-white/10"
              style={{ color: themeColor, backgroundColor: `${themeColor}1A` }}
            >
              L{studentData.level || 1}
            </div>
          )}
          
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
        
        {studentItems.map(renderMenuItem)}

        {isAdmin && (
          <>
            <div className="h-px bg-white/5 my-6 mx-4" />
            {!isCollapsed && (
              <p className="px-4 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">
                Administração
              </p>
            )}
            {adminItems.map(renderMenuItem)}
          </>
        )}
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
