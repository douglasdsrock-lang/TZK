'use client';

import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Megaphone, 
  Trash2, 
  Plus, 
  X, 
  Check, 
  Loader2,
  AlertCircle,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { cn, formatDate } from '@/lib/utils';
import { useAuth } from './AuthGuard';

export function CommunicationManagement() {
  const { user: currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Announcement Form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Notification Form
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState('system');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro detalhado ao buscar comunicados:', error);
        // Não mostrar alert aqui para não atrapalhar a navegação inicial
        return;
      }
      setAnnouncements(data || []);
    } catch (err: any) {
      console.error('Erro fatal ao buscar comunicados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('announcements')
        .insert([{
          title,
          content,
          author_id: currentUser?.id
        }]);

      if (error) {
        console.error('Erro ao criar comunicado:', error);
        alert(`Erro ao criar comunicado: ${error.message || 'Verifique se a tabela existe'}`);
        return;
      }
      
      setTitle('');
      setContent('');
      setIsCreating(false);
      fetchAnnouncements();
    } catch (err: any) {
      console.error('Erro fatal ao criar comunicado:', err);
      alert(`Erro Fatal: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    setDeletingId(null);
    setSending(true);
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir comunicado:', error);
        alert(`Erro ao excluir: ${error.message}`);
        return;
      }
      
      fetchAnnouncements();
    } catch (err: any) {
      console.error('Erro fatal ao excluir comunicado:', err);
      alert(`Erro Fatal: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMessage) return;

    setSending(true);
    try {
      // Get all students
      const { data: students } = await supabase.from('students').select('id');
      
      if (students && students.length > 0) {
        const notifications = students.map(s => ({
          user_id: s.id,
          title: notifTitle,
          message: notifMessage,
          type: notifType
        }));

        const { error } = await supabase.from('notifications').insert(notifications);
        if (error) throw error;

        setNotifTitle('');
        setNotifMessage('');
        setIsSendingNotification(false);
        alert('Notificação enviada para todos os alunos!');
      }
    } catch (err) {
      console.error('Error sending notifications:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Megaphone className="h-6 w-6 text-[#F74C00]" />
            Comunicação
          </h2>
          <p className="text-gray-400">Gerencie comunicados e envie notificações para os alunos</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsSendingNotification(true)}
            className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-white/10"
          >
            <Send className="h-4 w-4" />
            ENVIAR NOTIFICAÇÃO
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 rounded-xl bg-[#F74C00] px-4 py-2 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20"
          >
            <Plus className="h-4 w-4" />
            NOVO COMUNICADO
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Announcements List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-gray-400" />
            Comunicados Recentes
          </h3>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#F74C00]" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
              <Megaphone className="mx-auto h-12 w-12 text-white/5 mb-4" />
              <p className="text-gray-500">Nenhum comunicado enviado ainda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((ann) => (
                <motion.div
                  key={ann.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative rounded-2xl border border-white/5 bg-white/5 p-6 transition-all hover:bg-white/[0.07]"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xl font-bold text-white">{ann.title}</h4>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(ann.id);
                        }}
                        className="p-2 text-gray-500 hover:text-red-500 transition-all bg-white/5 rounded-lg hover:bg-red-500/10"
                        title="Excluir comunicado"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <AnimatePresence>
                        {deletingId === ann.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, x: -10 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9, x: -10 }}
                            className="absolute right-0 top-0 mt-10 w-48 bg-[#151518] border border-white/10 rounded-xl p-3 shadow-2xl z-[100]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">Confirmar exclusão?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setDeletingId(null)}
                                className="flex-1 px-2 py-1.5 text-[10px] font-bold text-gray-500 hover:text-white bg-white/5 rounded-lg"
                              >
                                NÃO
                              </button>
                              <button
                                onClick={() => handleDeleteAnnouncement(ann.id)}
                                disabled={sending}
                                className="flex-1 px-2 py-1.5 text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg disabled:opacity-50"
                              >
                                {sending ? '...' : 'SIM'}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <p className="text-gray-400 leading-relaxed mb-4 whitespace-pre-wrap">
                    {ann.content}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Check className="h-3 w-3 text-green-500" />
                    <span>Enviado em {formatDate(ann.created_at)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats/Tips */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/5 bg-white/5 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-[#F74C00]" />
              Alcance
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-xl bg-black/20">
                <span className="text-gray-400 text-sm">Total de Alunos</span>
                <span className="text-white font-bold">Carregando...</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                As notificações são enviadas instantaneamente para todos os alunos ativos na plataforma.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Announcement Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0D0D0D] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Novo Comunicado</h3>
                <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-white">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleCreateAnnouncement} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400">TÍTULO</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-[#F74C00] focus:outline-none"
                    placeholder="Ex: Mudança no Horário de Aula"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400">CONTEÚDO</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="h-40 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-[#F74C00] focus:outline-none resize-none"
                    placeholder="Escreva aqui o comunicado para os alunos..."
                    required
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="rounded-xl px-6 py-3 font-bold text-gray-400 hover:text-white transition-colors"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex items-center gap-2 rounded-xl bg-[#F74C00] px-8 py-3 font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'PUBLICAR COMUNICADO'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Send Notification Modal */}
      <AnimatePresence>
        {isSendingNotification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0D0D0D] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Enviar Notificação</h3>
                <button onClick={() => setIsSendingNotification(false)} className="text-gray-500 hover:text-white">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSendNotification} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400">TÍTULO DA NOTIFICAÇÃO</label>
                  <input
                    type="text"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-[#F74C00] focus:outline-none"
                    placeholder="Ex: Nova aula disponível!"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400">MENSAGEM</label>
                  <textarea
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    className="h-24 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-[#F74C00] focus:outline-none resize-none"
                    placeholder="Escreva a mensagem curta que aparecerá no sino..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400">TIPO</label>
                  <select
                    value={notifType}
                    onChange={(e) => setNotifType(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-[#F74C00] focus:outline-none"
                  >
                    <option value="system">Sistema</option>
                    <option value="event">Evento</option>
                    <option value="mission">Missão</option>
                  </select>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsSendingNotification(false)}
                    className="rounded-xl px-6 py-3 font-bold text-gray-400 hover:text-white transition-colors"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex items-center gap-2 rounded-xl bg-[#F74C00] px-8 py-3 font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'ENVIAR AGORA'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
