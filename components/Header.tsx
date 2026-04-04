'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Bell, User as UserIcon, Menu, LogOut, UserCircle, ChevronDown } from 'lucide-react';
import { useAuth } from './AuthGuard';
import { supabase } from '@/lib/supabase';
import { soundManager } from '@/lib/sounds';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  setActiveTab?: (tab: string) => void;
  toggleSidebar?: () => void;
  themeColor: string;
}

export function Header({ setActiveTab, toggleSidebar, themeColor }: HeaderProps) {
  const { user, logout } = useAuth();
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setNotifications(data);
        setHasNewNotifications(data.some(n => !n.read));
      }
    };

    fetchNotifications();

    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        setHasNewNotifications(true);
        soundManager.playSelect();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const clearAllNotifications = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
      setNotifications([]);
      setHasNewNotifications(false);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const markAsRead = async () => {
    if (!user || !hasNewNotifications) return;
    
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (!error) {
      setHasNewNotifications(false);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  return (
    <header className="h-20 px-4 md:px-8 flex items-center justify-between sticky top-0 z-[995]">
      {/* Fundo da barra com z-index menor (980) para o personagem (991) passar por cima */}
      <div className="absolute inset-0 bg-[#0A0A0B]/80 backdrop-blur-md border-b border-white/5 z-[980] pointer-events-none" />
      
      {/* Conteúdo da barra com z-index maior (995) para ficar acima do personagem */}
      <div className="flex items-center gap-4 relative z-[995]">
        <button 
          onClick={() => {
            soundManager.playClick();
            toggleSidebar?.();
          }}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all lg:hidden"
        >
          <Menu size={24} />
        </button>
        <div className="flex-1 hidden md:block">
          {/* Search bar removed as requested */}
        </div>
      </div>

      <div className="flex items-center gap-4 relative z-[995]">
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative">
            <button 
              className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all relative"
              onClick={() => {
                soundManager.playClick();
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsUserMenuOpen(false);
                if (!isNotificationsOpen) markAsRead();
              }}
            >
              <Bell size={20} />
              {hasNewNotifications && (
                <span 
                  className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full border-2 border-[#0A0A0B]"
                  style={{ backgroundColor: themeColor }}
                ></span>
              )}
            </button>

            <AnimatePresence>
              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-[991]" onClick={() => setIsNotificationsOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-[#151518] border border-white/10 rounded-2xl shadow-2xl z-[992] overflow-hidden"
                  >
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Notificações</h3>
                      <div className="flex items-center gap-3">
                        {notifications.length > 0 && (
                          <button 
                            onClick={clearAllNotifications}
                            className="text-[10px] text-gray-500 hover:text-white transition-colors font-bold"
                          >
                            LIMPAR TUDO
                          </button>
                        )}
                        {user?.email === 'agencia.unrocket@gmail.com' && (
                          <button 
                            onClick={async () => {
                              try {
                                console.log('Tentando enviar notificação para:', user.id);
                                const { data, error } = await supabase.from('notifications').insert({
                                  user_id: user.id,
                                  title: 'Teste de Sistema 🛠️',
                                  message: 'Esta é uma notificação de teste para verificar o funcionamento.',
                                  type: 'system'
                                });
                                
                                if (error) {
                                  console.error('Erro Supabase detectado:', error);
                                  const errorMsg = `Mensagem: ${error.message}\nDetalhes: ${error.details}\nCódigo: ${error.code}\nDica: ${error.hint}`;
                                  alert(`Erro Supabase:\n${errorMsg}`);
                                  return;
                                }
                              } catch (err: any) {
                                console.error('Erro fatal no teste:', err);
                                alert(`Erro Fatal: ${err.message || 'Erro desconhecido'}`);
                              }
                            }}
                            className="text-[10px] text-[#F74C00] hover:underline font-bold"
                          >
                            TESTAR
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">
                          Nenhuma notificação por enquanto.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id}
                            className={`p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors ${!notif.read ? 'bg-white/[0.01]' : ''}`}
                          >
                            <p className="text-sm text-white font-medium">{notif.title}</p>
                            <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                            <p className="text-[10px] text-gray-600 mt-2 font-mono">
                              {new Date(notif.created_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button 
              onClick={() => {
                soundManager.playClick();
                setIsUserMenuOpen(!isUserMenuOpen);
                setIsNotificationsOpen(false);
              }}
              className="flex items-center gap-2 p-1.5 pr-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/5"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
                <UserIcon size={18} />
              </div>
              <ChevronDown size={14} className={`transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isUserMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[991]" onClick={() => setIsUserMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-[#151518] border border-white/10 rounded-2xl shadow-2xl z-[992] overflow-hidden"
                  >
                    <div className="p-4 border-b border-white/5">
                      <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">Usuário</p>
                      <p className="text-sm font-bold text-white truncate mt-1">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          soundManager.playClick();
                          setActiveTab?.('account');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                      >
                        <UserCircle size={18} />
                        Minha Conta
                      </button>
                      <button
                        onClick={() => {
                          soundManager.playClick();
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"
                      >
                        <LogOut size={18} />
                        Sair da Conta
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
