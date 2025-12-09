import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, CheckCircle2, Zap, Smartphone, Lock, User, Mail, CreditCard, AlertTriangle, Check } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface CheckoutProps {
  productId: string;
}

const Checkout: React.FC<CheckoutProps> = ({ productId }) => {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'emola'>('mpesa');
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: ''
  });

  // Order Bump State
  const [addOrderBump, setAddOrderBump] = useState(false);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(6 * 60); // 6 minutes in seconds

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      // Fetch Real Data
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
        
      if (data) {
          setProduct(data);
      } else {
          // Fallback if not found locally yet (e.g. freshly created in session)
          console.error("Product not found via API, waiting for replication or error.");
      }
      setLoading(false);
    };

    fetchProduct();
  }, [productId]);

  // Timer Logic
  useEffect(() => {
    if (!product?.is_limited_time) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [product]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const calculateTotal = () => {
    if (!product) return 0;
    let total = product.price;
    if (addOrderBump && product.has_offer) total += product.offer_price;
    return total;
  };

  const getPhonePrefix = () => {
      if (paymentMethod === 'mpesa') return '84 ou 85';
      return '86 ou 87';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        <div className="text-slate-500 font-medium">Carregando checkout seguro...</div>
      </div>
    );
  }

  if (!product) return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center p-10 bg-white rounded-xl shadow-lg">
              <AlertTriangle size={40} className="mx-auto text-red-500 mb-4"/>
              <h2 className="text-xl font-bold text-slate-900">Produto indisponível</h2>
              <p className="text-slate-500 mt-2">Este link pode ter expirado ou o produto foi removido.</p>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* Trust Header */}
      <div className="bg-white border-b border-slate-100 py-4 shadow-sm">
          <div className="container mx-auto px-4 flex justify-between items-center">
             <div className="flex items-center gap-2">
                 <Lock size={16} className="text-green-600"/>
                 <span className="text-sm font-bold text-slate-700">Checkout Seguro SSL</span>
             </div>
             <div className="text-xs text-slate-400 font-medium hidden md:block">
                 ID da Transação: {Math.random().toString(36).substr(2, 8).toUpperCase()}
             </div>
          </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Product Summary */}
          <div className="lg:col-span-5 order-2 lg:order-1 space-y-6">
             
             {/* Product Card */}
             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                 <div className="relative h-48 bg-slate-200">
                     {product.image_url ? (
                         <img src={product.image_url} alt={product.name} className="w-full h-full object-cover"/>
                     ) : (
                         <div className="flex items-center justify-center h-full text-slate-400 font-bold">Sem imagem</div>
                     )}
                     <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12 text-white">
                         <h1 className="text-xl font-bold leading-tight shadow-sm">{product.name}</h1>
                     </div>
                 </div>
                 <div className="p-6">
                     <p className="text-slate-600 text-sm leading-relaxed mb-6">{product.description}</p>
                     
                     <div className="flex justify-between items-center py-3 border-b border-slate-100">
                         <span className="text-slate-600 font-medium">Produto Principal</span>
                         <span className="text-slate-900 font-bold">{product.price.toLocaleString()} MT</span>
                     </div>
                     
                     {addOrderBump && (
                        <div className="flex justify-between items-center py-3 border-b border-slate-100 text-green-600 animate-fadeIn">
                             <span className="font-medium text-sm">+ {product.offer_title}</span>
                             <span className="font-bold text-sm">{product.offer_price.toLocaleString()} MT</span>
                        </div>
                     )}
                     
                     <div className="flex justify-between items-center pt-4 mt-2">
                         <span className="text-lg font-bold text-slate-800">Total a Pagar</span>
                         <span className="text-2xl font-extrabold text-brand-600">{calculateTotal().toLocaleString()} MT</span>
                     </div>
                 </div>
             </div>

             {/* Trust Badges */}
             <div className="flex items-center justify-center gap-6 opacity-60 grayscale hover:grayscale-0 transition-all">
                 <div className="flex flex-col items-center">
                     <ShieldCheck size={24} className="mb-1"/>
                     <span className="text-[10px] font-bold">Compra Segura</span>
                 </div>
                 <div className="flex flex-col items-center">
                     <Lock size={24} className="mb-1"/>
                     <span className="text-[10px] font-bold">Privacidade Protegida</span>
                 </div>
                 <div className="flex flex-col items-center">
                     <CheckCircle2 size={24} className="mb-1"/>
                     <span className="text-[10px] font-bold">Acesso Imediato</span>
                 </div>
             </div>

          </div>

          {/* Right Column: Checkout Form */}
          <div className="lg:col-span-7 order-1 lg:order-2">
             
             {/* Scarcity Timer */}
             {product.is_limited_time && timeLeft > 0 && (
                 <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center justify-between mb-6 shadow-sm animate-pulse-slow">
                     <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-full shadow-sm text-red-600">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-red-700 text-sm">OFERTA POR TEMPO LIMITADO</h3>
                            <p className="text-xs text-red-500">O preço subirá quando o contador zerar.</p>
                        </div>
                     </div>
                     <div className="text-2xl font-mono font-bold text-red-600 tracking-wider">
                         {formatTime(timeLeft)}
                     </div>
                 </div>
             )}

             <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 md:p-8">
                 
                 {/* Step 1: Personal Data */}
                 <div className="mb-8">
                     <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                         <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">1</span>
                         Dados Pessoais
                     </h3>
                     <div className="space-y-4">
                         <div className="relative">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                 <User size={18}/>
                             </div>
                             <input 
                                type="text"
                                placeholder="Nome Completo"
                                className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                                value={formData.fullName}
                                onChange={e => setFormData({...formData, fullName: e.target.value})}
                             />
                         </div>
                         <div className="relative">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                 <Mail size={18}/>
                             </div>
                             <input 
                                type="email"
                                placeholder="Seu melhor Email (Opcional)"
                                className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                             />
                         </div>
                     </div>
                 </div>

                 {/* Order Bump */}
                 {product.has_offer && (
                     <div 
                        onClick={() => setAddOrderBump(!addOrderBump)}
                        className={`mb-8 p-4 rounded-xl border-2 cursor-pointer transition-all relative overflow-hidden group ${addOrderBump ? 'border-yellow-400 bg-yellow-50' : 'border-slate-200 hover:border-slate-300'}`}
                     >
                         <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-bl-lg">OFERTA ÚNICA</div>
                         <div className="flex gap-4 items-start relative z-10">
                             <div className={`mt-1 w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${addOrderBump ? 'bg-yellow-500 border-yellow-500' : 'bg-white border-slate-300'}`}>
                                 {addOrderBump && <Check size={16} className="text-white"/>}
                             </div>
                             <div>
                                 <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                     <Zap size={16} className="text-yellow-500 fill-yellow-500" />
                                     Sim, adicionar {product.offer_title}
                                 </h4>
                                 <p className="text-sm text-slate-600 mt-1">
                                     Oferta exclusiva para esta compra. Adicione agora por apenas <span className="font-bold text-slate-900">{product.offer_price} MT</span>.
                                 </p>
                             </div>
                         </div>
                     </div>
                 )}

                 {/* Step 2: Payment */}
                 <div>
                     <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                         <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">2</span>
                         Pagamento
                     </h3>
                     
                     <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                         {/* Payment Selector */}
                         <div className="flex gap-3 mb-6">
                             <button 
                                onClick={() => setPaymentMethod('mpesa')}
                                className={`flex-1 p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all h-24 ${paymentMethod === 'mpesa' ? 'border-red-500 bg-white shadow-md' : 'border-transparent bg-slate-200/50 hover:bg-slate-200'}`}
                             >
                                 <div className="font-bold text-red-600">M-Pesa</div>
                                 <div className={`w-3 h-3 rounded-full ${paymentMethod === 'mpesa' ? 'bg-red-500' : 'bg-slate-400'}`}></div>
                             </button>
                             <button 
                                onClick={() => setPaymentMethod('emola')}
                                className={`flex-1 p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all h-24 ${paymentMethod === 'emola' ? 'border-orange-500 bg-white shadow-md' : 'border-transparent bg-slate-200/50 hover:bg-slate-200'}`}
                             >
                                 <div className="font-bold text-orange-600">e-Mola</div>
                                 <div className={`w-3 h-3 rounded-full ${paymentMethod === 'emola' ? 'bg-orange-500' : 'bg-slate-400'}`}></div>
                             </button>
                         </div>

                         {/* Phone Input Grouped */}
                         <label className="block text-sm font-bold text-slate-700 mb-2">
                             Número do {paymentMethod === 'mpesa' ? 'M-Pesa' : 'e-Mola'}
                         </label>
                         <div className="flex gap-0 shadow-sm rounded-xl overflow-hidden border border-slate-300 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all">
                             <div className="bg-slate-100 px-4 py-3 border-r border-slate-300 flex items-center justify-center font-bold text-slate-600">
                                 +258
                             </div>
                             <input 
                                type="tel" 
                                className="flex-1 px-4 py-3 outline-none font-bold text-lg text-slate-800 placeholder-slate-300"
                                placeholder={`${getPhonePrefix()}...`}
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                             />
                             <div className="pr-4 flex items-center">
                                 <Smartphone className="text-slate-400" size={20}/>
                             </div>
                         </div>
                         <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                             <CheckCircle2 size={12} className="text-green-500"/>
                             Você receberá uma notificação no celular para confirmar.
                         </p>

                         {/* Pay Button */}
                         <button 
                            className={`w-full mt-6 py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${paymentMethod === 'mpesa' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-orange-600 hover:bg-orange-700 shadow-orange-200'}`}
                            onClick={() => alert(`Iniciando pagamento de ${calculateTotal()} MT via ${paymentMethod}...`)}
                         >
                            <Lock size={20}/> PAGAR {calculateTotal().toLocaleString()} MT
                         </button>

                         <div className="mt-4 text-center">
                             <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">
                                 <ShieldCheck size={12}/> Pagamento 100% Seguro
                             </div>
                         </div>
                     </div>
                 </div>

             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;