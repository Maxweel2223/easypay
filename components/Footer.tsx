import React from 'react';
import { Wallet, Instagram, Facebook, Twitter, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-100 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
                <Wallet size={18} />
              </div>
              <span className="text-xl font-bold text-slate-900">PayEasy</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              A plataforma líder em Moçambique para venda de infoprodutos. Simplificamos pagamentos para você focar no conteúdo.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-400 hover:text-brand-600 transition-colors"><Instagram size={20} /></a>
              <a href="#" className="text-slate-400 hover:text-brand-600 transition-colors"><Facebook size={20} /></a>
              <a href="#" className="text-slate-400 hover:text-brand-600 transition-colors"><Twitter size={20} /></a>
              <a href="#" className="text-slate-400 hover:text-brand-600 transition-colors"><Linkedin size={20} /></a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6">Plataforma</h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li><a href="#" className="hover:text-brand-600">Funcionalidades</a></li>
              <li><a href="#" className="hover:text-brand-600">Preços</a></li>
              <li><a href="#" className="hover:text-brand-600">Área de Membros</a></li>
              <li><a href="#" className="hover:text-brand-600">Checkout Builder</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6">Suporte</h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li><a href="#" className="hover:text-brand-600">Central de Ajuda</a></li>
              <li><a href="#" className="hover:text-brand-600">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-brand-600">Privacidade</a></li>
              <li><a href="#" className="hover:text-brand-600">Fale Conosco</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6">Contato</h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>Maputo, Moçambique</li>
              <li>suporte@payeasy.co.mz</li>
              <li>+258 84 000 0000</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">© 2025 PayEasy. Todos os direitos reservados.</p>
          <p className="text-sm text-slate-400">Feito com ❤️ em Moçambique</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;