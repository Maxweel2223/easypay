import React from 'react';
import { ArrowRight, CheckCircle2, TrendingUp, DollarSign, User } from 'lucide-react';
import { ViewState } from '../App';

interface HeroProps {
  onNavigate?: (view: ViewState) => void;
}

const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-brand-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 left-0 -ml-20 -mt-20 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left Content */}
          <div className="lg:w-1/2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-bold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
              A Nova Revolução Digital em Moçambique
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6 tracking-tight">
              Transforme seu conhecimento em <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-cyan-400">lucro real.</span>
            </h1>
            
            <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Crie, venda e escale seus produtos digitais com a PayEasy. A plataforma feita para moçambicanos, com pagamentos via M-Pesa e Emola integrados.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
              <button 
                onClick={() => onNavigate && onNavigate('register')}
                className="w-full sm:w-auto px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-full font-bold text-lg shadow-lg shadow-brand-200 hover:shadow-xl hover:shadow-brand-300 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                Começar Agora Grátis
                <ArrowRight size={20} />
              </button>
              <a href="#como-funciona" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 hover:border-brand-300 hover:text-brand-600 rounded-full font-bold text-lg transition-all flex items-center justify-center">
                Ver demonstração
              </a>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 text-sm text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-brand-500" />
                <span>Sem taxa de adesão</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-brand-500" />
                <span>Saques imediatos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-brand-500" />
                <span>M-Pesa e Emola</span>
              </div>
            </div>
          </div>

          {/* Right Content - Abstract Dashboard Visualization */}
          <div className="lg:w-1/2 w-full perspective-1000">
            <div className="relative w-full max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 transform rotate-y-6 rotate-x-6 hover:rotate-0 transition-all duration-700 ease-out">
              
              {/* Fake Dashboard Header */}
              <div className="flex items-center justify-between mb-6 border-b border-slate-50 pb-4">
                <div className="flex gap-2">
                   <div className="w-3 h-3 rounded-full bg-red-400"></div>
                   <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                   <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="text-xs font-semibold text-slate-400">PayEasy Dashboard</div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-brand-50 p-4 rounded-xl border border-brand-100">
                  <div className="flex items-center gap-2 mb-2 text-brand-600">
                    <TrendingUp size={18} />
                    <span className="text-xs font-bold">Vendas Hoje</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-800">12.450 MT</div>
                  <div className="text-xs text-brand-600 font-medium">+15% vs ontem</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-2 text-slate-500">
                    <User size={18} />
                    <span className="text-xs font-bold">Novos Alunos</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-800">24</div>
                  <div className="text-xs text-green-500 font-medium">+4 hoje</div>
                </div>
              </div>

              {/* Recent Sales List */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Vendas Recentes</div>
                {[
                  { name: "João Matsinhe", product: "Curso de Marketing Digital", amount: "2.500 MT", method: "M-Pesa" },
                  { name: "Ana Paula", product: "Ebook Receitas", amount: "500 MT", method: "Emola" },
                  { name: "Carlos Sitoe", product: "Mentoria VIP", amount: "5.000 MT", method: "M-Pesa" },
                ].map((sale, i) => (
                  <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                        {sale.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{sale.name}</div>
                        <div className="text-xs text-slate-500">{sale.product}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-brand-600">{sale.amount}</div>
                      <div className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1">{sale.method}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Floating Element - Notification */}
              <div className="absolute -right-8 top-20 bg-white p-4 rounded-xl shadow-xl border border-slate-100 animate-bounce-slow max-w-[200px]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                    <DollarSign size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Nova Venda!</div>
                    <div className="text-xs text-slate-500">Você recebeu <span className="font-bold text-green-600">1.200 MT</span> via M-Pesa.</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;