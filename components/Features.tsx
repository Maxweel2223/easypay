import React from 'react';
import { ShoppingBag, CreditCard, TrendingUp, ShieldCheck, Zap, Layers } from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: <ShoppingBag className="w-6 h-6 text-white" />,
      title: "Produtos Ilimitados",
      description: "Hospede e venda ebooks, cursos, mentorias, templates e assinaturas sem limites de armazenamento.",
      color: "bg-blue-500"
    },
    {
      icon: <CreditCard className="w-6 h-6 text-white" />,
      title: "Checkout Profissional",
      description: "Páginas de pagamento otimizadas para conversão que funcionam perfeitamente no celular.",
      color: "bg-cyan-500"
    },
    {
      icon: <Layers className="w-6 h-6 text-white" />,
      title: "Upsell & Order Bump",
      description: "Aumente seu ticket médio oferecendo produtos complementares com apenas um clique na hora da compra.",
      color: "bg-purple-500"
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-white" />,
      title: "Painel de Métricas",
      description: "Acompanhe suas vendas em tempo real, taxas de conversão e faturamento com relatórios detalhados.",
      color: "bg-indigo-500"
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-white" />,
      title: "Área de Membros",
      description: "Entregue seu conteúdo de forma segura e profissional com nossa área de membros integrada.",
      color: "bg-emerald-500"
    },
    {
      icon: <Zap className="w-6 h-6 text-white" />,
      title: "Saque Rápido",
      description: "Não espere 30 dias. Receba o dinheiro das suas vendas diretamente na sua conta móvel ou bancária.",
      color: "bg-orange-500"
    }
  ];

  return (
    <section id="funcionalidades" className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Tudo o que você precisa para <span className="text-brand-600">escalar suas vendas</span>
          </h2>
          <p className="text-lg text-slate-600">
            A PayEasy combina simplicidade com ferramentas poderosas de marketing para maximizar seus resultados.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-50 transition-all duration-300">
              <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;