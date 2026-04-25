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
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async (sessionUser: User | null) => {
      setUser(sessionUser);
      
      if (sessionUser) {
        // Check if user is admin via hardcoded fallback or DB role
        const isHardcodedAdmin = sessionUser.email === 'agencia.unrocket@gmail.com' || sessionUser.email === 'geracaotzk@gmail.com' || sessionUser.email === 'geovanna.sena430@gmail.com' || sessionUser.id === 'OMCUqpvEF9Zjg28ivP95zosy0zJ3';
        
        const { data: studentData } = await supabase
          .from('students')
          .select('role')
          .eq('id', sessionUser.id)
          .maybeSingle();
        
        setIsAdmin(isHardcodedAdmin || studentData?.role === 'admin');
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const handleAuth = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Auth error:', error);
      let message = error.message;
      if (message === 'Invalid login credentials') {
        message = 'E-mail ou senha incorretos. Verifique suas credenciais.';
      }
      setAuthError(message);
    } finally {
      setAuthLoading(false);
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
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Bem-vindo
            </h1>
            <p className="text-gray-400">
              Entre com suas credenciais para continuar
            </p>
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
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
              />
            </div>

            {authError && (
              <p className="text-sm text-center py-2 px-3 rounded-lg border text-red-500 bg-red-500/10 border-red-500/20">
                {authError}
              </p>
            )}

            <button
              onClick={handleAuth}
              disabled={authLoading}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#F74C00] px-4 py-3 font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:hover:scale-100"
            >
              {authLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Entrar na Plataforma
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signIn: handleAuth, logout }}>
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
