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
    <div className="min-h-screen flex bg-background font-sans">
      <div className="hidden lg:flex lg:w-1/2 bg-brand-600 relative items-center justify-center p-12 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 to-brand-800"></div>
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-purple-400 opacity-10 rounded-full blur-3xl"></div>
        
        <div className="max-w-md relative z-10">
          <div className="flex items-center gap-3 mb-8 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onNavigate('landing')}>
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Wallet size={28} />
            </div>
            <span className="text-3xl font-bold tracking-tight">PayEasy</span>
          </div>
          <h1 className="text-5xl font-extrabold mb-6 leading-tight">Bem-vindo<br/>de volta.</h1>
          <p className="text-lg text-brand-100 leading-relaxed opacity-90">Gerencie seus produtos digitais, acompanhe suas vendas em tempo real e escale seu negócio.</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center" onClick={() => onNavigate('landing')}>
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white">
              <Wallet size={24} />
            </div>
            <span className="text-2xl font-bold text-slate-900">PayEasy</span>
          </div>

          <div className="text-center lg:text-left mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Fazer Login</h2>
              <p className="text-slate-500">Entre com suas credenciais para acessar o painel.</p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-xl font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={20} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all shadow-sm"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Senha</label>
                <a href="#" className="text-xs text-brand-600 hover:text-brand-700 font-bold hover:underline">Esqueceu?</a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={20} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-brand-600/20 hover:shadow-brand-600/40 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? <Loader2 size={22} className="animate-spin" /> : <>Entrar na Plataforma <ArrowRight size={20} /></>}
            </button>
            
            <p className="text-center text-sm text-slate-500 mt-6">
              Não tem uma conta? <button onClick={() => onNavigate('register')} className="text-brand-600 font-bold hover:underline">Criar conta grátis</button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;