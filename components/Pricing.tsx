import React from 'react';
import { Check } from 'lucide-react';
import { ViewState } from '../App';

interface PricingProps {
  onNavigate?: (view: ViewState) => void;
}

const Pricing: React.FC<PricingProps> = ({ onNavigate }) => {
  return (
    <section id="precos" className="py-24 bg-slate-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Comece Grátis. <br/> Pague apenas quando vender.
          </h2>
          <p className="text-lg text-slate-600">
            Sem mensalidades, sem taxas de adesão e sem letras miúdas. Nós só ganhamos quando você ganha.
          </p>
        </div>

        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 relative">
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-brand-400 to-brand-600"></div>
          
          <div className="p-8 md:p-12 text-center">
            <h3 className="text-xl font-bold text-slate-500 uppercase tracking-wide mb-4">Taxa por transação</h3>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-6xl font-extrabold text-slate-900">4.9%</span>
            </div>
            <div className="text-2xl font-bold text-slate-400 mb-8">+ 5 MT fixos</div>

            <button 
              onClick={() => onNavigate && onNavigate('register')}
              className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-brand-200 transition-all mb-8"
            >
              Criar Conta Grátis
            </button>

            <div className="space-y-4 text-left">
              {[
                "Produtos Ilimitados",
                "Área de Membros Inclusa",
                "Checkout de Alta Conversão",
                "Recuperação de Carrinho",
                "Suporte via WhatsApp",
                "Saques diários"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-green-600 font-bold" />
                  </div>
                  <span className="text-slate-600 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-50 p-6 text-center text-sm text-slate-500 border-t border-slate-100">
            A taxa é descontada automaticamente no momento da venda.
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;