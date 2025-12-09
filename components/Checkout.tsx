import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, CheckCircle2, Zap, Smartphone, Lock, CreditCard } from 'lucide-react';
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
    // Simulate fetching product data (Replace with real DB fetch)
    const fetchProduct = async () => {
      // In a real app, use: const { data } = await supabase.from('products').select('*').eq('id', productId).single();
      // For demo, we mock based on the ID passed or generic data if not found
      setLoading(true);
      setTimeout(() => {
        setProduct({
          id: productId,
          name: 'Guia Definitivo de Investimentos', // Mock data
          description: 'Aprenda a investir do zero e conquiste sua liberdade financeira em Moçambique.',
          price: 2500,
          image_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=1000',
          is_limited_time: true,
          has_offer: true,
          offer_title: 'Planilha de Controle Financeiro',
          offer_price: 500,
          seller_name: 'Paulo Nhantumbo'
        });
        setLoading(false);
      }, 1000);
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
    if (addOrderBump) total += product.offer_price;
    return total;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!product) return <div className="text-center p-10">Produto não encontrado.</div>;

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      {/* Header Mobile */}
      <div className="bg-white p-4 shadow-sm md:hidden text-center font-bold text-slate-700">
        <ShieldCheck className="inline-block mr-2 w-4 h-4 text-green-600"/> Checkout Seguro
      </div>

      <div className="max-w-6xl mx-auto md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-8 shadow-2xl md:rounded-3xl overflow-hidden bg-white">
          
          {/* Left Column: Product Info */}
          <div className="md:col-span-5 bg-slate-900 text-white p-6 md:p-10 flex flex-col relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-brand-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-8 opacity-80">
                 <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <Smartphone size={16} />
                 </div>
                 <span className="font-semibold text-sm">PayEasy Checkout</span>
              </div>

              <img 
                src={product.image_url} 
                alt={product.name} 
                className="w-full aspect-video object-cover rounded-xl shadow-lg border border-slate-700 mb-6"
              />

              <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                {product.description}
              </p>

              <div className="mt-auto border-t border-slate-700 pt-6">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-slate-400">Produto Principal</span>
                   <span className="font-bold">{product.price.toLocaleString()} MT</span>
                </div>
                {addOrderBump && (
                  <div className="flex justify-between items-center mb-2 text-green-400 animate-fadeIn">
                     <span className="text-sm">+ {product.offer_title}</span>
                     <span className="font-bold text-sm">{product.offer_price.toLocaleString()} MT</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xl mt-4 pt-4 border-t border-dashed border-slate-700">
                   <span className="font-bold">Total a Pagar</span>
                   <span className="font-bold text-brand-400">{calculateTotal().toLocaleString()} MT</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Payment Form */}
          <div className="md:col-span-7 bg-white p-6 md:p-10">
            
            {/* Timer Banner */}
            {product.is_limited_time && timeLeft > 0 && (
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center justify-between mb-8 animate-pulse-slow">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                       <Clock size={20}/>
                    </div>
                    <div>
                       <p className="text-xs font-bold text-orange-800 uppercase tracking-wide">Oferta Limitada</p>
                       <p className="text-xs text-orange-600">O preço subirá em breve.</p>
                    </div>
                 </div>
                 <div className="text-2xl font-mono font-bold text-orange-600">
                    {formatTime(timeLeft)}
                 </div>
              </div>
            )}

            <h2 className="text-xl font-bold text-slate-800 mb-6">Dados do Comprador</h2>
            
            <div className="space-y-4 mb-8">
               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo <span className="text-red-500">*</span></label>
                 <input 
                   type="text" 
                   className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                   placeholder="Digite seu nome"
                   value={formData.fullName}
                   onChange={e => setFormData({...formData, fullName: e.target.value})}
                 />
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Celular (M-Pesa/Emola) <span className="text-red-500">*</span></label>
                    <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">+258</span>
                       <input 
                        type="tel" 
                        className="w-full pl-14 p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium"
                        placeholder="84 123 4567"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                       />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Email <span className="text-slate-400 font-normal">(Opcional)</span></label>
                    <input 
                      type="email" 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
               </div>
            </div>

            {/* Order Bump Section */}
            {product.has_offer && (
              <div className={`border-2 rounded-xl p-4 mb-8 cursor-pointer transition-all ${addOrderBump ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-300'}`} onClick={() => setAddOrderBump(!addOrderBump)}>
                 <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded border flex items-center justify-center mt-1 transition-colors ${addOrderBump ? 'bg-brand-600 border-brand-600' : 'bg-white border-slate-300'}`}>
                       {addOrderBump && <CheckCircle2 size={16} className="text-white"/>}
                    </div>
                    <div className="flex-1">
                       <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-900 flex items-center gap-2"><Zap size={16} className="text-yellow-500 fill-yellow-500"/> SIM, eu quero essa oferta!</span>
                          <span className="font-bold text-slate-900">{product.offer_price.toLocaleString()} MT</span>
                       </div>
                       <p className="text-sm text-slate-600">
                          Adicione o <strong>{product.offer_title}</strong> ao seu pedido por um preço especial. Essa oferta não aparecerá novamente.
                       </p>
                    </div>
                 </div>
              </div>
            )}

            {/* Payment Method */}
            <h2 className="text-xl font-bold text-slate-800 mb-4">Pagamento</h2>
            <div className="grid grid-cols-2 gap-4 mb-8">
               <div 
                  onClick={() => setPaymentMethod('mpesa')}
                  className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'mpesa' ? 'border-red-500 bg-red-50' : 'border-slate-100 hover:border-red-200'}`}
               >
                  <img src="https://play-lh.googleusercontent.com/BeFHX9dTKeuLrF8TA0gr9kfXLGicQtnxoTM8xJThn9EKCl-h5JmJoqFkaPBoo4qi7w" className="h-8 object-contain" alt="M-Pesa"/>
                  <span className={`text-xs font-bold ${paymentMethod === 'mpesa' ? 'text-red-700' : 'text-slate-500'}`}>M-Pesa</span>
               </div>
               <div 
                  onClick={() => setPaymentMethod('emola')}
                  className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'emola' ? 'border-orange-500 bg-orange-50' : 'border-slate-100 hover:border-orange-200'}`}
               >
                  <img src="https://play-lh.googleusercontent.com/2TGAhJ55tiyhCwW0ZM43deGv4lUTFTBMoq83mnAO6-bU5hi2NPyKX8BN8iKt13irK7Y=w240-h480-rw" className="h-8 object-contain" alt="Emola"/>
                  <span className={`text-xs font-bold ${paymentMethod === 'emola' ? 'text-orange-700' : 'text-slate-500'}`}>e-Mola</span>
               </div>
            </div>

            <button 
               className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2 transform active:scale-95"
               onClick={() => alert("Iniciando pagamento...")}
            >
               <Lock size={20}/> Pagar {calculateTotal().toLocaleString()} MT Agora
            </button>
            
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
               <ShieldCheck size={14}/> Pagamento 100% Seguro e Criptografado
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;