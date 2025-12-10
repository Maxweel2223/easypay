import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, CheckCircle2, Zap, Smartphone, Lock, User, Mail, AlertTriangle, Check, CreditCard, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface CheckoutProps {
  productId: string;
}

const Checkout: React.FC<CheckoutProps> = ({ productId }) => {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorProduct, setErrorProduct] = useState(false);
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

  // Configuration GibraPay
  const GIBRA_API_KEY = "afec688b6241cb5af687496eee6b7e919d4acafa9c2dafef2321185fe95e795280c645422557ae9c8b44eff1736503936379123aecf9a9ee9f8777215ae430b9";
  const GIBRA_WALLET_ID = "1bcc050c-fca2-4296-821d-30134d9a333c";

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setErrorProduct(false);
      
      // Use maybeSingle to avoid 406 errors on 0 rows
      const { data, error } = await supabase.from('products').select('*').eq('id', productId).maybeSingle();
      
      if (error) {
        console.error("Error fetching product:", error);
        setErrorProduct(true);
      } else if (data) {
        setProduct(data);
      } else {
        setErrorProduct(true);
      }
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
      audio.play().catch(e => console.log("Interação necessária para tocar áudio."));
  };

  const handlePayment = async () => {
      if (!formData.fullName || !formData.whatsapp) {
          alert("Por favor, preencha seu nome e número de telefone.");
          return;
      }

      // Validar telefone (deve ser 84/85/86/87 + 7 digitos = 9 digitos total)
      const cleanPhone = formData.whatsapp.replace(/\D/g, '');
      if (cleanPhone.length < 9) {
          alert("Número de telefone inválido. Use o formato: 841234567");
          return;
      }

      setIsProcessing(true);

      try {
          // Utilizando endpoint de Transferência conforme solicitado explicitamente
          const endpoint = "https://gibrapay.online/v1/transfer";
          
          const payload = {
              wallet_id: GIBRA_WALLET_ID,
              amount: calculateTotal(),
              number_phone: cleanPhone
          };

          console.log("Iniciando transação GibraPay...", payload);

          const response = await fetch(endpoint, {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  "API-Key": GIBRA_API_KEY
              },
              body: JSON.stringify(payload)
          });

          // GibraPay retorna JSON. Precisamos tentar ler, mas se falhar (CORS opaco), tratamos.
          let result;
          try {
             result = await response.json();
             console.log("GibraPay Resposta:", result);
          } catch (e) {
             console.log("Não foi possível ler JSON da resposta (possível erro de CORS ou rede).");
          }

          // Verificação de sucesso
          // A API deve retornar status 200/201. 
          // Se der erro de CORS no browser, vai cair no catch abaixo.
          if (response.ok) {
              // SUCESSO!
              setPaymentSuccess(true);
              playSuccessSound();

              // Redirecionamento após 4 segundos
              setTimeout(() => {
                 if (product.redemption_link) {
                     // Verifica se tem protocolo, senão adiciona https
                     let url = product.redemption_link;
                     if (!url.startsWith('http')) url = 'https://' + url;
                     window.location.href = url;
                 } else {
                     alert("Pagamento confirmado! O vendedor não configurou link de entrega. Entre em contato com o suporte.");
                     setIsProcessing(false);
                 }
              }, 4000);

          } else {
              // Erro da API (ex: saldo insuficiente, dados errados)
              const errorMsg = result?.message || "Erro desconhecido na API de pagamento.";
              throw new Error(errorMsg);
          }

      } catch (error: any) {
          console.error("Erro no pagamento:", error);
          alert(`Falha no pagamento: ${error.message}. Verifique o número e tente novamente.`);
          setIsProcessing(false);
      }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        <p className="text-slate-500 text-sm animate-pulse">Carregando produto...</p>
      </div>
    );
  }

  if (errorProduct || !product) return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="text-center p-10 bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <AlertTriangle size={32} className="text-red-500"/>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Produto não encontrado</h2>
              <p className="text-slate-500 text-sm mb-6">O link pode estar incorreto ou o produto foi removido pelo vendedor.</p>
              <a href="/" className="inline-block px-6 py-3 bg-slate-900 text-white rounded-lg font-bold text-sm">Voltar ao Início</a>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12 relative">
      
      {/* SUCCESS POPUP OVERLAY */}
      {paymentSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md animate-fadeIn p-4">
              <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl transform scale-100 animate-bounce-slow border-4 border-green-100">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <CheckCircle2 size={56} className="text-green-600 animate-pulse"/>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Pagamento Realizado!</h2>
                  <p className="text-slate-500 mb-8 leading-relaxed">Sua compra foi confirmada. Você será redirecionado para seu produto em instantes.</p>
                  
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-green-500 animate-[width_4s_linear_forwards]" style={{width: '0%'}}></div>
                  </div>
              </div>
          </div>
      )}

      {/* Top Bar - Trust */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 h-16 flex justify-between items-center">
             <div className="flex items-center gap-2">
                 <div className="bg-green-100 p-1.5 rounded-full">
                    <Lock size={14} className="text-green-700"/>
                 </div>
                 <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Checkout Seguro</span>
             </div>
             <div className="text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100">
                 ID: {transactionId}
             </div>
          </div>
      </div>

      <div className="max-w-2xl mx-auto">
        
        {/* Header & Title */}
        <div className="pt-8 px-6 text-center">
            <h1 className="text-2xl font-extrabold text-slate-900 leading-tight mb-3">{product.name}</h1>
            <p className="text-slate-500 text-sm leading-relaxed max-w-lg mx-auto">{product.description}</p>
        </div>

        {/* Scarcity Timer (If Active) */}
        {product.is_limited_time && timeLeft > 0 && (
            <div className="mx-4 mt-8 bg-red-50 border border-red-100 rounded-xl p-4 flex items-center justify-between shadow-sm animate-pulse-slow">
                <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-full text-red-600 shadow-sm">
                        <Clock size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-red-700 text-xs uppercase tracking-wide">Oferta por tempo limitado</h3>
                        <p className="text-[10px] text-red-500">O preço pode subir a qualquer momento</p>
                    </div>
                </div>
                <div className="text-2xl font-mono font-bold text-red-600 tabular-nums">
                    {formatTime(timeLeft)}
                </div>
            </div>
        )}

        {/* Product Image */}
        <div className="mt-8 px-4">
            <div className="bg-white p-2 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100">
                <div className="aspect-video w-full rounded-2xl bg-slate-100 overflow-hidden relative group">
                    {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"/>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2">
                            <Zap size={40} />
                            <span className="text-xs font-bold uppercase tracking-widest opacity-50">Sem Imagem</span>
                        </div>
                    )}
                    <div className="absolute bottom-4 right-4 bg-slate-900/90 text-white px-5 py-2 rounded-full text-lg font-bold shadow-xl backdrop-blur-md border border-white/10">
                        {product.price.toLocaleString()} MT
                    </div>
                </div>
            </div>
        </div>

        {/* Checkout Container */}
        <div className="mt-8 px-4 space-y-6 pb-10">
            
            {/* Form Fields */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-4 mb-2">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">1</div>
                    <h3 className="font-bold text-slate-800 text-lg">Seus Dados</h3>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Nome Completo</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={20} />
                            <input 
                                type="text"
                                value={formData.fullName}
                                onChange={e => setFormData({...formData, fullName: e.target.value})}
                                className="w-full pl-12 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium text-slate-800 placeholder-slate-400"
                                placeholder="Como gostaria de ser chamado?"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Email (Opcional)</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={20} />
                            <input 
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                className="w-full pl-12 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium text-slate-800 placeholder-slate-400"
                                placeholder="Para receber o comprovativo"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">WhatsApp (M-Pesa/e-Mola)</label>
                        <div className="relative group">
                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={20} />
                            <input 
                                type="tel"
                                value={formData.whatsapp}
                                onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                                className="w-full pl-12 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium text-slate-800 placeholder-slate-400"
                                placeholder="84 123 4567"
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 ml-1 flex items-center gap-1">
                            <Check size={10} /> O código de pagamento será enviado para este número.
                        </p>
                    </div>
                </div>
            </div>

            {/* Order Bump */}
            {product.has_offer && (
                <div 
                    onClick={() => setAddOrderBump(!addOrderBump)}
                    className={`relative overflow-hidden rounded-2xl border-2 transition-all cursor-pointer transform hover:scale-[1.01] duration-300 ${addOrderBump ? 'border-brand-500 bg-brand-50/30' : 'border-slate-200 bg-white hover:border-brand-200'}`}
                >
                    {addOrderBump && (
                        <div className="absolute top-0 right-0 bg-brand-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm z-10">
                            ADICIONADO
                        </div>
                    )}
                    <div className="p-5 flex items-start gap-4">
                        <div className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${addOrderBump ? 'bg-brand-500 border-brand-500 rotate-0' : 'bg-white border-slate-300 -rotate-12'}`}>
                            {addOrderBump && <Check size={14} className="text-white"/>}
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 text-base leading-tight mb-1">
                                Quero adicionar <span className="text-brand-600 underline decoration-2 decoration-brand-200 underline-offset-2">{product.offer_title}</span>
                            </h4>
                            <p className="text-sm text-slate-500">
                                Oferta única por apenas <span className="font-bold text-slate-900 bg-yellow-100 px-1 rounded">{product.offer_price} MT</span>. Não perca essa chance.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Section */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-4 mb-6">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">2</div>
                    <h3 className="font-bold text-slate-800 text-lg">Pagamento</h3>
                </div>

                {/* Method Selector */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <button 
                        onClick={() => setPaymentMethod('mpesa')}
                        className={`relative p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300 ${paymentMethod === 'mpesa' ? 'border-red-500 bg-red-50/20 shadow-md transform -translate-y-1' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                    >
                        <img src={mpesaLogo} alt="M-Pesa" className="h-10 object-contain drop-shadow-sm" />
                        {paymentMethod === 'mpesa' && <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>}
                        <span className={`text-xs font-bold ${paymentMethod === 'mpesa' ? 'text-red-600' : 'text-slate-400'}`}>M-Pesa</span>
                    </button>
                    <button 
                        onClick={() => setPaymentMethod('emola')}
                        className={`relative p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300 ${paymentMethod === 'emola' ? 'border-orange-500 bg-orange-50/20 shadow-md transform -translate-y-1' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                    >
                        <img src={emolaLogo} alt="e-Mola" className="h-10 object-contain drop-shadow-sm" />
                        {paymentMethod === 'emola' && <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></div>}
                        <span className={`text-xs font-bold ${paymentMethod === 'emola' ? 'text-orange-600' : 'text-slate-400'}`}>e-Mola</span>
                    </button>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mb-8 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                         <span className="text-slate-500 font-medium">Produto Principal</span>
                         <span className="font-bold text-slate-800">{product.price.toLocaleString()} MT</span>
                    </div>
                    {addOrderBump && (
                        <div className="flex justify-between items-center text-sm text-green-700 bg-green-50 p-2 rounded-lg border border-green-100">
                             <span className="font-medium flex items-center gap-1"><Zap size={12}/> Oferta Extra</span>
                             <span className="font-bold">+{product.offer_price.toLocaleString()} MT</span>
                        </div>
                    )}
                    <div className="border-t border-slate-200/60 pt-3 mt-1 flex justify-between items-center">
                         <span className="font-bold text-slate-900 text-lg">Total a Pagar</span>
                         <span className="font-extrabold text-2xl text-slate-900">{calculateTotal().toLocaleString()} <span className="text-sm font-medium text-slate-500">MT</span></span>
                    </div>
                </div>

                {/* Submit Button */}
                <button 
                    className={`w-full py-4 rounded-2xl font-bold text-lg text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 ${paymentMethod === 'mpesa' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'} ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}
                    onClick={handlePayment}
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <>
                           <Loader2 size={24} className="animate-spin"/> Confirmando...
                        </>
                    ) : (
                        <>
                           <Lock size={20} className="opacity-80"/> 
                           Pagar Agora
                        </>
                    )}
                </button>
                
                <div className="mt-6 flex items-center justify-center gap-2 opacity-60">
                     <ShieldCheck size={14} className="text-slate-500"/>
                     <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Processado via GibraPay</span>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
};

export default Checkout;