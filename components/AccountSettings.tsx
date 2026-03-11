'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  User, 
  Mail, 
  Lock, 
  Calendar, 
  Save, 
  Loader2, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { getAvatarUrl } from '@/lib/utils';
import { SupabaseStatus } from './SupabaseStatus';

export function AccountSettings() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      try {
        const { data: student } = await supabase
          .from('students')
          .select('*')
          .eq('email', user.email)
          .single();

        if (student) {
          setUserData(student);
          setEmail(student.email || user.email || '');
        } else {
          setUserData({
            firstName: user.user_metadata?.full_name?.split(' ')[0] || 'Usuário',
            lastName: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            email: user.email,
          });
          setEmail(user.email || '');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setSaving(true);
    setMessage(null);

    try {
      // 1. Update Password if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error('As senhas não coincidem');
        }
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
      }

      // 2. Update Email if changed
      if (email !== user.email) {
        const { error } = await supabase.auth.updateUser({ email });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Um e-mail de confirmação foi enviado para o novo endereço.' });
      } else {
        setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      }

      // 3. Update Students table if exists
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('email', user.email)
        .single();

      if (student) {
        await supabase
          .from('students')
          .update({
            email: email,
            updated_at: new Date().toISOString()
          })
          .eq('id', student.id);
      }
      
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Update error:', err);
      setMessage({ type: 'error', text: err.message || 'Erro ao atualizar perfil' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#F74C00] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div>
        <h2 className="text-3xl font-display font-black tracking-tight">MINHA CONTA</h2>
        <p className="text-gray-500 mt-1">Gerencie suas informações pessoais e segurança.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#151518] border border-white/5 rounded-3xl p-8 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#F74C00] to-[#FFDA1F] p-1 mb-4 relative overflow-hidden">
              <Image 
                src={userData?.profilePhoto || getAvatarUrl(`${userData?.firstName} ${userData?.lastName}`)} 
                alt={userData?.firstName || 'User'}
                fill
                className="object-cover rounded-[14px]"
                referrerPolicy="no-referrer"
                unoptimized={!userData?.profilePhoto}
              />
            </div>
            <h3 className="text-xl font-bold text-white">
              {userData?.firstName} {userData?.lastName}
            </h3>
            <p className="text-xs font-mono text-gray-500 mt-1 uppercase tracking-widest">
              {userData?.class || 'Estudante'}
            </p>
            
            <div className="w-full h-px bg-white/5 my-6" />
            
            <div className="w-full space-y-4 text-left">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="text-[#F74C00]" size={16} />
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-mono">Nascimento</p>
                  <p className="text-gray-300">{userData?.birthDate ? new Date(userData.birthDate).toLocaleDateString('pt-BR') : 'Não informado'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <User className="text-[#F74C00]" size={16} />
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-mono">Sexo</p>
                  <p className="text-gray-300">{userData?.gender === 'female' ? 'Feminino' : 'Masculino'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form Card */}
        <div className="lg:col-span-2">
          <div className="bg-[#151518] border border-white/5 rounded-3xl p-8">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Lock size={20} className="text-[#F74C00]" />
              Segurança e Acesso
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {message && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl flex items-center gap-3 ${
                    message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                  }`}
                >
                  {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  <p className="text-sm font-medium">{message.text}</p>
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Email de Login</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Nova Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Confirmar Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-[#F74C00]/50 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  type="submit"
                  disabled={saving}
                  className="bg-[#F74C00] hover:bg-[#ff5a14] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-orange-500/20"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={20} />}
                  SALVAR ALTERAÇÕES
                </button>
              </div>
            </form>
          </div>

          <SupabaseStatus />
        </div>
      </div>
    </div>
  );
}
