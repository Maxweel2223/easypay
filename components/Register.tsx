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
    <div className="min-h-screen flex bg-slate-100">
      <div className="hidden lg:flex lg:w-1/2 bg-brand-700 items-center justify-center p-12 text-white">
        <div className="max-w-md">
           <div className="flex items-center gap-2 mb-8 cursor-pointer" onClick={() => onNavigate('landing')}>
            <Wallet size={32} />
            <span className="text-3xl font-bold">PayEasy</span>
          </div>
          <h1 className="text-4xl font-bold mb-6">Comece a vender hoje.</h1>
          <p className="text-lg text-brand-100">Junte-se a milhares de empreendedores digitais em Moçambique.</p>
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

          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center lg:text-left">Criar Conta</h2>

          <form className="space-y-4" onSubmit={handleRegister}>
             {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded font-medium">
                {error}
              </div>
            )}
            
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="Ex: João Matsinhe"
                  />
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Celular</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">
                   +258
                </div>
                <input 
                  type="tel" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="w-full pl-14 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="84 123 4567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="••••••••"
                    />
                </div>
                </div>
                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="••••••••"
                    />
                </div>
                </div>
            </div>
            
            <div className="flex items-start gap-3 py-2">
                <input type="checkbox" className="mt-1 w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500" required />
                <p className="text-sm text-slate-600">
                    Concordo com os Termos de Uso e Política de Privacidade.
                </p>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <>Criar Conta <ArrowRight size={20} /></>}
            </button>
             <p className="text-center text-sm text-slate-600 mt-4">
              Já tem conta? <button onClick={() => onNavigate('login')} className="text-brand-600 font-bold hover:underline">Fazer Login</button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;