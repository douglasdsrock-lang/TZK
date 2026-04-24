'use client';

import React, { useEffect, useState } from 'react';
import { 
  Shield, Plus, Edit2, Trash2, X, Loader2, Users, Sword, Trophy, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';

const clanSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  description: z.string().min(5, 'Descrição muito curta'),
  icon: z.string().min(1, 'Ícone é obrigatório'),
});

type ClanFormValues = z.infer<typeof clanSchema>;

const AVAILABLE_ICONS = [
  { name: 'Shield', icon: Shield },
  { name: 'Users', icon: Users },
  { name: 'Sword', icon: Sword },
  { name: 'Trophy', icon: Trophy },
];

export function ClanManagement() {
  const [clans, setClans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClan, setEditingClan] = useState<any>(null);
  const [clanToDelete, setClanToDelete] = useState<any>(null);
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<ClanFormValues>({
    resolver: zodResolver(clanSchema),
    defaultValues: { icon: 'Shield' }
  });

  const selectedIcon = watch('icon');

  const fetchClans = async () => {
    try {
      const { data, error } = await supabase
        .from('clans')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setClans(data || []);
    } catch (error: any) {
      console.error('Error fetching clans:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClans(); }, []);

  const onSubmit = async (data: ClanFormValues) => {
    try {
      if (editingClan) {
        await supabase.from('clans').update(data).eq('id', editingClan.id);
      } else {
        await supabase.from('clans').insert([data]);
      }
      closeModal();
      fetchClans();
    } catch (err: any) {
      console.error('Error saving clan:', err);
    }
  };

  const deleteClan = async (clan: any) => {
    setClanToDelete(clan);
  };

  const confirmDeleteClan = async () => {
    if (!clanToDelete) return;
    
    try {
      // Remove a vinculação de alunos ao clã antes de deletar
      await supabase.from('students').update({ clan_id: null }).eq('clan_id', clanToDelete.id);

      const response = await supabase.from('clans').delete().eq('id', clanToDelete.id);
      
      if (response.error) {
        console.error('Supabase delete error:', response.error);
        alert('Erro ao excluir clã: ' + (response.error.message || 'Verifique se há alunos vinculados a este clã ou se você tem permissão.'));
      } else {
        fetchClans();
      }
    } catch (err: any) {
      console.error('Unexpected error in deleteClan:', err);
      alert('Erro inesperado: ' + err.message);
    } finally {
      setClanToDelete(null);
    }
  };

  const openModal = (clan?: any) => {
    if (clan) {
      setEditingClan(clan);
      setValue('name', clan.name);
      setValue('description', clan.description);
      setValue('icon', clan.icon);
    } else {
      setEditingClan(null);
      reset({ name: '', description: '', icon: 'Shield' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingClan(null); reset(); };
  
  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024) {
      alert('O arquivo deve ter no máximo 100KB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setValue('icon', base64String);
    };
    reader.readAsDataURL(file);
  };

  const getIcon = (iconName: string) => {
    if (iconName.startsWith('data:image')) {
      return (
        <div className="w-12 h-12 relative">
          <img src={iconName} alt="Custom Icon" className="w-full h-full object-contain" />
        </div>
      );
    }
    const IconComponent = AVAILABLE_ICONS.find(i => i.name === iconName)?.icon || Shield;
    return <IconComponent size={24} />;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-black uppercase">Gestão de Clãs</h2>
        <button 
          onClick={() => openModal()}
          className="bg-[#F74C00] hover:bg-[#ff5a14] text-white px-6 py-3 rounded-xl font-bold transition-all"
        >
          <Plus size={18} /> Novo Clã
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {clans.map(clan => {
          return (
            <div key={clan.id} className="bg-[#151518] border border-white/5 rounded-3xl p-6 flex items-start justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#F74C00] mb-4">
                  {getIcon(clan.icon)}
                </div>
                <h4 className="text-xl font-bold">{clan.name}</h4>
                <p className="text-sm text-gray-500 mt-2">{clan.description}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openModal(clan)} className="p-2 hover:bg-white/5 rounded-lg"><Edit2 size={16}/></button>
                <button onClick={() => deleteClan(clan)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg"><Trash2 size={16}/></button>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div className="bg-[#151518] p-8 rounded-3xl w-full max-w-lg border border-white/10" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <input {...register('name')} placeholder="Nome do Clã" className="w-full bg-[#0A0A0B] p-3 rounded-xl border border-white/5" />
                <textarea {...register('description')} placeholder="Descrição" className="w-full bg-[#0A0A0B] p-3 rounded-xl border border-white/5" />
                
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Ícone</label>
                  <label className="cursor-pointer flex items-center gap-2 text-[10px] font-bold text-[#F74C00] hover:text-[#ff5a14] transition-colors">
                    <Upload size={12} />
                    UPLOAD SVG/PNG (MAX 100KB)
                    <input type="file" accept=".svg,.png,.jpg,.jpeg" className="hidden" onChange={handleIconUpload} />
                  </label>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {AVAILABLE_ICONS.map(i => {
                    const Icon = i.icon;
                    return (
                      <button key={i.name} type="button" onClick={() => setValue('icon', i.name)} className={cn("p-4 rounded-xl flex justify-center", selectedIcon === i.name ? "bg-[#F74C00]" : "bg-[#0A0A0B]")}>
                        <Icon size={24} />
                      </button>
                    )
                  })}
                  <button 
                    type="button" 
                    onClick={() => {
                        console.log('Selected icon is:', selectedIcon);
                        setValue('icon', selectedIcon);
                    }} 
                    className={cn("p-4 rounded-xl flex justify-center items-center", selectedIcon.startsWith('data:image') ? "bg-[#F74C00]" : "bg-[#0A0A0B]")}
                  >
                    {selectedIcon.startsWith('data:image') ? (
                      <img src={selectedIcon} alt="Custom" className="w-6 h-6 object-contain" />
                    ) : <span className="text-[10px]">Cst</span>}
                  </button>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 p-3 rounded-xl border border-white/10">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 bg-[#F74C00] p-3 rounded-xl font-bold">
                    {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'Salvar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {clanToDelete && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div className="bg-[#151518] p-8 rounded-3xl w-full max-w-sm border border-white/10" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-bold">Excluir Clã?</h3>
                <p className="text-sm text-gray-400">
                  Tem certeza que deseja excluir o clã <span className="text-white font-bold">{clanToDelete.name}</span>? Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setClanToDelete(null)} className="flex-1 p-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors">Cancelar</button>
                  <button type="button" onClick={confirmDeleteClan} className="flex-1 bg-red-500 hover:bg-red-600 p-3 rounded-xl font-bold transition-colors">
                    Excluir
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
