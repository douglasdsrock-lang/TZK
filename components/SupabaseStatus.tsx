'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database, CheckCircle2, AlertCircle, Loader2, Link as LinkIcon } from 'lucide-react';

export function SupabaseStatus() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [configStatus, setConfigStatus] = useState({
    url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  const testConnection = async () => {
    setStatus('loading');
    try {
      // Try to fetch a simple query to test connection
      // We don't know the schema, so we just try to get the session or a dummy query
      const { data, error } = await supabase.from('_dummy_table_test_').select('*').limit(1);
      
      // Even if the table doesn't exist, if we get a 404 or similar from Supabase, 
      // it means the connection to the API is working.
      // If it's a network error or invalid key, it will fail differently.
      
      if (error && error.code === 'PGRST116') {
        // This is a "no rows returned" or similar, usually means connection is OK but table missing
        setStatus('success');
        setMessage('Conexão com a API do Supabase estabelecida com sucesso!');
      } else if (error && (error.message.includes('FetchError') || error.message.includes('Failed to fetch'))) {
        setStatus('error');
        setMessage('Erro de rede: Verifique se a URL do Supabase está correta.');
      } else if (error) {
        // If we get an error but it's from Supabase, it's technically "connected"
        setStatus('success');
        setMessage(`Conectado (Aviso: ${error.message})`);
      } else {
        setStatus('success');
        setMessage('Conexão estabelecida com sucesso!');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Erro desconhecido ao conectar ao Supabase.');
    }
  };

  return (
    <div className="bg-[#151518] border border-white/5 rounded-3xl p-8 mt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Database size={20} className="text-[#3ECF8E]" />
          Integração Supabase
        </h3>
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded text-[10px] font-mono uppercase ${configStatus.url ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
            URL: {configStatus.url ? 'Configurado' : 'Pendente'}
          </span>
          <span className={`px-2 py-1 rounded text-[10px] font-mono uppercase ${configStatus.key ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
            KEY: {configStatus.key ? 'Configurado' : 'Pendente'}
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-6">
        O Supabase foi adicionado ao projeto. Use as variáveis de ambiente no arquivo <code className="text-emerald-400">.env.example</code> para configurar sua conexão.
      </p>

      {status !== 'idle' && (
        <div className={`p-4 rounded-xl flex items-center gap-3 mb-6 ${
          status === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
          status === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
          'bg-blue-500/10 text-blue-400 border border-blue-500/20'
        }`}>
          {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : 
           status === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-medium">{message}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <button 
          onClick={testConnection}
          disabled={status === 'loading' || !configStatus.url || !configStatus.key}
          className="flex-1 bg-[#151518] hover:bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : <LinkIcon size={18} />}
          TESTAR CONEXÃO
        </button>
        
        <a 
          href="https://supabase.com/dashboard" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-1 bg-[#3ECF8E] hover:bg-[#34b27b] text-black px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
        >
          ABRIR DASHBOARD SUPABASE
        </a>
      </div>
    </div>
  );
}
