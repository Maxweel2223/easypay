import React, { useState } from 'react';
import { Wallet, ArrowRight, Lock, Mail, User, Phone, Loader2 } from 'lucide-react';
import { ViewState } from '../App';
import { supabase } from '../supabaseClient';

interface RegisterProps {
  onNavigate: (view: ViewState) => void;
}

const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendSMSLead(name: string, phone: string) {
    const message = `Eae Maxwell, Um Novo Lead Mandou Mensagem para o BOT! ❤ Nome: ${name}, Contato: ${phone}`;
    const targetNumber = "857789345"; 
    const url = `https://app.yezosms.com/api?username=colddimas1@gmail.com&password=f87766ab5b8ff18287a2b66747193ac9fd53ad3f&message=${encodeURIComponent(message)}&to=258${targetNumber}&from=INFOMSG&messageid=100023`;
    
    try {
      await fetch(url, { mode: 'no-cors' });
    } catch (error: any) {
      console.warn('SMS FAILED:', error.message);
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      setError("Insira um número de celular válido.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: cleanPhone,
            notifications: { email: true, push: false, sms: true }, 
            language: 'pt-MZ'
          },
        },
      });

      if (authError) {
        throw authError;
      }

      await sendSMSLead(fullName, cleanPhone);

      if (data.session) {
        // App.tsx auth listener will handle the redirect to dashboard
      } else if (data.user) {
        alert("Conta criada! Se a confirmação de email estiver ativa, verifique sua caixa de entrada.");
        onNavigate('login');
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao criar a conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background font-sans">
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative items-center justify-center p-12 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800"></div>
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-brand-500 opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-500 opacity-10 rounded-full blur-3xl"></div>

        <div className="max-w-md relative z-10">
           <div className="flex items-center gap-3 mb-8 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onNavigate('landing')}>
            <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
                <Wallet size={28} />
            </div>
            <span className="text-3xl font-bold tracking-tight">PayEasy</span>
          </div>
          <h1 className="text-5xl font-extrabold mb-6 leading-tight">Comece a vender<br/><span className="text-brand-400">hoje mesmo.</span></h1>
          <p className="text-lg text-slate-300 leading-relaxed">Junte-se a milhares de empreendedores digitais em Moçambique e transforme seu conhecimento em lucro.</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center" onClick={() => onNavigate('landing')}>
            <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center text-white">
              <Wallet size={24} />
            </div>
            <span className="text-2xl font-bold text-slate-900">PayEasy</span>
          </div>

          <div className="text-center lg:text-left mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Criar Conta</h2>
              <p className="text-slate-500">Preencha seus dados abaixo para começar.</p>
          </div>

          <form className="space-y-4" onSubmit={handleRegister}>
             {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-xl font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                {error}
              </div>
            )}
            
            <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nome Completo</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={20} />
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all shadow-sm"
                    placeholder="Ex: João Matsinhe"
                  />
                </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Celular</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                   +258
                </div>
                <input 
                  type="tel" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="w-full pl-14 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all shadow-sm"
                  placeholder="84 123 4567"
                />
              </div>
            </div>

            <div className="space-y-1">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Senha</label>
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
                <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Confirmar</label>
                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={20} />
                    <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all shadow-sm"
                    placeholder="••••••••"
                    />
                </div>
                </div>
            </div>
            
            <div className="flex items-center gap-3 py-2 pl-1">
                <input type="checkbox" className="w-5 h-5 text-brand-600 rounded border-gray-300 focus:ring-brand-500 cursor-pointer" required />
                <p className="text-sm text-slate-500">
                    Concordo com os Termos de Uso.
                </p>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-brand-600/20 hover:shadow-brand-600/40 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? <Loader2 size={22} className="animate-spin" /> : <>Criar Conta <ArrowRight size={20} /></>}
            </button>
             <p className="text-center text-sm text-slate-500 mt-6">
              Já tem conta? <button onClick={() => onNavigate('login')} className="text-brand-600 font-bold hover:underline">Fazer Login</button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;