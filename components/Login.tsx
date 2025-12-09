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
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Brand / Testimonial (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 to-brand-800 relative overflow-hidden flex-col justify-between p-16 text-white">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-brand-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white">
              <Wallet size={24} />
            </div>
            <span className="text-2xl font-bold tracking-tight">
              Pay<span className="text-brand-200">Easy</span>
            </span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="text-5xl font-bold leading-tight mb-8">
            Gerencie seu império digital em um só lugar.
          </div>
          <p className="text-xl text-brand-100 font-light mb-8">
            "A PayEasy mudou a forma como vendo meus cursos. A integração com M-Pesa é perfeita."
          </p>
          <div className="flex items-center gap-4">
            <img src="https://picsum.photos/100/100?random=1" alt="User" className="w-12 h-12 rounded-full border-2 border-brand-400" />
            <div>
              <div className="font-bold">Marta Xavier</div>
              <div className="text-sm text-brand-200">Empreendedora Digital</div>
            </div>
          </div>
        </div>

        <div className="text-sm text-brand-200 relative z-10">
          © 2025 PayEasy Moçambique
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10 justify-center" onClick={() => onNavigate('landing')}>
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white">
              <Wallet size={24} />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Pay<span className="text-brand-600">Easy</span>
            </span>
          </div>

          <div className="text-center lg:text-left mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Bem-vindo de volta!</h2>
            <p className="text-slate-500">
              Não tem uma conta? <button onClick={() => onNavigate('register')} className="text-brand-600 font-bold hover:underline">Crie uma grátis</button>
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={20} />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder-slate-400"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700">Senha</label>
                <a href="#" className="text-sm text-brand-600 hover:text-brand-700 font-medium">Esqueceu a senha?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={20} />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder-slate-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-brand-200 hover:shadow-xl hover:shadow-brand-300 transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Entrando...
                </>
              ) : (
                <>
                  Entrar na Plataforma <ArrowRight size={20} />
                </>
              )}
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Ou entre com</span>
              </div>
            </div>

            <button type="button" className="w-full bg-white border border-slate-200 text-slate-700 font-semibold py-3 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;