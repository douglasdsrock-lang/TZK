'use client';

import React, { useEffect, useState } from 'react';
import { 
  Trophy, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X,
  Check,
  Loader2,
  Star,
  Shield,
  Zap,
  Flame,
  Sword,
  Target,
  Crown,
  Medal,
  Award,
  Gamepad2,
  Rocket,
  Ghost,
  Dribbble,
  Heart,
  Lightbulb,
  Music,
  Camera,
  Coffee,
  BookOpen,
  Compass,
  Map,
  Flag,
  Anchor,
  Wind,
  Droplets,
  Cloud,
  Moon,
  Sun,
  Gamepad,
  Joystick,
  Puzzle,
  Dices,
  Skull,
  Axe,
  Hammer,
  Wrench,
  Pickaxe,
  Gem,
  Coins,
  Wallet,
  Key,
  Lock,
  Unlock,
  Eye,
  Bell,
  CheckCircle,
  Upload,
  Settings,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';

const achievementSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  description: z.string().min(5, 'Descrição muito curta'),
  icon: z.string().min(1, 'Ícone é obrigatório'),
  category: z.string().optional().or(z.literal('')),
  level: z.number().min(0, 'Nível de recompensa inválido'),
  type: z.enum(['standard', 'level']),
  requiredLevel: z.number().default(0),
}).refine((data) => {
  if (data.type === 'standard' && (!data.category || data.category === '')) {
    return false;
  }
  return true;
}, {
  message: 'Categoria é obrigatória',
  path: ['category'],
}).refine((data) => {
  if (data.type === 'level' && (data.requiredLevel === undefined || data.requiredLevel <= 0)) {
    return false;
  }
  return true;
}, {
  message: 'Nível alvo deve ser maior que 0',
  path: ['requiredLevel'],
});

type AchievementFormValues = z.infer<typeof achievementSchema>;

const AVAILABLE_ICONS = [
  { name: 'Trophy', icon: Trophy },
  { name: 'Star', icon: Star },
  { name: 'Shield', icon: Shield },
  { name: 'Zap', icon: Zap },
  { name: 'Flame', icon: Flame },
  { name: 'Sword', icon: Sword },
  { name: 'Target', icon: Target },
  { name: 'Crown', icon: Crown },
  { name: 'Medal', icon: Medal },
  { name: 'Award', icon: Award },
  { name: 'Gamepad2', icon: Gamepad2 },
  { name: 'Rocket', icon: Rocket },
  { name: 'Ghost', icon: Ghost },
  { name: 'Dribbble', icon: Dribbble },
  { name: 'Heart', icon: Heart },
  { name: 'Lightbulb', icon: Lightbulb },
  { name: 'Music', icon: Music },
  { name: 'Camera', icon: Camera },
  { name: 'Coffee', icon: Coffee },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Compass', icon: Compass },
  { name: 'Map', icon: Map },
  { name: 'Flag', icon: Flag },
  { name: 'Anchor', icon: Anchor },
  { name: 'Wind', icon: Wind },
  { name: 'Droplets', icon: Droplets },
  { name: 'Cloud', icon: Cloud },
  { name: 'Moon', icon: Moon },
  { name: 'Sun', icon: Sun },
  { name: 'Gamepad', icon: Gamepad },
  { name: 'Joystick', icon: Joystick },
  { name: 'Puzzle', icon: Puzzle },
  { name: 'Dices', icon: Dices },
  { name: 'Skull', icon: Skull },
  { name: 'Axe', icon: Axe },
  { name: 'Hammer', icon: Hammer },
  { name: 'Wrench', icon: Wrench },
  { name: 'Pickaxe', icon: Pickaxe },
  { name: 'Gem', icon: Gem },
  { name: 'Coins', icon: Coins },
  { name: 'Wallet', icon: Wallet },
  { name: 'Key', icon: Key },
  { name: 'Lock', icon: Lock },
  { name: 'Unlock', icon: Unlock },
  { name: 'Eye', icon: Eye },
  { name: 'Bell', icon: Bell },
  { name: 'CheckCircle', icon: CheckCircle },
];

const CATEGORIES = [
  'Clan',
  'Missão',
  'Social',
  'Esportivo',
  'Acadêmico',
  'Especial',
  'Nível'
];

const COLOR_PRESETS = [
  { name: 'Laranja', primary: '#F74C00', secondary: '#FFDA1F' },
  { name: 'Verde', primary: '#10B981', secondary: '#34D399' },
  { name: 'Azul', primary: '#3B82F6', secondary: '#60A5FA' },
  { name: 'Roxo', primary: '#8B5CF6', secondary: '#A78BFA' },
  { name: 'Rosa', primary: '#EC4899', secondary: '#F472B6' },
  { name: 'Vermelho', primary: '#EF4444', secondary: '#F87171' },
  { name: 'Ciano', primary: '#06B6D4', secondary: '#22D3EE' },
  { name: 'Amarelo', primary: '#EAB308', secondary: '#FDE047' },
  { name: 'Indigo', primary: '#6366F1', secondary: '#818CF8' },
  { name: 'Esmeralda', primary: '#059669', secondary: '#10B981' },
];

export function AchievementManagement() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [isLevelMode, setIsLevelMode] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(COLOR_PRESETS[0]);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<AchievementFormValues>({
    resolver: zodResolver(achievementSchema) as any,
    defaultValues: {
      level: 1,
      icon: 'Trophy',
      category: '',
      type: 'standard'
    }
  });

  const selectedIcon = watch('icon');
  const currentType = watch('type');

  const [searchQuery, setSearchQuery] = useState('');

  const filteredAchievements = achievements.filter(achievement => {
    const searchLower = searchQuery.toLowerCase();
    return (
      achievement.name?.toLowerCase().includes(searchLower) ||
      achievement.description?.toLowerCase().includes(searchLower) ||
      achievement.category?.toLowerCase().includes(searchLower) ||
      achievement.type?.toLowerCase().includes(searchLower)
    );
  });

  const handleCustomIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const fetchAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error: any) {
      console.error('Error fetching achievements:', error.message || error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error.message || error);
    }
  };

  useEffect(() => {
    fetchAchievements();
    fetchCategories();

    const achChannel = supabase
      .channel('public:achievements')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'achievements' }, () => {
        fetchAchievements();
      })
      .subscribe();

    const catChannel = supabase
      .channel('public:categories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchCategories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(achChannel);
      supabase.removeChannel(catChannel);
    };
  }, []);

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsSavingCategory(true);
    try {
      const payload = {
        name: newCategoryName.trim(),
        color: selectedPreset.primary,
        secondary_color: selectedPreset.secondary,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([payload]);
        if (error) throw error;
      }

      setNewCategoryName('');
      setSelectedPreset(COLOR_PRESETS[0]);
      setEditingCategory(null);
      setIsCategoryModalOpen(false);
    } catch (error: any) {
      console.error('Error saving category:', error.message || error);
      alert(`Erro ao salvar categoria: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (error: any) {
      console.error('Error deleting category:', error.message || error);
    }
  };

  const onSubmit = async (data: AchievementFormValues) => {
    try {
      const payload = {
        name: data.name,
        title: data.name,
        description: data.description,
        icon: data.icon,
        category: data.type === 'level' ? null : data.category,
        level: data.type === 'level' ? 0 : data.level,
        type: data.type,
        required_level: data.requiredLevel || 0
      };

      if (editingAchievement) {
        const { error } = await supabase
          .from('achievements')
          .update(payload)
          .eq('id', editingAchievement.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('achievements')
          .insert([payload]);
        if (error) throw error;
      }
      closeModal();
    } catch (err: any) {
      console.error('Error saving achievement:', err.message || err);
      alert(`Erro ao salvar conquista: ${err.message || 'Erro desconhecido'}`);
    }
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const { error } = await supabase
        .from('achievements')
        .delete()
        .eq('id', deletingId);
      if (error) throw error;
      setDeletingId(null);
    } catch (err: any) {
      console.error('Error deleting achievement:', err.message || err);
    }
  };

  const openModal = (achievement: any = null, forceLevelMode: boolean = false) => {
    setEditingAchievement(achievement);
    const levelMode = forceLevelMode || (achievement?.type === 'level');
    setIsLevelMode(levelMode);

    if (achievement) {
      reset({
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category,
        level: achievement.level || 0,
        type: achievement.type || 'standard',
        requiredLevel: achievement.required_level || 0,
      });
    } else {
      reset({
        name: '',
        description: '',
        icon: 'Trophy',
        category: '',
        level: levelMode ? 0 : 1,
        type: levelMode ? 'level' : 'standard',
        requiredLevel: levelMode ? 10 : 0,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAchievement(null);
    reset();
  };

  const getIconComponent = (iconName: string) => {
    if (iconName.startsWith('data:image')) {
      return function CustomIcon() {
        return (
          <div className="w-full h-full relative">
            <img src={iconName} alt="Custom Icon" className="w-full h-full object-contain" />
          </div>
        );
      };
    }
    const found = AVAILABLE_ICONS.find(i => i.name === iconName);
    return found ? found.icon : Trophy;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-2xl md:text-3xl font-display font-black tracking-tight uppercase">Cadastro de Conquistas</h2>
          <p className="text-gray-500 mt-1 text-xs md:text-sm hidden sm:block">Crie e gerencie os emblemas e conquistas do sistema.</p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="bg-white/5 hover:bg-white/10 text-white px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/10 text-[10px] md:text-sm whitespace-nowrap"
          >
            <Settings size={16} className="text-gray-400" />
            <span className="hidden xs:inline">CATEGORIAS</span>
            <span className="xs:hidden">CAT</span>
          </button>
          <button 
            onClick={() => openModal(null, true)}
            className="bg-white/5 hover:bg-white/10 text-white px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/10 text-[10px] md:text-sm whitespace-nowrap"
          >
            <Plus size={16} className="text-[#FFDA1F]" />
            <span className="hidden xs:inline">CONQUISTA DE NÍVEL</span>
            <span className="xs:hidden">NÍVEL</span>
          </button>
          <button 
            onClick={() => openModal()}
            className="bg-[#F74C00] hover:bg-[#ff5a14] text-white px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-500/20 text-[10px] md:text-sm whitespace-nowrap"
          >
            <Plus size={16} />
            <span className="hidden xs:inline">NOVA CONQUISTA</span>
            <span className="xs:hidden">NOVA</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome, categoria ou tipo..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#151518] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all"
          />
        </div>
      </div>

      {/* Grid de Conquistas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <Loader2 className="w-10 h-10 text-[#F74C00] animate-spin mx-auto" />
          </div>
        ) : filteredAchievements.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-[#151518] rounded-3xl border border-white/5 p-12">
            <Trophy className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma conquista encontrada.</p>
          </div>
        ) : (
          filteredAchievements.map((achievement) => {
            const Icon = getIconComponent(achievement.icon);
            return (
              <motion.div 
                key={achievement.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#151518] border border-white/5 rounded-3xl p-6 flex flex-col gap-4 group hover:border-[#F74C00]/30 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"
                    style={{ 
                      backgroundColor: achievement.type === 'level' ? 'rgba(255, 218, 31, 0.1)' : `${categories.find(c => c.id === achievement.category)?.color}1A` || 'rgba(247, 76, 0, 0.1)',
                      color: achievement.type === 'level' ? '#FFDA1F' : categories.find(c => c.id === achievement.category)?.color || '#F74C00'
                    }}
                  >
                    <Icon size={32} />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openModal(achievement)}
                      className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(achievement.id)}
                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                      className="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-widest"
                      style={{ 
                        backgroundColor: achievement.type === 'level' ? 'rgba(255, 218, 31, 0.1)' : `${categories.find(c => c.id === achievement.category)?.color}1A` || 'rgba(255, 255, 255, 0.05)',
                        color: achievement.type === 'level' ? '#FFDA1F' : categories.find(c => c.id === achievement.category)?.color || '#9ca3af'
                      }}
                    >
                      {achievement.type === 'level' ? 'Nível' : (categories.find(c => c.id === achievement.category)?.name || achievement.category)}
                    </span>
                    {achievement.type === 'level' ? (
                      <span className="text-[10px] font-mono font-bold bg-[#FFDA1F]/10 text-[#FFDA1F] px-2 py-0.5 rounded uppercase tracking-widest">
                        Alvo: Nível {achievement.required_level}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold bg-[#FFDA1F]/10 text-[#FFDA1F] px-2 py-0.5 rounded uppercase tracking-widest">
                        Ganha: +{achievement.level} Nível
                      </span>
                    )}
                  </div>
                  <h4 className="text-xl font-display font-bold text-white uppercase">{achievement.name}</h4>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{achievement.description}</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Achievement Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-10 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#151518] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl my-auto"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h3 className="text-xl font-display font-bold uppercase">
                  {editingAchievement ? 'EDITAR CONQUISTA' : isLevelMode ? 'NOVA CONQUISTA DE NÍVEL' : 'NOVA CONQUISTA'}
                </h3>
                <button onClick={closeModal} className="p-2 text-gray-500 hover:text-white rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-4 md:space-y-6">
                {isLevelMode && (
                  <div className="p-4 bg-[#FFDA1F]/10 border border-[#FFDA1F]/20 rounded-2xl">
                    <p className="text-xs text-[#FFDA1F] font-bold uppercase tracking-wider flex items-center gap-2">
                      <Trophy size={14} />
                      Modo Conquista de Nível
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Esta conquista será desbloqueada automaticamente quando o aluno atingir o nível alvo. 
                      Ela não concede níveis adicionais ao aluno.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Nome da Conquista</label>
                  <input 
                    {...register('name')}
                    className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all"
                    placeholder={isLevelMode ? "ex: Alcançou Nível 10" : "ex: Mestre dos Clãs"}
                  />
                  {errors.name && <p className="text-red-500 text-[10px]">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Descrição</label>
                  <textarea 
                    {...register('description')}
                    rows={3}
                    className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all resize-none"
                    placeholder={isLevelMode ? "Parabéns por chegar ao nível 10!" : "Descreva como o aluno ganha esta conquista..."}
                  />
                  {errors.description && <p className="text-red-500 text-[10px]">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  {!isLevelMode ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Categoria</label>
                        <select 
                          {...register('category')}
                          className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all appearance-none"
                        >
                          <option value="" disabled>Selecione uma categoria</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                        {errors.category && <p className="text-red-500 text-[10px]">{errors.category.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Nível de Recompensa</label>
                        <input 
                          type="number"
                          {...register('level', { valueAsNumber: true })}
                          className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Nível Alvo</label>
                        <input 
                          type="number"
                          {...register('requiredLevel', { valueAsNumber: true })}
                          className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all"
                          placeholder="Nível para desbloqueio"
                        />
                        {errors.requiredLevel && <p className="text-red-500 text-[10px]">{errors.requiredLevel.message}</p>}
                      </div>
                      <div className="space-y-2 opacity-50">
                        <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Recompensa</label>
                        <div className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-500">
                          +0 Nível
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Escolha o Ícone</label>
                    <label className="cursor-pointer flex items-center gap-2 text-[10px] font-bold text-[#F74C00] hover:text-[#ff5a14] transition-colors">
                      <Upload size={12} />
                      UPLOAD SVG/PNG (MAX 100KB)
                      <input 
                        type="file" 
                        accept=".svg,.png,.jpg,.jpeg" 
                        className="hidden" 
                        onChange={handleCustomIconUpload}
                      />
                    </label>
                  </div>
                  
                  {selectedIcon.startsWith('data:image') && (
                    <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-[#F74C00]/30">
                      <div className="w-12 h-12 rounded-lg bg-[#F74C00]/10 p-2">
                        <img src={selectedIcon} alt="Preview" className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white uppercase">Ícone Customizado</p>
                        <button 
                          type="button" 
                          onClick={() => setValue('icon', 'Trophy')}
                          className="text-[10px] text-red-500 hover:underline"
                        >
                          Remover e usar padrão
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-5 gap-3 max-h-[200px] overflow-y-auto p-1">
                    {AVAILABLE_ICONS.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setValue('icon', item.name)}
                        className={cn(
                          "w-full aspect-square rounded-xl flex items-center justify-center transition-all border",
                          selectedIcon === item.name 
                            ? "bg-[#F74C00] border-[#F74C00] text-black" 
                            : "bg-[#0A0A0B] border-white/5 text-gray-500 hover:border-white/10"
                        )}
                      >
                        <item.icon size={24} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-4">
                  <button 
                    type="button"
                    onClick={closeModal}
                    className="w-full sm:w-auto px-6 py-3 text-gray-400 hover:text-white font-bold transition-all"
                  >
                    CANCELAR
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto bg-[#F74C00] hover:bg-[#ff5a14] text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={18} />}
                    {editingAchievement ? 'SALVAR ALTERAÇÕES' : 'CRIAR CONQUISTA'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Management Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-10 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#151518] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl my-auto"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h3 className="text-xl font-display font-bold uppercase">GERENCIAR CATEGORIAS</h3>
                <button onClick={() => setIsCategoryModalOpen(false)} className="p-2 text-gray-500 hover:text-white rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Nome da Categoria</label>
                    <input 
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all"
                      placeholder="ex: Clan, Social..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Escolha uma Cor</label>
                    <div className="grid grid-cols-5 gap-2">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => setSelectedPreset(preset)}
                          className={cn(
                            "h-10 rounded-lg transition-all border-2",
                            selectedPreset.primary === preset.primary 
                              ? "border-white scale-110 shadow-lg" 
                              : "border-transparent hover:border-white/20"
                          )}
                          style={{ 
                            background: `linear-gradient(to bottom right, ${preset.primary}, ${preset.secondary})` 
                          }}
                          title={preset.name}
                        />
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleSaveCategory}
                    disabled={isSavingCategory || !newCategoryName.trim()}
                    className="w-full bg-[#F74C00] hover:bg-[#ff5a14] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 mt-2"
                  >
                    {isSavingCategory ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    {editingCategory ? 'ATUALIZAR CATEGORIA' : 'ADICIONAR CATEGORIA'}
                  </button>
                  {editingCategory && (
                    <button 
                      onClick={() => {
                        setEditingCategory(null);
                        setNewCategoryName('');
                        setSelectedPreset(COLOR_PRESETS[0]);
                      }}
                      className="w-full text-[10px] text-gray-500 hover:text-white transition-colors"
                    >
                      CANCELAR EDIÇÃO
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Categorias Existentes</label>
                  {categories.length === 0 ? (
                    <p className="text-xs text-gray-600 italic py-4 text-center">Nenhuma categoria cadastrada.</p>
                  ) : (
                    categories.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-6 h-6 rounded-lg shadow-sm" 
                            style={{ background: `linear-gradient(to bottom right, ${cat.color}, ${cat.secondaryColor || cat.color})` }} 
                          />
                          <span className="text-sm font-bold text-white uppercase">{cat.name}</span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingCategory(cat);
                              setNewCategoryName(cat.name);
                              const preset = COLOR_PRESETS.find(p => p.primary === cat.color) || COLOR_PRESETS[0];
                              setSelectedPreset(preset);
                            }}
                            className="p-1.5 text-gray-500 hover:text-white transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
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
                  <h3 className="text-xl font-display font-bold">EXCLUIR CONQUISTA?</h3>
                  <p className="text-sm text-gray-500 mt-2">Esta ação não pode ser desfeita.</p>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setDeletingId(null)}
                    className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all"
                  >
                    CANCELAR
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all"
                  >
                    EXCLUIR
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
