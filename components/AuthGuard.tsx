'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { Loader2, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = user?.email === 'agencia.unrocket@gmail.com' || user?.id === 'OMCUqpvEF9Zjg28ivP95zosy0zJ3';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const signIn = async () => {
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Sign in error:', error);
      setAuthError(error.message || 'Erro ao entrar. Verifique suas credenciais.');
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0A0A0A]">
        <Loader2 className="h-8 w-8 animate-spin text-[#F74C00]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0A0A0A] p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8 rounded-2xl border border-white/5 bg-white/5 p-8 backdrop-blur-xl"
        >
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">Bem-vindo</h1>
            <p className="text-gray-400">Entre com suas credenciais para continuar</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">E-mail</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F74C00] transition-colors"
                placeholder="seu@email.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Senha</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F74C00] transition-colors"
                placeholder="••••••••"
                onKeyDown={(e) => e.key === 'Enter' && signIn()}
              />
            </div>

            {authError && (
              <p className="text-red-500 text-sm text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                {authError}
              </p>
            )}

            <button
              onClick={signIn}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#F74C00] px-4 py-3 font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-500/20"
            >
              <LogIn className="h-5 w-5" />
              Entrar na Plataforma
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthGuard');
  }
  return context;
};
