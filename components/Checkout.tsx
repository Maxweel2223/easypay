import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, CheckCircle2, Zap, Smartphone, Lock, User, Mail, AlertTriangle, Check, Loader2, XCircle, Phone } from 'lucide-react';
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
  
  const [transactionId] = useState(() => Math.random().toString(36).substr(2, 9).toUpperCase());
  
  const [formData, setFormData] = useState({
    fullName: '',
    whatsapp: '',    
    paymentPhone: '',
    email: ''
  });

  const [addOrderBump, setAddOrderBump] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(6 * 60);

  const GIBRA_API_KEY = "afec688b6241cb5af687496eee6b7e919d4acafa9c2dafef2321185fe95e795280c645422557ae9c8b44eff1736503936379123aecf9a9ee9f8777215ae430b9";
  const GIBRA_WALLET_ID = "1bcc050c-fca2-4296-821d-30134d9a333c";
  const RESEND_API_KEY = "re_PCb2nphE_JQqrsWFyph7eq1DHPToF3Ptm";

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setErrorProduct(false);
      try {
          const { data, error } = await supabase.from('products').select('*').eq('id', productId).maybeSingle();
          if (error || !data) {
             setErrorProduct(true);
          } else {
            setProduct(data);
            try {
                 await supabase.from('products').update({ views_count: (data.views_count || 0) + 1 }).eq('id', data.id);
            } catch (e) { }
          }
      } catch (err) {
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

  const sendPurchaseNotifications = async (clientName: string, clientWhatsApp: string, productName: string, amount: number, accessLink: string) => {
      const SMS_USER = "colddimas1@gmail.com";
      const SMS_PASS = "f87766ab5b8ff18287a2b66747193ac9fd53ad3f";
      const ADMIN_NUM = "857789345";
      const msgClient = `PayEasy: Ola ${clientName}, pagamento confirmado! Ref: ${transactionId}. Acesse seu produto aqui: ${accessLink}`;
      const msgAdmin = `Venda PayEasy! Ref: ${transactionId}. ${clientName} pagou ${amount}MT via GibraPay.`;

      const sendSMS = async (to: string, msg: string) => {
          let cleanTo = to.replace(/\D/g, '');
          if (cleanTo.startsWith('8')) cleanTo = '258' + cleanTo;
          const url = `https://app.yezosms.com/api?username=${SMS_USER}&password=${SMS_PASS}&message=${encodeURIComponent(msg)}&to=${cleanTo}&from=INFOMSG&messageid=${Date.now()}`;
          try { await fetch(url, { mode: 'no-cors' }); } catch (e) { }
      };

      await Promise.all([sendSMS(clientWhatsApp, msgClient), sendSMS(ADMIN_NUM, msgAdmin)]);

      const sendEmailViaResend = async () => {
        try {
            const resend = new Resend(RESEND_API_KEY);
            const emailHtml = `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0891b2;">Pagamento Confirmado!</h2>
                <p>Olá <strong>${clientName}</strong>,</p>
                <p>Sua compra de <strong>${productName}</strong> foi aprovada.</p>
                <div style="background: #f0fdfa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>ID:</strong> ${transactionId}</p>
                  <p style="margin: 5px 0;"><strong>Valor:</strong> ${amount.toLocaleString()} MT</p>
                </div>
                <a href="${accessLink}" style="display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acessar Agora</a>
              </div>
            `;
            const recipients = ['developermax2maker@gmail.com'];
            if (formData.email) recipients.push(formData.email);
            await resend.emails.send({
                from: 'onboarding@resend.dev',
                to: recipients,
                subject: `Venda Aprovada! - ${productName}`,
                html: emailHtml
            });
        } catch (error) { }
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

      if (paymentMethod === 'mpesa' && !cleanPaymentPhone.startsWith('84') && !cleanPaymentPhone.startsWith('85')) {
          setPaymentError("Para M-Pesa, o número deve começar com 84 ou 85.");
          return;
      } else if (paymentMethod === 'emola' && !cleanPaymentPhone.startsWith('86') && !cleanPaymentPhone.startsWith('87')) {
          setPaymentError("Para e-Mola, o número deve começar com 86 ou 87.");
          return;
      }

      setIsProcessing(true);
      const totalAmount = calculateTotal();
      let pendingSaleId = null;

      try {
          const { data: saleData } = await supabase.from('sales').insert({
              user_id: product.user_id,
              product_id: product.id,
              product_name: product.name,
              amount: totalAmount,
              status: 'pending', 
              payment_method: paymentMethod,
              customer_name: formData.fullName,
              customer_phone: cleanWhatsApp,
              customer_email: formData.email
          }).select().single();
          if (saleData) pendingSaleId = saleData.id;
      } catch (err) {}

      try {
          const endpoint = "https://gibrapay.online/v1/transfer";
          const payload = {
              wallet_id: GIBRA_WALLET_ID,
              amount: totalAmount,
              number_phone: cleanPaymentPhone
          };

          const response = await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json", "API-Key": GIBRA_API_KEY },
              body: JSON.stringify(payload)
          });

          let result;
          try { result = await response.json(); } catch (e) { throw new Error("Erro de conexão."); }

          if (result.status === 'error' || result.callback?.transaction_status === 'Declined' || result.data?.status === 'failed') {
              if (pendingSaleId) await supabase.from('sales').update({ status: 'cancelled' }).eq('id', pendingSaleId);
              throw new Error(result.message || "Pagamento falhou.");
          }

          if (result.status === 'Pending') throw new Error("Pagamento pendente. Aguarde a confirmação.");

          if (pendingSaleId) await supabase.from('sales').update({ status: 'approved' }).eq('id', pendingSaleId);
          
          setPaymentSuccess(true);
          playSuccessSound();
          await sendPurchaseNotifications(formData.fullName, cleanWhatsApp, product.name, totalAmount, product.redemption_link || window.location.href);

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
          setPaymentError(error.message || "Erro desconhecido.");
          setIsProcessing(false);
      }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>;

  if (errorProduct || !product) return <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4"><div className="text-center p-8 bg-white rounded-lg shadow border border-slate-100"><AlertTriangle size={32} className="mx-auto text-red-500 mb-4"/><h2 className="text-lg font-bold">Produto não encontrado</h2></div></div>;

  const isMpesa = paymentMethod === 'mpesa';

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12 relative">
      {paymentSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4">
              <div className="bg-white rounded-xl p-8 max-w-sm w-full text-center shadow-2xl">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 size={48} className="text-green-600"/>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Sucesso!</h2>
                  <p className="text-slate-500 mb-6 text-sm">Pagamento confirmado. Redirecionando...</p>
              </div>
          </div>
      )}

      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="max-w-2xl mx-auto px-4 h-14 flex justify-between items-center">
             <div className="flex items-center gap-2">
                 <Lock size={14} className="text-green-600"/>
                 <span className="text-xs font-bold text-slate-700 uppercase">Checkout Seguro</span>
             </div>
          </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="pt-8 px-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{product.name}</h1>
            <p className="text-slate-500 text-sm max-w-md mx-auto">{product.description}</p>
        </div>

        {product.is_limited_time && timeLeft > 0 && (
            <div className="mx-4 mt-6 bg-red-50 border border-red-100 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-700 font-medium text-sm">
                    <Clock size={16} /> Oferta por tempo limitado
                </div>
                <div className="text-lg font-mono font-bold text-red-600">{formatTime(timeLeft)}</div>
            </div>
        )}

        <div className="mt-6 px-4">
            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                <div className="aspect-video w-full rounded-lg bg-slate-100 overflow-hidden relative">
                    {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover"/>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2"><Zap size={32} /></div>
                    )}
                    <div className="absolute bottom-3 right-3 bg-slate-900 text-white px-3 py-1 rounded text-sm font-bold shadow">
                        {product.price.toLocaleString()} MT
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-6 px-4 space-y-4 pb-10">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 space-y-4">
                <h3 className="font-bold text-slate-800 text-sm uppercase mb-2 border-b pb-2">Seus Dados</h3>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                    <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Nome completo" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email <span className="font-normal lowercase">(Opcional)</span></label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Para comprovativo" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">WhatsApp</label>
                    <input type="tel" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-brand-500 outline-none" placeholder="84 123 4567" />
                </div>
            </div>

            {product.has_offer && (
                <div onClick={() => setAddOrderBump(!addOrderBump)} className={`rounded-lg border-2 p-4 cursor-pointer transition-colors ${addOrderBump ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white'}`}>
                    <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center ${addOrderBump ? 'bg-brand-500 border-brand-500' : 'bg-white border-slate-300'}`}>
                            {addOrderBump && <Check size={12} className="text-white"/>}
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm">Adicionar: {product.offer_title}</h4>
                            <p className="text-xs text-slate-500">Por apenas +{product.offer_price} MT.</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 text-sm uppercase mb-4 border-b pb-2">Pagamento</h3>
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button onClick={() => setPaymentMethod('mpesa')} className={`p-3 rounded border flex flex-col items-center gap-2 ${paymentMethod === 'mpesa' ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}>
                        <img src={mpesaLogo} alt="M-Pesa" className="h-6 object-contain" />
                        <span className={`text-xs font-bold ${paymentMethod === 'mpesa' ? 'text-red-600' : 'text-slate-500'}`}>M-Pesa</span>
                    </button>
                    <button onClick={() => setPaymentMethod('emola')} className={`p-3 rounded border flex flex-col items-center gap-2 ${paymentMethod === 'emola' ? 'border-orange-500 bg-orange-50' : 'border-slate-200'}`}>
                        <img src={emolaLogo} alt="e-Mola" className="h-6 object-contain" />
                        <span className={`text-xs font-bold ${paymentMethod === 'emola' ? 'text-orange-600' : 'text-slate-500'}`}>e-Mola</span>
                    </button>
                </div>

                <div className="mb-6">
                     <label className="block text-xs font-bold uppercase mb-1">
                           {isMpesa ? "Número M-Pesa" : "Número e-Mola"}
                     </label>
                     <input type="tel" value={formData.paymentPhone} onChange={e => setFormData({...formData, paymentPhone: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-300 rounded focus:ring-2 outline-none font-medium" placeholder={isMpesa ? "84 123 4567" : "86 123 4567"} />
                </div>

                <div className="bg-slate-50 rounded p-4 border border-slate-100 mb-6 space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Produto</span><span className="font-bold">{product.price.toLocaleString()} MT</span></div>
                    {addOrderBump && <div className="flex justify-between text-sm text-green-600"><span className="font-medium">+ {product.offer_title}</span><span className="font-bold">{product.offer_price.toLocaleString()} MT</span></div>}
                    <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between items-center"><span className="font-bold text-slate-900">Total</span><span className="font-bold text-xl text-slate-900">{calculateTotal().toLocaleString()} MT</span></div>
                </div>

                {paymentError && <div className="mb-4 bg-red-50 border border-red-200 rounded p-3 flex items-center gap-2 text-xs text-red-600"><XCircle size={16}/> {paymentError}</div>}

                <button className={`w-full py-3 rounded-lg font-bold text-white shadow hover:shadow-lg transition-all flex items-center justify-center gap-2 ${paymentMethod === 'mpesa' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'} ${isProcessing ? 'opacity-70' : ''}`} onClick={handlePayment} disabled={isProcessing}>
                    {isProcessing ? <Loader2 size={20} className="animate-spin"/> : <Lock size={18} />}
                    {isProcessing ? 'Processando...' : 'Pagar Agora'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;