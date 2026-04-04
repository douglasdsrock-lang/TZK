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
import { getAvatarUrl, formatDate } from '@/lib/utils';
import { characters, getCharacterById } from '@/lib/characters';
import { soundManager } from '@/lib/sounds';

export function AccountSettings() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      try {
        const { data: student } = await supabase
          .from('students')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (student) {
          // Map snake_case from DB to camelCase for the UI
          const mappedData = {
            ...student,
            firstName: student.first_name,
            lastName: student.last_name
          };
          setUserData(mappedData);
          setEmail(student.email || user.email || '');
          setGender(student.gender || 'male');
          setSelectedCharacterId(student.character_id || null);
        } else {
          // Fallback to email if id not found (for legacy records)
          const { data: studentByEmail } = await supabase
            .from('students')
            .select('*')
            .eq('email', user.email)
            .maybeSingle();

          if (studentByEmail) {
            const mappedData = {
              ...studentByEmail,
              firstName: studentByEmail.first_name,
              lastName: studentByEmail.last_name
            };
            setUserData(mappedData);
            setEmail(studentByEmail.email || user.email || '');
            setGender(studentByEmail.gender || 'male');
            setSelectedCharacterId(studentByEmail.character_id || null);
          } else {
            setUserData({
              id: user.id,
              firstName: user.user_metadata?.full_name?.split(' ')[0] || 'Usuário',
              lastName: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
              email: user.email,
            });
            setEmail(user.email || '');
          }
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

      // 3. Upsert student record
      const upsertData: any = {
        id: user.id, // Always use the auth user ID
        email: email,
        gender: gender,
        character_id: selectedCharacterId,
        first_name: userData?.firstName || userData?.first_name || user.user_metadata?.full_name?.split(' ')[0] || 'Usuário',
        last_name: userData?.lastName || userData?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
        updated_at: new Date().toISOString()
      };

      console.log('Attempting upsert with data:', upsertData);

      const { data: upsertedData, error: upsertError } = await supabase
        .from('students')
        .upsert(upsertData) // Remove explicit onConflict to let Supabase use the PK
        .select()
        .single();

      if (upsertError) {
        console.error('Supabase Upsert Error Details:', {
          message: upsertError.message,
          details: upsertError.details,
          hint: upsertError.hint,
          code: upsertError.code
        });
        throw upsertError;
      }
      
      if (upsertedData) {
        setUserData({
          ...upsertedData,
          firstName: upsertedData.first_name,
          lastName: upsertedData.last_name
        });
      }
      
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Update error full object:', err);
      console.error('Update error stringified:', JSON.stringify(err, null, 2));
      const errorMessage = err.message || (typeof err === 'string' ? err : 'Erro ao atualizar perfil');
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const selectedCharacter = getCharacterById(selectedCharacterId);
  const themeColor = selectedCharacter?.color || '#F74C00';
  const filteredCharacters = characters.filter(c => c.gender === gender);

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
            <div 
              className="w-24 h-24 rounded-2xl p-1 mb-4 relative overflow-hidden"
              style={{ background: `linear-gradient(to bottom right, ${themeColor}, #FFDA1F)` }}
            >
              <Image 
                src={selectedCharacter?.profileImage || userData?.profilePhoto || getAvatarUrl(`${userData?.firstName} ${userData?.lastName}`)} 
                alt={userData?.firstName || 'User'}
                fill
                className="object-cover rounded-[14px]"
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
                <Calendar style={{ color: themeColor }} size={16} />
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-mono">Nascimento</p>
                  <p className="text-gray-300">{formatDate(userData?.birthDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <User style={{ color: themeColor }} size={16} />
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-mono">Sexo</p>
                  <p className="text-gray-300">{userData?.gender === 'female' ? 'Feminino' : 'Masculino'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form Card */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#151518] border border-white/5 rounded-3xl p-8">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <User size={20} style={{ color: themeColor }} />
              Informações Pessoais
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Seu Sexo</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className="flex-1 py-3 rounded-xl border font-bold transition-all"
                    style={{ 
                      backgroundColor: gender === 'male' ? `${themeColor}1A` : '#0A0A0B',
                      borderColor: gender === 'male' ? themeColor : 'rgba(255,255,255,0.05)',
                      color: gender === 'male' ? themeColor : '#6B7280'
                    }}
                  >
                    Masculino
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className="flex-1 py-3 rounded-xl border font-bold transition-all"
                    style={{ 
                      backgroundColor: gender === 'female' ? `${themeColor}1A` : '#0A0A0B',
                      borderColor: gender === 'female' ? themeColor : 'rgba(255,255,255,0.05)',
                      color: gender === 'female' ? themeColor : '#6B7280'
                    }}
                  >
                    Feminino
                  </button>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <User size={20} style={{ color: themeColor }} />
              Escolha seu Personagem
            </h3>
            
            <div className="grid grid-cols-4 gap-4 mb-8">
              {filteredCharacters.map((char) => (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => setSelectedCharacterId(char.id)}
                  className="relative aspect-square rounded-xl border-2 transition-all overflow-hidden group"
                  style={{ 
                    borderColor: selectedCharacterId === char.id ? char.color : 'rgba(255,255,255,0.05)',
                    boxShadow: selectedCharacterId === char.id ? `0 0 15px ${char.color}4D` : 'none'
                  }}
                >
                  <Image 
                    src={char.profileImage}
                    alt={char.name}
                    fill
                    className="object-cover"
                  />
                  {selectedCharacterId === char.id && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: `${char.color}33` }}>
                      <CheckCircle2 className="text-white" size={24} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Lock size={20} style={{ color: themeColor }} />
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
                    className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none transition-all"
                    style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = themeColor}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
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
                      className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none transition-all"
                      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                      onFocus={(e) => e.currentTarget.style.borderColor = themeColor}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
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
                      className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none transition-all"
                      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                      onFocus={(e) => e.currentTarget.style.borderColor = themeColor}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-4">
                <button 
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    window.dispatchEvent(new CustomEvent('show-welcome-preview'));
                  }}
                  className="px-6 py-3 rounded-xl font-bold border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  TESTAR TELA DE BOAS-VINDAS
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  onClick={() => soundManager.playSelect()}
                  className="text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg"
                  style={{ 
                    backgroundColor: themeColor,
                    boxShadow: `0 10px 20px ${themeColor}33`
                  }}
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={20} />}
                  SALVAR ALTERAÇÕES
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
