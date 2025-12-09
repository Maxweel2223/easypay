import React from 'react';
import { Upload, Link, Banknote } from 'lucide-react';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: <Upload size={32} className="text-brand-600" />,
      title: "1. Cadastre seu Produto",
      text: "Faça upload do seu ebook, vídeo-aula ou serviço em poucos cliques. Nossa plataforma organiza tudo automaticamente."
    },
    {
      icon: <Link size={32} className="text-brand-600" />,
      title: "2. Compartilhe o Link",
      text: "Receba um link de checkout profissional. Divulgue no WhatsApp, Instagram, Facebook ou no seu site."
    },
    {
      icon: <Banknote size={32} className="text-brand-600" />,
      title: "3. Receba em Meticais",
      text: "O cliente paga via M-Pesa/Emola, você recebe a notificação na hora e saca para sua conta quando quiser."
    }
  ];

  return (
    <section id="como-funciona" className="py-24 bg-brand-50/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Como funciona a PayEasy?</h2>
          <p className="mt-4 text-slate-600">Simples, rápido e sem burocracia.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-200 -z-10 border-t-2 border-dashed border-slate-300"></div>

          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-xl flex items-center justify-center mb-6 relative z-10">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-slate-600 max-w-xs">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;