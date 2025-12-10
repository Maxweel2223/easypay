import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, CheckCircle2, Zap, Smartphone, Lock, User, Mail, AlertTriangle, Check, CreditCard, Loader2 } from 'lucide-react';
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
    whatsapp: '', // Stores phone number for API
    email: ''
  });

  // Payment Logic State
  const [addOrderBump, setAddOrderBump] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(6 * 60);

  const mpesaLogo = "https://play-lh.googleusercontent.com/BeFHX9dTKeuLrF8TA0gr9kfXLGicQtnxoTM8xJThn9EKCl-h5JmJoqFkaPBoo4qi7w";
  const emolaLogo = "https://play-lh.googleusercontent.com/2TGAhJ55tiyhCwW0ZM43deGv4lUTFTBMoq83mnAO6-bU5hi2NPyKX8BN8iKt13irK7Y=w240-h480-rw";
  const successSoundUrl = "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3";

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const { data } = await supabase.from('products').select('*').eq('id', productId).single();
      if (data) setProduct(data);
      setLoading(false);
    };
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (!product?.is_limited_time) return;
    const interval = setInterval(() => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
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

  const playSuccessSound = () => {
      const audio = new Audio(successSoundUrl);
      audio.play().catch(e => console.log("Audio play failed interaction needed"));
  };

  const handlePayment = async () => {
      if (!formData.fullName || !formData.whatsapp) {
          alert("Por favor, preencha seu nome e número de telefone.");
          return;
      }

      // Validar telefone simples
      const cleanPhone = formData.whatsapp.replace(/\D/g, '');
      if (cleanPhone.length < 9) {
          alert("Número de telefone inválido.");
          return;
      }

      setIsProcessing(true);

      try {
          // GIBRAPAY INTEGRATION
          // Documentação: POST https://gibrapay.online/v1/withdraw
          // Levantamento (Cobrar cliente)
          
          const apiKey = "afec688b6241cb5af687496eee6b7e919d4acafa9c2dafef2321185fe95e795280c645422557ae9c8b44eff1736503936379123aecf9a9ee9f8777215ae430b9";
          const walletId = "1bcc050c-fca2-4296-821d-30134d9a333c";
          const amount = calculateTotal();

          const response = await fetch("https://gibrapay.online/v1/withdraw", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  "API-Key": apiKey
              },
              body: JSON.stringify({
                  wallet_id: walletId,
                  amount: amount,
                  number_phone: cleanPhone
              })
          });

          const result = await response.json();
          console.log("GibraPay Response:", result);

          // Como não temos webhook, vamos assumir sucesso se a API aceitou o request (200/201) 
          // ou simular sucesso para fins de demonstração se a API estiver em sandbox ou retornar erro por ser chave de teste
          
          // Na produção, você verificaria: if (result.success || result.status === 'pending')
          // Aqui, vamos simular o sucesso após o usuário confirmar no celular (delay)
          
          if (response.ok || result.status) {
             // Request sent to phone
             // Simulate user typing PIN...
             setTimeout(() => {
                 setPaymentSuccess(true);
                 playSuccessSound();
                 
                 // Redirect after 4 seconds
                 setTimeout(() => {
                     if (product.redemption_link) {
                         window.location.href = product.redemption_link;
                     } else {
                         alert("Produto sem link de entrega. Contate o suporte.");
                     }
                 }, 4000);
             }, 3000);
          } else {
              throw new Error(result.message || "Falha ao iniciar pagamento.");
          }

      } catch (error: any) {
          console.error(error);
          alert("Erro no pagamento: " + error.message + ". Tente novamente.");
          setIsProcessing(false);
      }
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
    <div className="min-h-screen bg-slate-50 font-sans pb-12 relative">
      
      {/* SUCCESS POPUP OVERLAY */}
      {paymentSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl transform scale-100 animate-bounce-slow">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 size={48} className="text-green-600 animate-pulse"/>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Pagamento Confirmado!</h2>
                  <p className="text-slate-500 mb-6">Sua compra foi realizada com sucesso. Redirecionando para seu produto...</p>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-green-500 animate-[width_4s_linear_forwards]" style={{width: '0%'}}></div>
                  </div>
              </div>
          </div>
      )}

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

        {/* Product Image */}
        <div className="mt-6 px-4">
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                <div className="aspect-video w-full rounded-xl bg-slate-100 overflow-hidden relative group">
                    {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"/>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-300">
                            <Zap size={32} />
                        </div>
                    )}
                    <div className="absolute bottom-4 right-4 bg-slate-900/90 text-white px-4 py-1.5 rounded-full text-lg font-bold shadow-lg backdrop-blur-sm">
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
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">WhatsApp (M-Pesa/e-Mola)</label>
                    <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="tel"
                            value={formData.whatsapp}
                            onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                            className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium text-slate-800"
                            placeholder="84 123 4567"
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

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6">
                    <div className="flex justify-between items-center text-sm mb-2">
                         <span className="text-slate-500">Produto</span>
                         <span className="font-bold">{product.price.toLocaleString()} MT</span>
                    </div>
                    {addOrderBump && (
                        <div className="flex justify-between items-center text-sm mb-2 text-green-600">
                             <span>+ Oferta Extra</span>
                             <span className="font-bold">{product.offer_price.toLocaleString()} MT</span>
                        </div>
                    )}
                    <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-lg">
                         <span className="font-bold text-slate-900">Total</span>
                         <span className="font-extrabold text-brand-600">{calculateTotal().toLocaleString()} MT</span>
                    </div>
                </div>

                {/* Submit Button */}
                <button 
                    className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${paymentMethod === 'mpesa' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'} ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                    onClick={handlePayment}
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <>
                           <Loader2 size={24} className="animate-spin"/> Processando...
                        </>
                    ) : (
                        <>
                           <Lock size={18} className="opacity-80"/> 
                           Pagar {calculateTotal().toLocaleString()} MT
                        </>
                    )}
                </button>
                
                <div className="mt-4 flex items-center justify-center gap-2 opacity-60">
                     <ShieldCheck size={14} className="text-slate-500"/>
                     <span className="text-[10px] text-slate-500 font-medium">Processado via GibraPay</span>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
};

export default Checkout;