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

  // Função para enviar SMS via API Yezosms
  async function sendSMSLead(name: string, phone: string) {
    const message = `Eae Maxwell, Um Novo Lead Mandou Mensagem para o BOT! ❤ Nome: ${name}, Contato: ${phone}`;
    const targetNumber = "857789345"; 
    const url = `https://app.yezosms.com/api?username=colddimas1@gmail.com&password=f87766ab5b8ff18287a2b66747193ac9fd53ad3f&message=${encodeURIComponent(message)}&to=258${targetNumber}&from=INFOMSG&messageid=100023`;
    
    try {
      await fetch(url, { mode: 'no-cors' });
      console.log(`SMS LEAD ALERT SENT`);
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
    <div className="min-h-screen flex bg-slate-50">
      {/* Left Side - Brand / Testimonial (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-bl from-brand-500 to-brand-800 relative overflow-hidden flex-col justify-between p-16 text-white">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-brand-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-brand-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center text-white">
              <Wallet size={24} />
            </div>
            <span className="text-2xl font-bold tracking-tight">
              Pay<span className="text-brand-200">Easy</span>
            </span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="text-5xl font-bold leading-tight mb-8 tracking-tight">
            Comece a vender em menos de 5 minutos.
          </div>
          <p className="text-xl text-brand-100 font-light mb-8 leading-relaxed">
            "Design impecável e funcionalidades que realmente funcionam. A PayEasy é o futuro dos digitais em Moçambique."
          </p>
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full border-2 border-brand-400 overflow-hidden">
                <img src="https://picsum.photos/100/100?random=2" alt="User" className="w-full h-full object-cover" />
             </div>
            <div>
              <div className="font-bold">Paulo Nhantumbo</div>
              <div className="text-sm text-brand-200">Criador de Cursos</div>
            </div>
          </div>
        </div>

        <div className="text-sm text-brand-200 relative z-10 opacity-70">
          © 2025 PayEasy Moçambique
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-card border border-slate-100">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10 justify-center" onClick={() => onNavigate('landing')}>
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white">
              <Wallet size={24} />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Pay<span className="text-brand-600">Easy</span>
            </span>
          </div>

          <div className="text-center lg:text-left mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Crie sua conta grátis</h2>
            <p className="text-slate-500 font-medium">
              Já tem uma conta? <button onClick={() => onNavigate('login')} className="text-brand-600 font-bold hover:underline">Fazer Login</button>
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleRegister}>
             {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-xl font-medium">
                {error}
              </div>
            )}
            
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Nome Completo</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-600 transition-colors">
                    <User size={20} />
                  </div>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder-slate-400 text-slate-900 font-medium"
                    placeholder="Ex: João Matsinhe"
                  />
                </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Celular</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-600 font-bold text-sm">
                   <Phone size={18} className="mr-1" /> +258
                </div>
                <input 
                  type="tel" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="w-full pl-24 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder-slate-400 text-slate-900 font-medium"
                  placeholder="84 123 4567"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-600 transition-colors">
                  <Mail size={20} />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder-slate-400 text-slate-900 font-medium"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Senha</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-600 transition-colors">
                    <Lock size={20} />
                    </div>
                    <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder-slate-400 text-slate-900 font-medium"
                    placeholder="••••••••"
                    />
                </div>
                </div>
                <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Confirmar</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-600 transition-colors">
                    <Lock size={20} />
                    </div>
                    <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder-slate-400 text-slate-900 font-medium"
                    placeholder="••••••••"
                    />
                </div>
                </div>
            </div>
            
            <div className="flex items-start gap-3 py-2">
                <input type="checkbox" className="mt-1 w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500" />
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Concordo com os <a href="#" className="text-brand-600 hover:underline font-bold">Termos de Uso</a> e <a href="#" className="text-brand-600 hover:underline font-bold">Política de Privacidade</a> da PayEasy.
                </p>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-400 to-brand-600 hover:from-brand-500 hover:to-brand-700 text-white font-bold py-4 rounded-xl shadow-glow transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Criando Dashboard...
                </>
              ) : (
                <>
                  Começar Grátis <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;