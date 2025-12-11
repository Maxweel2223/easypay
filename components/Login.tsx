import React, { useState } from 'react';
import { Wallet, ArrowRight, Lock, Mail, Loader2 } from 'lucide-react';
import { ViewState } from '../App';
import { supabase } from '../supabaseClient';

interface LoginProps {
  onNavigate: (view: ViewState) => void;
}

const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message === 'Invalid login credentials') {
           throw new Error('Email ou senha incorretos.');
        }
        throw authError;
      }

      if (data.session) {
         // App.tsx auth listener will handle the redirect
      }
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-100">
      <div className="hidden lg:flex lg:w-1/2 bg-brand-600 items-center justify-center p-12 text-white">
        <div className="max-w-md">
          <div className="flex items-center gap-2 mb-8 cursor-pointer" onClick={() => onNavigate('landing')}>
            <Wallet size={32} />
            <span className="text-3xl font-bold">PayEasy</span>
          </div>
          <h1 className="text-4xl font-bold mb-6">Bem-vindo de volta.</h1>
          <p className="text-lg text-brand-100">Gerencie seus produtos digitais e acompanhe suas vendas em tempo real.</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center" onClick={() => onNavigate('landing')}>
            <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center text-white">
              <Wallet size={24} />
            </div>
            <span className="text-2xl font-bold text-slate-900">PayEasy</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center lg:text-left">Fazer Login</h2>

          <form className="space-y-4" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded font-medium">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Senha</label>
                <a href="#" className="text-sm text-brand-600 hover:text-brand-700 font-medium">Esqueceu?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <>Entrar <ArrowRight size={20} /></>}
            </button>
            
            <p className="text-center text-sm text-slate-600 mt-4">
              Não tem uma conta? <button onClick={() => onNavigate('register')} className="text-brand-600 font-bold hover:underline">Criar conta grátis</button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;