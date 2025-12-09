import React from 'react';
import { ArrowRight } from 'lucide-react';

const LocalPayments: React.FC = () => {
  const mpesaLogo = "https://play-lh.googleusercontent.com/BeFHX9dTKeuLrF8TA0gr9kfXLGicQtnxoTM8xJThn9EKCl-h5JmJoqFkaPBoo4qi7w";
  const emolaLogo = "https://play-lh.googleusercontent.com/2TGAhJ55tiyhCwW0ZM43deGv4lUTFTBMoq83mnAO6-bU5hi2NPyKX8BN8iKt13irK7Y=w240-h480-rw";

  return (
    <section id="pagamentos" className="py-24 bg-slate-900 relative overflow-hidden text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
        backgroundSize: '32px 32px'
      }}></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          <div className="lg:w-1/2">
            <div className="inline-block px-4 py-2 bg-brand-900/50 border border-brand-500/30 rounded-full text-brand-300 font-semibold text-sm mb-6">
              100% Otimizado para Moçambique 🇲🇿
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              Seus clientes pagam como quiserem: <span className="text-brand-400">M-Pesa e Emola</span>
            </h2>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
              Esqueça a complexidade de cartões de crédito internacionais. A PayEasy remove a fricção de compra conectando-se diretamente às carteiras móveis mais usadas em Moçambique.
            </p>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-lg flex-shrink-0">
                  <img src={mpesaLogo} alt="M-Pesa Logo" className="w-full h-full object-cover rounded-lg" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">M-Pesa Integrado</h4>
                  <p className="text-sm text-slate-400">Notificação push direta no celular do cliente.</p>
                </div>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-lg flex-shrink-0">
                  <img src={emolaLogo} alt="e-Mola Logo" className="w-full h-full object-cover rounded-lg" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">e-Mola Integrado</h4>
                  <p className="text-sm text-slate-400">Pagamentos instantâneos e seguros.</p>
                </div>
              </li>
            </ul>

            <a href="#precos" className="text-white border-b-2 border-brand-500 pb-1 hover:text-brand-400 hover:border-brand-400 transition-all flex items-center gap-2 font-semibold w-fit">
              Ver taxas de processamento <ArrowRight size={16} />
            </a>
          </div>

          <div className="lg:w-1/2 relative">
             {/* Mobile Phone Mockup */}
             <div className="relative mx-auto border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-2xl flex flex-col justify-start overflow-hidden">
                <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[17px] top-[72px] rounded-l-lg"></div>
                <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
                <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
                <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
                
                {/* Screen Content */}
                <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white relative">
                   <div className="bg-brand-600 h-40 pt-10 px-6 text-white rounded-b-3xl absolute top-0 w-full z-0">
                      <div className="text-xs opacity-80 mb-1">Total a pagar</div>
                      <div className="text-3xl font-bold">2.500 MT</div>
                   </div>

                   <div className="mt-32 px-4 relative z-10">
                      <div className="bg-white rounded-xl shadow-xl p-6 border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wide">Método de Pagamento</h3>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 border-2 border-brand-500 bg-brand-50 rounded-lg cursor-pointer">
                            <div className="flex items-center gap-3">
                              <img src={mpesaLogo} alt="M-Pesa" className="w-6 h-6 object-contain rounded-md" />
                              <span className="font-bold text-slate-800">M-Pesa</span>
                            </div>
                            <div className="w-4 h-4 rounded-full border-4 border-brand-600"></div>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg opacity-60">
                            <div className="flex items-center gap-3">
                              <img src={emolaLogo} alt="e-Mola" className="w-6 h-6 object-contain rounded-md" />
                              <span className="font-bold text-slate-700">e-Mola</span>
                            </div>
                            <div className="w-4 h-4 rounded-full border border-slate-300"></div>
                          </div>
                        </div>

                        <div className="mt-6">
                           <label className="block text-xs font-semibold text-slate-600 mb-2">Número de Telefone</label>
                           <input type="text" value="+258 84 123 4567" readOnly className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 font-medium"/>
                        </div>

                        <button className="w-full bg-brand-600 text-white font-bold py-3.5 rounded-lg mt-6 shadow-lg shadow-brand-200">
                          Confirmar Pagamento
                        </button>
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

export default LocalPayments;