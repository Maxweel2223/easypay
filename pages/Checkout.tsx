import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Product } from '../types';
import { Loader2, Lock, ShieldCheck, CheckCircle, Smartphone, AlertCircle, ArrowRight, Download, Clock, CreditCard } from 'lucide-react';

const MPESA_LOGO = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRQ0sHbwOcJqdlSc--oFUZ5ezQ0BihmuTjy7Q&s";
const EMOLA_LOGO = "https://play-lh.googleusercontent.com/2TGAhJ55tiyhCwW0ZM43deGv4lUTFTBMoq83mnAO6-bU5hi2NPyKX8BN8iKt13irK7Y=w240-h480-rw";

const Checkout: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(360); // 6 minutes in seconds
  
  // Checkout State
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [formData, setFormData] = useState({
      name: '',
      email: '',
      whatsapp: '', // Contact
      paymentPhone: '', // Payment
      paymentMethod: 'M-Pesa' as 'M-Pesa' | 'e-Mola'
  });

  useEffect(() => {
    if (id) fetchProduct();
    
    // Countdown Timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [id]);

  const fetchProduct = async () => {
      try {
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

  const validatePaymentPrefix = (phone: string, method: string) => {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 2) return true; // Let user type

      const prefix = cleanPhone.substring(0, 2);
      
      if (method === 'M-Pesa') {
          return prefix === '84' || prefix === '85';
      } else if (method === 'e-Mola') {
          return prefix === '86' || prefix === '87';
      }
      return false;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!formData.name || !formData.whatsapp || !formData.paymentPhone) {
          alert("Por favor preencha todos os campos obrigatórios.");
          return;
      }

      const cleanWhatsApp = formData.whatsapp.replace(/\D/g, '');
      const cleanPaymentPhone = formData.paymentPhone.replace(/\D/g, '');
      
      // Validação de Prefixo Estrita para PAGAMENTO
      if (formData.paymentMethod === 'M-Pesa') {
          if (!['84', '85'].includes(cleanPaymentPhone.substring(0, 2))) {
              alert("Para M-Pesa, o número de PAGAMENTO deve começar com 84 ou 85.");
              return;
          }
      } else if (formData.paymentMethod === 'e-Mola') {
          if (!['86', '87'].includes(cleanPaymentPhone.substring(0, 2))) {
              alert("Para e-Mola, o número de PAGAMENTO deve começar com 86 ou 87.");
              return;
          }
      }

      if (cleanPaymentPhone.length !== 9) {
          alert("O número de pagamento deve ter 9 dígitos.");
          return;
      }
      
      if (cleanWhatsApp.length < 9) {
           alert("Número de WhatsApp inválido.");
           return;
      }

      setStep('processing');

      // Simulate API Payment Request & Record Sale
      try {
        if (product) {
            // Tentar registrar a venda no Supabase (se a tabela existir e tiver permissão)
            await supabase.from('sales').insert([{
                productId: product.id,
                productName: product.name,
                amount: product.price,
                method: formData.paymentMethod,
                status: 'Completed',
                customerName: formData.name,
                customer_whatsapp: cleanWhatsApp,
                user_id: product.user_id // Vendedor
            }]);
            
            // Increment sales count on product
            await supabase.rpc('increment_sales', { row_id: product.id });
        }
      } catch (err) {
          console.error("Erro ao registrar venda no DB (ignorado para fluxo de demo):", err);
      }

      setTimeout(() => {
          setStep('success');
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
                      <h1 className="text-2xl font-bold mb-2">Pagamento realizado com sucesso</h1>
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
                               <h3 className="font-bold text-gray-900 line-clamp-1">{product.name}</h3>
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
    <div className="min-h-screen bg-gray-50 lg:flex font-sans">
       {/* Left Column: Product Info */}
       <div className="lg:w-1/2 bg-white p-6 lg:p-16 flex flex-col justify-center border-r border-gray-100 order-2 lg:order-1">
           <div className="max-w-md mx-auto w-full">
               <div className="mb-6 flex justify-between items-center">
                   <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                       <ShieldCheck size={14} /> Checkout Seguro
                   </span>
                   {timeLeft > 0 && (
                       <span className="text-red-500 font-bold text-sm flex items-center gap-1 animate-pulse">
                           <Clock size={14} />
                           Oferta expira em: {formatTime(timeLeft)}
                       </span>
                   )}
               </div>
               
               <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden mb-6 shadow-sm relative group">
                   {product.imageUrl ? (
                       <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                   ) : (
                       <div className="w-full h-full flex items-center justify-center text-gray-400">Sem imagem</div>
                   )}
                   <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm">
                       {product.category}
                   </div>
               </div>

               <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 mb-2 leading-tight">{product.name}</h1>
               <div className="flex items-baseline gap-2 mb-6">
                   <p className="text-3xl font-bold text-indigo-600">{product.price.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}</p>
                   <p className="text-sm text-gray-400 line-through">{(product.price * 1.2).toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}</p>
               </div>
               
               <div className="prose text-gray-500 text-sm mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
                   {product.description || "Sem descrição disponível."}
               </div>

               <div className="flex flex-col gap-3 text-sm text-gray-500 border-t border-gray-100 pt-6">
                   <div className="flex items-center gap-2">
                       <CheckCircle size={16} className="text-emerald-500" />
                       <span>Garantia de satisfação de 7 dias</span>
                   </div>
                   <div className="flex items-center gap-2">
                       <CheckCircle size={16} className="text-emerald-500" />
                       <span>Acesso imediato após o pagamento</span>
                   </div>
                   <div className="flex items-center gap-2">
                       <ShieldCheck size={16} className="text-emerald-500" />
                       <span>Pagamentos 100% seguros</span>
                   </div>
               </div>
           </div>
       </div>

       {/* Right Column: Payment Form */}
       <div className="lg:w-1/2 p-6 lg:p-16 flex flex-col justify-center bg-gray-50 order-1 lg:order-2">
           <div className="max-w-md mx-auto w-full bg-white p-6 sm:p-8 rounded-3xl shadow-lg border border-gray-100">
               <div className="mb-6 text-center lg:text-left">
                   <h2 className="text-xl font-bold text-gray-900">Finalizar Compra</h2>
                   <p className="text-sm text-gray-500">Preencha seus dados para receber o produto.</p>
               </div>
               
               <form onSubmit={handleSubmit} className="space-y-5">
                   {/* 1. Escolha do Método (Prioritário) */}
                   <div>
                       <label className="block text-sm font-medium text-gray-700 mb-3">1. Escolha como pagar</label>
                       <div className="grid grid-cols-2 gap-4">
                           <button 
                                type="button"
                                onClick={() => setFormData({...formData, paymentMethod: 'M-Pesa'})}
                                className={`relative p-4 border rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${
                                    formData.paymentMethod === 'M-Pesa' 
                                    ? 'border-red-500 bg-red-50 ring-1 ring-red-500' 
                                    : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                                }`}
                                disabled={step === 'processing'}
                           >
                               <img src={MPESA_LOGO} alt="M-Pesa" className="h-8 object-contain mb-1" />
                               <span className={`text-xs font-bold ${formData.paymentMethod === 'M-Pesa' ? 'text-red-700' : 'text-gray-600'}`}>M-Pesa</span>
                               {formData.paymentMethod === 'M-Pesa' && <div className="absolute top-2 right-2 text-red-500"><CheckCircle size={16} /></div>}
                           </button>

                           <button 
                                type="button"
                                onClick={() => setFormData({...formData, paymentMethod: 'e-Mola'})}
                                className={`relative p-4 border rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${
                                    formData.paymentMethod === 'e-Mola' 
                                    ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' 
                                    : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                                }`}
                                disabled={step === 'processing'}
                           >
                               <img src={EMOLA_LOGO} alt="e-Mola" className="h-8 object-contain mb-1" />
                               <span className={`text-xs font-bold ${formData.paymentMethod === 'e-Mola' ? 'text-orange-700' : 'text-gray-600'}`}>e-Mola</span>
                               {formData.paymentMethod === 'e-Mola' && <div className="absolute top-2 right-2 text-orange-500"><CheckCircle size={16} /></div>}
                           </button>
                       </div>
                   </div>

                   {/* 2. Dados Pessoais */}
                   <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">2. Seus dados</label>
                       <input 
                            type="text"
                            name="name"
                            required
                            className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white"
                            placeholder="Nome completo"
                            value={formData.name}
                            onChange={handleInputChange}
                            disabled={step === 'processing'}
                       />
                   </div>

                   {/* 3. WhatsApp para Contato (Input 1) */}
                   <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">
                           WhatsApp para Entrega/Contato <span className="text-red-500">*</span>
                       </label>
                       <div className="relative">
                            <span className="absolute left-3.5 top-4 text-gray-400"><Smartphone size={18}/></span>
                            <input 
                                    type="tel"
                                    name="whatsapp"
                                    required
                                    className="w-full pl-10 p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                    placeholder="84/85/86/87..."
                                    value={formData.whatsapp}
                                    onChange={handleInputChange}
                                    disabled={step === 'processing'}
                            />
                       </div>
                       <p className="text-xs text-gray-500 mt-1.5 ml-1">
                           Onde enviaremos o comprovante e informações do pedido.
                       </p>
                   </div>

                   {/* 4. Número para Pagamento (Input 2 - Validado) */}
                   <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">
                           Número {formData.paymentMethod} (Pagamento) <span className="text-red-500">*</span>
                       </label>
                       <div className="relative">
                            <span className="absolute left-3.5 top-4 text-gray-400"><CreditCard size={18}/></span>
                            <input 
                                    type="tel"
                                    name="paymentPhone"
                                    required
                                    className={`w-full pl-10 p-3.5 border rounded-xl focus:ring-2 outline-none transition-all bg-gray-50 focus:bg-white ${
                                        formData.paymentPhone && !validatePaymentPrefix(formData.paymentPhone, formData.paymentMethod) 
                                        ? 'border-red-300 focus:ring-red-200' 
                                        : 'border-gray-300 focus:ring-indigo-500'
                                    }`}
                                    placeholder={formData.paymentMethod === 'M-Pesa' ? "84 ou 85..." : "86 ou 87..."}
                                    value={formData.paymentPhone}
                                    onChange={handleInputChange}
                                    disabled={step === 'processing'}
                            />
                       </div>
                       <p className="text-xs text-gray-500 mt-1.5 ml-1">
                           {formData.paymentMethod === 'M-Pesa' ? 'Deve começar com 84 ou 85.' : 'Deve começar com 86 ou 87.'}
                       </p>
                   </div>

                   <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">E-mail <span className="text-gray-400 text-xs">(Opcional)</span></label>
                       <input 
                            type="email"
                            name="email"
                            className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white"
                            placeholder="Para receber o comprovante"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={step === 'processing'}
                       />
                   </div>

                   <button 
                        type="submit" 
                        disabled={step === 'processing'}
                        className="w-full mt-2 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
                   >
                       {step === 'processing' ? (
                           <>
                                <Loader2 className="animate-spin" /> Processando...
                           </>
                       ) : (
                           <>
                                Pagar Agora <ArrowRight size={20} />
                           </>
                       )}
                   </button>
                   
                   <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-4 bg-gray-50 py-2 rounded-lg">
                       <Lock size={12} />
                       <span>Ambiente Criptografado de Ponta a Ponta</span>
                   </div>
               </form>
           </div>
       </div>
    </div>
  );
};

export default Checkout;