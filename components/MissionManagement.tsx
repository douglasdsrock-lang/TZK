'use client';

import React, { useEffect, useState } from 'react';
import { 
  Target, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X,
  Check,
  Loader2,
  Calendar,
  Clock,
  ListOrdered,
  Trophy,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn, formatDate } from '@/lib/utils';

const missionSchema = z.object({
  title: z.string().min(2, 'Título muito curto'),
  description: z.string().min(5, 'Descrição muito curta'),
  type: z.enum(['standard', 'timed']),
  sequence: z.number().optional(),
  deadline: z.string().optional(),
  linkedAchievementId: z.string().optional(),
});

type MissionFormValues = z.infer<typeof missionSchema>;

interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'standard' | 'timed';
  sequence?: number;
  deadline?: any;
  linkedAchievementId?: string;
  createdAt?: any;
}

export function MissionManagement() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<MissionFormValues>({
    resolver: zodResolver(missionSchema),
    defaultValues: {
      type: 'standard',
      sequence: 1
    }
  });

  const missionType = watch('type');

  const fetchMissions = async () => {
    try {
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .order('sequence', { ascending: true });

      if (error) throw error;
      
      const mapped = (data || []).map(m => ({
        id: m.id,
        title: m.title,
        description: m.description,
        type: m.type,
        sequence: m.sequence,
        deadline: m.deadline,
        linkedAchievementId: m.linked_achievement_id,
        createdAt: m.created_at
      })) as Mission[];

      setMissions(mapped);
    } catch (error: any) {
      console.error('Error fetching missions:', error.message || error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAchievements = async () => {
    const { data } = await supabase.from('achievements').select('*');
    setAchievements(data || []);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*');
    setCategories(data || []);
  };

  useEffect(() => {
    fetchMissions();
    fetchAchievements();
    fetchCategories();

    const channel = supabase
      .channel('public:missions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'missions' }, () => {
        fetchMissions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredMissions = missions.filter(mission => {
    const searchLower = searchQuery.toLowerCase();
    return (
      mission.title?.toLowerCase().includes(searchLower) ||
      mission.description?.toLowerCase().includes(searchLower)
    );
  });

  const onSubmit = async (data: MissionFormValues) => {
    try {
      const deadlineDate = data.deadline ? new Date(data.deadline) : null;
      const payload = {
        title: data.title,
        description: data.description,
        type: data.type,
        sequence: data.sequence,
        deadline: deadlineDate && !isNaN(deadlineDate.getTime()) ? deadlineDate.toISOString() : null,
        linked_achievement_id: data.linkedAchievementId || null
      };

      if (editingMission) {
        const { error } = await supabase
          .from('missions')
          .update(payload)
          .eq('id', editingMission.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('missions')
          .insert([payload]);
        if (error) throw error;
      }
      closeModal();
    } catch (err: any) {
      console.error('Error saving mission:', err.message || err);
      alert(`Erro ao salvar missão: ${err.message || 'Erro desconhecido'}`);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const { error } = await supabase
        .from('missions')
        .delete()
        .eq('id', deletingId);
      if (error) throw error;
      setDeletingId(null);
    } catch (err: any) {
      console.error('Error deleting mission:', err.message || err);
    }
  };

  const openModal = (mission: any = null) => {
    setEditingMission(mission);
    if (mission) {
      reset({
        title: mission.title,
        description: mission.description,
        type: mission.type,
        sequence: mission.sequence || 1,
        deadline: mission.deadline ? (typeof mission.deadline === 'string' ? mission.deadline.split('T')[0] : new Date(mission.deadline.seconds * 1000).toISOString().split('T')[0]) : '',
        linkedAchievementId: mission.linkedAchievementId || '',
      });
    } else {
      reset({
        title: '',
        description: '',
        type: 'standard',
        sequence: missions.filter(m => m.type === 'standard').length + 1,
        deadline: '',
        linkedAchievementId: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMission(null);
    reset();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-display font-black tracking-tight uppercase">GESTÃO DE MISSÕES</h2>
          <p className="text-gray-500 mt-1">Crie jornadas de aprendizado e desafios temporários.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="w-full lg:w-auto bg-[#F74C00] hover:bg-[#ff5a14] text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
        >
          <Plus size={20} />
          NOVA MISSÃO
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por título ou descrição..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#151518] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Standard Missions Column */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <ListOrdered size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white uppercase">Jornada Padrão</h3>
              <p className="text-xs text-gray-500">Missões sequenciais para todos os alunos.</p>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-gray-700" /></div>
            ) : filteredMissions.filter(m => m.type === 'standard').length === 0 ? (
              <div className="p-8 text-center bg-[#151518] rounded-3xl border border-white/5 text-gray-500 italic text-sm">
                Nenhuma missão padrão encontrada.
              </div>
            ) : (
              filteredMissions.filter(m => m.type === 'standard').map((mission, index) => (
                <motion.div 
                  key={mission.id}
                  layout
                  className="bg-[#151518] border border-white/5 rounded-2xl p-5 group hover:border-blue-500/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 font-mono font-bold text-xs">
                        {mission.sequence || index + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors uppercase">{mission.title}</h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{mission.description}</p>
                        {mission.linkedAchievementId && (
                          <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-[#F74C00] bg-[#F74C00]/10 px-2 py-1 rounded-md w-fit">
                            <Trophy size={12} />
                            LINK: {achievements.find(a => a.id === mission.linkedAchievementId)?.name || 'Conquista'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openModal(mission)} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(mission.id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Timed Missions Column */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white uppercase">Eventos Temporários</h3>
              <p className="text-xs text-gray-500">Desafios com prazo determinado.</p>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-gray-700" /></div>
            ) : filteredMissions.filter(m => m.type === 'timed').length === 0 ? (
              <div className="p-8 text-center bg-[#151518] rounded-3xl border border-white/5 text-gray-500 italic text-sm">
                Nenhum evento temporário encontrado.
              </div>
            ) : (
              filteredMissions.filter(m => m.type === 'timed').map((mission) => (
                <motion.div 
                  key={mission.id}
                  layout
                  className="bg-[#151518] border border-white/5 rounded-2xl p-5 group hover:border-orange-500/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white group-hover:text-orange-400 transition-colors uppercase">{mission.title}</h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{mission.description}</p>
                        {mission.deadline && (
                          <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md w-fit">
                            <Clock size={12} />
                            EXPIRA EM: {formatDate(mission.deadline)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openModal(mission)} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(mission.id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mission Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#151518] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h3 className="text-xl font-display font-bold uppercase">
                  {editingMission ? 'EDITAR MISSÃO' : 'NOVA MISSÃO'}
                </h3>
                <button onClick={closeModal} className="p-2 text-gray-500 hover:text-white rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Título da Missão</label>
                  <input 
                    {...register('title')}
                    className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all"
                    placeholder="ex: Primeiro Passo no Campo"
                  />
                  {errors.title && <p className="text-red-500 text-[10px]">{errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Descrição</label>
                  <textarea 
                    {...register('description')}
                    rows={3}
                    className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all resize-none"
                    placeholder="O que o aluno deve fazer para completar?"
                  />
                  {errors.description && <p className="text-red-500 text-[10px]">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Tipo de Missão</label>
                    <select 
                      {...register('type')}
                      className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all appearance-none"
                    >
                      <option value="standard">Padrão (Sequencial)</option>
                      <option value="timed">Temporária (Evento)</option>
                    </select>
                  </div>

                  {missionType === 'standard' ? (
                    <div className="space-y-2">
                      <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Sequência</label>
                      <input 
                        type="number"
                        {...register('sequence', { valueAsNumber: true })}
                        className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Prazo Final</label>
                      <input 
                        type="date"
                        {...register('deadline')}
                        className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Trophy size={12} />
                    Vincular a Conquista (Opcional)
                  </label>
                  <select 
                    {...register('linkedAchievementId')}
                    className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all appearance-none"
                  >
                    <option value="">Nenhuma conquista vinculada</option>
                    {achievements.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({categories.find(c => c.id === a.category)?.name || a.category})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-500 italic mt-1">
                    Se selecionado, a missão será considerada concluída quando o aluno ganhar esta conquista.
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-end gap-4">
                  <button 
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 text-gray-400 hover:text-white font-bold transition-all"
                  >
                    CANCELAR
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#F74C00] hover:bg-[#ff5a14] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={18} />}
                    {editingMission ? 'SALVAR ALTERAÇÕES' : 'CRIAR MISSÃO'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#151518] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
                  <Trash2 size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold uppercase">EXCLUIR MISSÃO?</h3>
                  <p className="text-sm text-gray-500 mt-2">Esta ação não pode ser desfeita.</p>
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setDeletingId(null)} className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all">CANCELAR</button>
                  <button onClick={confirmDelete} className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all">EXCLUIR</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
