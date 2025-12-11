import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, CheckCircle2, Zap, Smartphone, Lock, User, Mail, AlertTriangle, Check, CreditCard, Loader2, XCircle, Phone } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Resend } from 'resend';

const mpesaLogo = "https://play-lh.googleusercontent.com/BeFHX9dTKeuLrF8TA0gr9kfXLGicQtnxoTM8xJThn9EKCl-h5JmJoqFkaPBoo4qi7w";
const emolaLogo = "https://play-lh.googleusercontent.com/2TGAhJ55tiyhCwW0ZM43deGv4lUTFTBMoq83mnAO6-bU5hi2NPyKX8BN8iKt13irK7Y=w240-h480-rw";

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
    whatsapp: '',      // Para contato/entrega
    paymentPhone: '',  // Para o pagamento M-Pesa/Emola
    email: ''
  });

  // Payment Logic State
  const [addOrderBump, setAddOrderBump] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(6 * 60);

  // Configuration GibraPay
  const GIBRA_API_KEY = "afec688b6241cb5af687496eee6b7e919d4acafa9c2dafef2321185fe95e795280c645422557ae9c8b44eff1736503936379123aecf9a9ee9f8777215ae430b9";
  const GIBRA_WALLET_ID = "1bcc050c-fca2-4296-821d-30134d9a333c";

  // Configuration Resend
  const RESEND_API_KEY = "re_PCb2nphE_JQqrsWFyph7eq1DHPToF3Ptm";

  // 1. Fetch Product and Increment Click Counter
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setErrorProduct(false);
      
      try {
          const { data, error } = await supabase.from('products').select('*').eq('id', productId).maybeSingle();
          
          if (error) {
            console.error("Error fetching product:", error);
            setErrorProduct(true);
          } else if (!data) {
             console.warn("Product not found or RLS restricted.");
             setErrorProduct(true);
          } else {
            setProduct(data);
            // Increment view count securely if possible, otherwise ignore
            try {
                 await supabase.from('products').update({ views_count: (data.views_count || 0) + 1 }).eq('id', data.id);
            } catch (e) { /* Ignore view count update errors */ }
          }
      } catch (err) {
          console.error("Unexpected error:", err);
          setErrorProduct(true);
      } finally {
          setLoading(false);
      }
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

  const playSuccessSound = () => {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3");
      audio.play().catch(e => console.log("Audio requires interaction"));
  };

  // --- NOTIFICATION SYSTEM ---
  const sendPurchaseNotifications = async (clientName: string, clientWhatsApp: string, productName: string, amount: number, accessLink: string) => {
      // 1. Enviar SMS (Yezosms)
      const SMS_USER = "colddimas1@gmail.com";
      const SMS_PASS = "f87766ab5b8ff18287a2b66747193ac9fd53ad3f";
      const ADMIN_NUM = "857789345";

      // Mensagem para o Cliente
      const msgClient = `PayEasy: Ola ${clientName}, pagamento confirmado! Ref: ${transactionId}. Acesse seu produto aqui: ${accessLink}`;
      // Mensagem para o Admin
      const msgAdmin = `Venda PayEasy! Ref: ${transactionId}. ${clientName} pagou ${amount}MT via GibraPay.`;

      const sendSMS = async (to: string, msg: string) => {
          let cleanTo = to.replace(/\D/g, '');
          if (cleanTo.startsWith('8')) cleanTo = '258' + cleanTo;
          
          const url = `https://app.yezosms.com/api?username=${SMS_USER}&password=${SMS_PASS}&message=${encodeURIComponent(msg)}&to=${cleanTo}&from=INFOMSG&messageid=${Date.now()}`;
          try { 
             await fetch(url, { mode: 'no-cors' }); 
          } catch (e) { 
             console.error("Erro ao enviar SMS", e); 
          }
      };

      await Promise.all([
          sendSMS(clientWhatsApp, msgClient),
          sendSMS(ADMIN_NUM, msgAdmin)
      ]);

      // 2. Enviar Email (Resend)
      const sendEmailViaResend = async () => {
        try {
            const resend = new Resend(RESEND_API_KEY);

            // HTML do Email
            const emailHtml = `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0891b2;">Pagamento Confirmado!</h2>
                <p>Olá <strong>${clientName}</strong>,</p>
                <p>Sua compra de <strong>${productName}</strong> foi aprovada com sucesso.</p>
                <div style="background: #f0fdfa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>ID da Transação:</strong> ${transactionId}</p>
                  <p style="margin: 5px 0;"><strong>Valor Pago:</strong> ${amount.toLocaleString()} MT</p>
                </div>
                <p>Você pode acessar seu produto clicando no botão abaixo:</p>
                <a href="${accessLink}" style="display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acessar Agora</a>
                <p style="font-size: 12px; color: #666; margin-top: 30px;">Se o botão não funcionar, copie este link: ${accessLink}</p>
              </div>
            `;

            // Lista de destinatários
            const recipients = ['developermax2maker@gmail.com'];
            if (formData.email) recipients.push(formData.email);

            await resend.emails.send({
                from: 'onboarding@resend.dev',
                to: recipients,
                subject: `Venda Aprovada! - ${productName} (Ref: ${transactionId})`,
                html: emailHtml
            });
            
            console.log("Email Resend enviado com sucesso.");
        } catch (error) {
            console.error("Erro ao enviar email Resend:", error);
        }
      };

      sendEmailViaResend();
  };

  const handlePayment = async () => {
      setPaymentError(null);

      if (!formData.fullName || !formData.whatsapp || !formData.paymentPhone) {
          alert("Por favor, preencha seu nome, WhatsApp e número de pagamento.");
          return;
      }

      const cleanPaymentPhone = formData.paymentPhone.replace(/\D/g, '');
      const cleanWhatsApp = formData.whatsapp.replace(/\D/g, '');
      
      if (cleanPaymentPhone.length < 9) {
          alert("Número de pagamento inválido.");
          return;
      }

      if (paymentMethod === 'mpesa') {
          if (!cleanPaymentPhone.startsWith('84') && !cleanPaymentPhone.startsWith('85')) {
              setPaymentError("Para M-Pesa, o número deve começar com 84 ou 85.");
              return;
          }
      } else if (paymentMethod === 'emola') {
          if (!cleanPaymentPhone.startsWith('86') && !cleanPaymentPhone.startsWith('87')) {
              setPaymentError("Para e-Mola, o número deve começar com 86 ou 87.");
              return;
          }
      }

      setIsProcessing(true);
      const totalAmount = calculateTotal();

      // 1. REGISTRAR VENDA PENDENTE
      let pendingSaleId = null;
      try {
          const { data: saleData, error: saleError } = await supabase.from('sales').insert({
              user_id: product.user_id, // Atribui a venda ao dono do produto
              product_id: product.id,
              product_name: product.name,
              amount: totalAmount,
              status: 'pending', 
              payment_method: paymentMethod,
              customer_name: formData.fullName,
              customer_phone: cleanWhatsApp,
              customer_email: formData.email
          }).select().single();

          if (saleError) {
              console.error("Erro ao registrar venda pendente:", saleError);
          } else {
              pendingSaleId = saleData.id;
          }
      } catch (err) {
          console.error("Erro DB", err);
      }

      try {
          // 2. Processar Pagamento na GibraPay
          const endpoint = "https://gibrapay.online/v1/transfer";
          const payload = {
              wallet_id: GIBRA_WALLET_ID,
              amount: totalAmount,
              number_phone: cleanPaymentPhone
          };

          const response = await fetch(endpoint, {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  "API-Key": GIBRA_API_KEY
              },
              body: JSON.stringify(payload)
          });

          let result;
          try {
             result = await response.json();
          } catch (e) {
             throw new Error("Erro de comunicação com o servidor de pagamento.");
          }

          const isStatusError = result.status === 'error';
          const isTransactionDeclined = result.callback?.transaction_status === 'Declined';
          const isStatusPending = result.status === 'Pending';
          const isDataFailed = result.data?.status === 'failed';

          if (isStatusError || isTransactionDeclined || isDataFailed) {
              if (pendingSaleId) {
                  await supabase.from('sales').update({ status: 'cancelled' }).eq('id', pendingSaleId);
              }
              const msg = result.message || "Pagamento recusado ou falhou.";
              throw new Error(msg);
          }

          if (!response.ok) {
              throw new Error("Erro na requisição de pagamento (HTTP Error).");
          }

          if (isStatusPending) {
               throw new Error("Pagamento pendente. Por favor, aguarde a confirmação no seu celular e tente novamente.");
          }

          // 3. SUCESSO - Atualizar venda para APROVADA
          // IMPORTANTE: Não tentamos atualizar a tabela 'products' aqui para evitar erros de permissão (RLS).
          // O Dashboard calculará o total dinamicamente lendo a tabela 'sales'.
          if (pendingSaleId) {
              const { error: updateError } = await supabase.from('sales').update({ status: 'approved' }).eq('id', pendingSaleId);
              if (updateError) console.error("Erro ao aprovar venda no DB:", updateError);
          }

          setPaymentSuccess(true);
          playSuccessSound();

          await sendPurchaseNotifications(
              formData.fullName,
              cleanWhatsApp,
              product.name,
              totalAmount,
              product.redemption_link || window.location.href
          );

          setTimeout(() => {
             if (product.redemption_link) {
                 let url = product.redemption_link;
                 if (!url.startsWith('http')) url = 'https://' + url;
                 window.location.href = url;
             } else {
                 setIsProcessing(false);
             }
          }, 5000);

      } catch (error: any) {
          console.error("Payment Error:", error);
          setPaymentError(error.message || "Erro desconhecido.");
          setIsProcessing(false);
      }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        <p className="text-slate-500 text-sm animate-pulse">Carregando produto seguro...</p>
      </div>
    );
  }

  if (errorProduct || !product) return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="text-center p-10 bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <AlertTriangle size={32} className="text-red-500"/>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Produto não disponível</h2>
              <p className="text-slate-500 text-sm mb-6">Este produto foi removido ou o link expirou.</p>
          </div>
      </div>
  );

  const isMpesa = paymentMethod === 'mpesa';

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12 relative">
      
      {/* SUCCESS POPUP */}
      {paymentSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md animate-fadeIn p-4">
              <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl transform scale-100 animate-bounce-slow border-4 border-green-100 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <CheckCircle2 size={56} className="text-green-600 animate-pulse"/>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Pagamento Confirmado!</h2>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 inline-block">
                     <p className="text-xs text-slate-400 uppercase tracking-wide">ID da Transação</p>
                     <p className="text-sm font-mono font-bold text-slate-700 select-all">{transactionId}</p>
                  </div>
                  <p className="text-slate-500 mb-8 leading-relaxed text-sm">
                      Enviamos os dados de acesso para seu <strong>WhatsApp e Email</strong>. Você será redirecionado em instantes...
                  </p>
                  
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-green-500 animate-[width_5s_linear_forwards]" style={{width: '0%'}}></div>
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
                 REF: {transactionId}
             </div>
          </div>
      </div>

      <div className="max-w-2xl mx-auto">
        
        {/* Header & Title */}
        <div className="pt-8 px-6 text-center">
            <h1 className="text-3xl font-extrabold text-slate-900 leading-tight mb-3 tracking-tight">{product.name}</h1>
            <p className="text-slate-500 text-sm leading-relaxed max-w-lg mx-auto">{product.description}</p>
        </div>

        {/* Scarcity Timer */}
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
                                placeholder="Nome completo"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Email <span className="text-slate-300 font-normal lowercase">(Opcional)</span></label>
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
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">WhatsApp para Entrega</label>
                        <div className="relative group">
                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-500 transition-colors" size={20} />
                            <input 
                                type="tel"
                                value={formData.whatsapp}
                                onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                                className="w-full pl-12 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-medium text-slate-800 placeholder-slate-400"
                                placeholder="84 123 4567"
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 ml-1 flex items-center gap-1">
                            <Check size={10} /> Enviaremos o link de acesso para este número.
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
                                Adicionar: <span className="text-brand-600">{product.offer_title}</span>
                            </h4>
                            <p className="text-sm text-slate-500">
                                Oferta única por apenas <span className="font-bold text-slate-900 bg-yellow-100 px-1 rounded">{product.offer_price} MT</span>.
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

                {/* Specific Payment Number Input */}
                <div className="mb-8">
                     <label className={`block text-xs font-bold uppercase mb-1.5 ml-1 transition-colors ${isMpesa ? 'text-red-500' : 'text-orange-500'}`}>
                           {isMpesa ? "Número M-Pesa (Pagamento)" : "Número e-Mola (Pagamento)"}
                     </label>
                     <div className="relative group">
                         <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isMpesa ? 'text-red-400' : 'text-orange-400'}`} size={20} />
                         <input 
                             type="tel"
                             value={formData.paymentPhone}
                             onChange={e => setFormData({...formData, paymentPhone: e.target.value})}
                             className={`w-full pl-12 p-4 bg-slate-50 border rounded-xl focus:ring-2 outline-none transition-all font-medium text-slate-800 placeholder-slate-400 ${isMpesa ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-orange-500 focus:border-orange-500'}`}
                             placeholder={isMpesa ? "84 123 4567" : "86 123 4567"}
                         />
                     </div>
                     <p className="text-[10px] text-slate-400 mt-2 ml-1">
                        A notificação de pagamento chegará neste número.
                     </p>
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

                {/* Error Message Area */}
                {paymentError && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-slideDown">
                        <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-red-700 text-sm">Falha no Pagamento</h4>
                            <p className="text-xs text-red-600 mt-1">{paymentError}</p>
                        </div>
                    </div>
                )}

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