import React from 'react';
import { Star } from 'lucide-react';

const Testimonials: React.FC = () => {
  const testimonials = [
    {
      name: "Marta Xavier",
      role: "Empreendedora Digital",
      image: "https://picsum.photos/100/100?random=1",
      quote: "Antes eu usava transferência bancária e perdia muitas vendas. Com a PayEasy, a automação do M-Pesa aumentou minha conversão em 40%."
    },
    {
      name: "Paulo Nhantumbo",
      role: "Criador de Cursos",
      image: "https://picsum.photos/100/100?random=2",
      quote: "A funcionalidade de Order Bump é incrível. Consegui vender meu ebook básico e adicionar uma mentoria no checkout. Genial!"
    },
    {
      name: "Sonia Macamo",
      role: "Designer Gráfico",
      image: "https://picsum.photos/100/100?random=3",
      quote: "Interface limpa, rápida e o suporte é local. Sinto confiança em deixar meu negócio rodando na PayEasy."
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Quem usa, recomenda</h2>
          <p className="mt-4 text-slate-600">Junte-se a centenas de criadores moçambicanos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-lg hover:shadow-xl transition-shadow flex flex-col">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-700 italic mb-6 flex-grow">"{t.quote}"</p>
              <div className="flex items-center gap-4">
                <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover border-2 border-brand-100" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{t.name}</h4>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;