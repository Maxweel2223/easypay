import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Product } from '../types';
import { Loader2, Lock, ShieldCheck, CheckCircle, Smartphone, AlertCircle, ArrowRight, Download } from 'lucide-react';

const Checkout: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Checkout State
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [formData, setFormData] = useState({
      name: '',
      email: '',
      whatsapp: '',
      paymentMethod: 'M-Pesa'
  });

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
      try {
          // Note: RLS policies must allow public read for this to work without auth
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;
          setProduct(data);
      } catch (err: any) {
          console.error("Checkout fetch error:", err);
          setError("Produto não encontrado ou indisponível.");
      } finally {
          setLoading(false);
      }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!formData.name || !formData.whatsapp) {
          alert("Por favor preencha os campos obrigatórios.");
          return;
      }

      setStep('processing');

      // Simulate API Payment Request
      setTimeout(async () => {
          // Here we would integrate with the actual Payment Gateway API
          // For now, we simulate a success response
          
          setStep('success');

          // Optional: Record the sale in the DB (would normally be done via Webhook from Payment Gateway)
          // We won't implement the insert here to avoid complexity with public write permissions, 
          // but the structure supports it.
      }, 3000);
  };

  const handleRedeem = () => {
      if (product?.redirectUrl) {
          window.location.href = product.redirectUrl;
      } else {
          alert("Link de entrega não configurado pelo vendedor. Entre em contato via WhatsApp.");
      }
  };

  if (loading) {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <Loader2 className="animate-spin text-indigo-600" size={40} />
          </div>
      );
  }

  if (error || !product) {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
                  <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
                  <h1 className="text-xl font-bold text-gray-900 mb-2">Ops! Algo deu errado.</h1>
                  <p className="text-gray-600 mb-6">{error || "Link inválido ou produto removido."}</p>
                  <a href="/" className="text-indigo-600 font-medium hover:underline">Voltar para PayEasy</a>
              </div>
          </div>
      );
  }

  // SUCCESS VIEW
  if (step === 'success') {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full animate-fade-in">
                  <div className="bg-emerald-500 p-8 text-center text-white">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                          <CheckCircle size={32} className="text-white" />
                      </div>
                      <h1 className="text-2xl font-bold mb-2">Pagamento Realizado!</h1>
                      <p className="text-emerald-100">Obrigado pela sua compra, {formData.name.split(' ')[0]}.</p>
                  </div>
                  
                  <div className="p-8 space-y-6">
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                           <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                              {product.imageUrl ? (
                                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400"><Lock size={20} /></div>
                              )}
                           </div>
                           <div>
                               <p className="text-sm text-gray-500">Produto adquirido</p>
                               <h3 className="font-bold text-gray-900">{product.name}</h3>
                           </div>
                      </div>

                      <div className="text-center space-y-4">
                          <p className="text-sm text-gray-600">Seu pedido foi processado. Clique abaixo para acessar seu produto agora mesmo.</p>
                          
                          <button 
                            onClick={handleRedeem}
                            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                          >
                              <Download size={20} />
                              Resgatar Produto
                          </button>

                          <p className="text-xs text-gray-400 mt-4">
                              Em caso de dúvidas, entre em contato via WhatsApp do vendedor: {product.whatsapp}
                          </p>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // CHECKOUT FORM VIEW
  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
       {/* Left Column: Product Info */}
       <div className="lg:w-1/2 bg-white p-8 lg:p-16 flex flex-col justify-center border-r border-gray-100">
           <div className="max-w-md mx-auto w-full">
               <div className="mb-8">
                   <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">
                       Checkout Seguro
                   </span>
               </div>
               
               <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden mb-8 shadow-sm">
                   {product.imageUrl ? (
                       <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                   ) : (
                       <div className="w-full h-full flex items-center justify-center text-gray-400">Sem imagem</div>
                   )}
               </div>

               <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{product.name}</h1>
               <p className="text-2xl font-medium text-indigo-600 mb-6">{product.price.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}</p>
               
               <div className="prose text-gray-500 text-sm mb-8">
                   {product.description || "Sem descrição disponível."}
               </div>

               <div className="flex items-center gap-2 text-sm text-gray-400 border-t border-gray-100 pt-6">
                   <ShieldCheck size={16} />
                   <span>Pagamento processado via PayEasy (Moçambique)</span>
               </div>
           </div>
       </div>

       {/* Right Column: Payment Form */}
       <div className="lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center bg-gray-50">
           <div className="max-w-md mx-auto w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
               <h2 className="text-xl font-bold text-gray-900 mb-6">Dados de Pagamento</h2>
               
               <form onSubmit={handleSubmit} className="space-y-4">
                   <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo <span className="text-red-500">*</span></label>
                       <input 
                            type="text"
                            name="name"
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="Seu nome"
                            value={formData.name}
                            onChange={handleInputChange}
                            disabled={step === 'processing'}
                       />
                   </div>

                   <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp <span className="text-red-500">*</span></label>
                       <div className="relative">
                            <span className="absolute left-3 top-3.5 text-gray-400"><Smartphone size={18}/></span>
                            <input 
                                    type="tel"
                                    name="whatsapp"
                                    required
                                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="84 123 4567"
                                    value={formData.whatsapp}
                                    onChange={handleInputChange}
                                    disabled={step === 'processing'}
                            />
                       </div>
                   </div>

                   <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">E-mail <span className="text-gray-400 text-xs">(Opcional)</span></label>
                       <input 
                            type="email"
                            name="email"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="seu@email.com"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={step === 'processing'}
                       />
                   </div>

                   <div className="pt-4">
                       <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pagamento</label>
                       <div className="grid grid-cols-2 gap-3">
                           <button 
                                type="button"
                                onClick={() => setFormData({...formData, paymentMethod: 'M-Pesa'})}
                                className={`p-3 border rounded-lg flex flex-col items-center justify-center gap-1 font-medium text-sm transition-all ${
                                    formData.paymentMethod === 'M-Pesa' 
                                    ? 'border-red-500 bg-red-50 text-red-700' 
                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                }`}
                                disabled={step === 'processing'}
                           >
                               <span className="font-bold">M-Pesa</span>
                               <span className="text-xs opacity-70">Vodacom</span>
                           </button>
                           <button 
                                type="button"
                                onClick={() => setFormData({...formData, paymentMethod: 'e-Mola'})}
                                className={`p-3 border rounded-lg flex flex-col items-center justify-center gap-1 font-medium text-sm transition-all ${
                                    formData.paymentMethod === 'e-Mola' 
                                    ? 'border-orange-500 bg-orange-50 text-orange-700' 
                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                }`}
                                disabled={step === 'processing'}
                           >
                               <span className="font-bold">e-Mola</span>
                               <span className="text-xs opacity-70">Movitel</span>
                           </button>
                       </div>
                   </div>

                   <button 
                        type="submit" 
                        disabled={step === 'processing'}
                        className="w-full mt-6 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                   >
                       {step === 'processing' ? (
                           <>
                                <Loader2 className="animate-spin" /> Processando...
                           </>
                       ) : (
                           <>
                                Pagar {product.price.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })} <ArrowRight size={20} />
                           </>
                       )}
                   </button>
                   
                   <p className="text-xs text-center text-gray-400 mt-4">
                       Ao pagar, você concorda com os termos de serviço do PayEasy.
                   </p>
               </form>
           </div>
       </div>
    </div>
  );
};

export default Checkout;