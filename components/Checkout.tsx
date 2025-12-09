import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, CheckCircle2, Zap, Smartphone, Lock, User, Mail, AlertTriangle, Check, CreditCard } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface CheckoutProps {
  productId: string;
}

const Checkout: React.FC<CheckoutProps> = ({ productId }) => {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'emola'>('mpesa');
  
  // Transaction ID (Stable per session)
  const [transactionId] = useState(() => Math.random().toString(36).substr(2, 9).toUpperCase());
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    whatsapp: '',
    email: ''
  });

  // Order Bump State
  const [addOrderBump, setAddOrderBump] = useState(false);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(6 * 60); // 6 minutes in seconds

  const mpesaLogo = "https://play-lh.googleusercontent.com/BeFHX9dTKeuLrF8TA0gr9kfXLGicQtnxoTM8xJThn9EKCl-h5JmJoqFkaPBoo4qi7w";
  const emolaLogo = "https://play-lh.googleusercontent.com/2TGAhJ55tiyhCwW0ZM43deGv4lUTFTBMoq83mnAO6-bU5hi2NPyKX8BN8iKt13irK7Y=w240-h480-rw";

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
        
      if (data) {
          setProduct(data);
      } else {
          console.error("Product not found via API.");
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!product) return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center p-10 bg-white rounded-xl shadow-lg border border-slate-100">
              <AlertTriangle size={40} className="mx-auto text-slate-400 mb-4"/>
              <h2 className="text-xl font-bold text-slate-900">Produto não encontrado</h2>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      
      {/* Top Bar - Trust */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 h-14 flex justify-between items-center">
             <div className="flex items-center gap-2">
                 <Lock size={14} className="text-green-600"/>
                 <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Pagamento Seguro</span>
             </div>
             <div className="text-[10px] text-slate-400 font-mono">
                 REF: {transactionId}
             </div>
          </div>
      </div>

      <div className="max-w-2xl mx-auto">
        
        {/* Header & Title */}
        <div className="pt-6 px-6 text-center">
            <h1 className="text-2xl font-extrabold text-slate-900 leading-tight mb-2">{product.name}</h1>
            <p className="text-slate-500 text-sm">{product.description}</p>
        </div>

        {/* Scarcity Timer (If Active) */}
        {product.is_limited_time && timeLeft > 0 && (
            <div className="mx-4 mt-6 bg-red-50 border border-red-100 rounded-xl p-3 flex items-center justify-between shadow-sm animate-pulse-slow">
                <div className="flex items-center gap-3">
                    <div className="bg-white p-1.5 rounded-full text-red-600 shadow-sm">
                        <Clock size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-red-700 text-xs uppercase">Oferta Expira em:</h3>
                    </div>
                </div>
                <div className="text-xl font-mono font-bold text-red-600">
                    {formatTime(timeLeft)}
                </div>
            </div>
        )}

        {/* Product Image - Centered and clean */}
        <div className="mt-6 px-4">
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                <div className="aspect-video w-full rounded-xl bg-slate-100 overflow-hidden relative">
                    {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover"/>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-300">
                            <Zap size={32} />
                        </div>
                    )}
                    <div className="absolute bottom-4 right-4 bg-slate-900/90 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm">
                        {product.price.toLocaleString()} MT
                    </div>
                </div>
            </div>
        </div>

        {/* Checkout Container */}
        <div className="mt-6 px-4 space-y-6">
            
            {/* Form Fields */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
                <h3 className="font-bold text-slate-800 text-lg border-b border-slate-50 pb-2 mb-2">Seus Dados</h3>
                
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Nome Completo</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text"
                            value={formData.fullName}
                            onChange={e => setFormData({...formData, fullName: e.target.value})}
                            className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium text-slate-800"
                            placeholder="Digite seu nome"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Email (Opcional)</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium text-slate-800"
                            placeholder="seu@email.com"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">WhatsApp</label>
                    <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="tel"
                            value={formData.whatsapp}
                            onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                            className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium text-slate-800"
                            placeholder="Seu número de contato"
                        />
                    </div>
                </div>
            </div>

            {/* Order Bump */}
            {product.has_offer && (
                <div 
                    onClick={() => setAddOrderBump(!addOrderBump)}
                    className={`relative overflow-hidden rounded-2xl border-2 transition-all cursor-pointer ${addOrderBump ? 'border-brand-500 bg-brand-50/50' : 'border-slate-200 bg-white'}`}
                >
                    {addOrderBump && <div className="absolute top-0 right-0 bg-brand-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">ADICIONADO</div>}
                    <div className="p-4 flex items-start gap-3">
                        <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${addOrderBump ? 'bg-brand-500 border-brand-500' : 'bg-white border-slate-300'}`}>
                            {addOrderBump && <Check size={14} className="text-white"/>}
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm leading-tight">
                                Quero adicionar <span className="text-brand-600">{product.offer_title}</span>
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">Por apenas <span className="font-bold text-slate-900">{product.offer_price} MT</span>.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 text-lg border-b border-slate-50 pb-2 mb-4">Pagamento</h3>

                {/* Method Selector */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button 
                        onClick={() => setPaymentMethod('mpesa')}
                        className={`relative p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'mpesa' ? 'border-red-500 bg-red-50/30' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                        <img src={mpesaLogo} alt="M-Pesa" className="h-8 object-contain" />
                        {paymentMethod === 'mpesa' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500"></div>}
                    </button>
                    <button 
                        onClick={() => setPaymentMethod('emola')}
                        className={`relative p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'emola' ? 'border-orange-500 bg-orange-50/30' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                        <img src={emolaLogo} alt="e-Mola" className="h-8 object-contain" />
                        {paymentMethod === 'emola' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-500"></div>}
                    </button>
                </div>

                {/* Phone for Payment */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                     <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                         Número {paymentMethod === 'mpesa' ? 'M-Pesa' : 'e-Mola'}
                     </label>
                     <div className="flex items-center gap-3">
                         <span className="font-bold text-slate-400">+258</span>
                         <input 
                            type="tel"
                            className="bg-transparent outline-none font-bold text-lg text-slate-900 w-full placeholder-slate-300"
                            placeholder={getPhonePrefix() + "..."}
                         />
                     </div>
                </div>

                {/* Submit Button */}
                <button 
                    className={`w-full mt-6 py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${paymentMethod === 'mpesa' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'}`}
                    onClick={() => alert(`Processando pagamento de ${calculateTotal()} MT...`)}
                >
                    <Lock size={18} className="opacity-80"/> 
                    Pagar {calculateTotal().toLocaleString()} MT
                </button>
                
                <div className="mt-4 flex items-center justify-center gap-2 opacity-60">
                     <ShieldCheck size={14} className="text-slate-500"/>
                     <span className="text-[10px] text-slate-500 font-medium">Ambiente Criptografado 256-bit</span>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
};

export default Checkout;