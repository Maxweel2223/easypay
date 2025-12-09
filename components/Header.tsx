import React, { useState, useEffect } from 'react';
import { Menu, X, Wallet } from 'lucide-react';
import { ViewState } from '../App';

interface HeaderProps {
  onNavigate: (view: ViewState) => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('landing')}>
          <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-200">
            <Wallet size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            Pay<span className="text-brand-600">Easy</span>
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#funcionalidades" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">Funcionalidades</a>
          <a href="#pagamentos" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">Pagamentos</a>
          <a href="#precos" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">Preços</a>
          
          <div className="flex items-center gap-4 ml-4">
            <button 
              onClick={() => onNavigate('login')}
              className="text-sm font-semibold text-slate-700 hover:text-brand-600"
            >
              Entrar
            </button>
            <button 
              onClick={() => onNavigate('register')}
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg shadow-slate-200"
            >
              Criar conta grátis
            </button>
          </div>
        </nav>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-slate-700"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-slate-100 p-4 shadow-xl flex flex-col gap-4">
          <a href="#funcionalidades" className="block py-2 text-slate-600 font-medium" onClick={() => setMobileMenuOpen(false)}>Funcionalidades</a>
          <a href="#pagamentos" className="block py-2 text-slate-600 font-medium" onClick={() => setMobileMenuOpen(false)}>Pagamentos</a>
          <a href="#precos" className="block py-2 text-slate-600 font-medium" onClick={() => setMobileMenuOpen(false)}>Preços</a>
          <hr className="border-slate-100" />
          <button 
            onClick={() => { setMobileMenuOpen(false); onNavigate('login'); }}
            className="w-full text-center py-3 text-slate-700 font-semibold"
          >
            Entrar
          </button>
          <button 
            onClick={() => { setMobileMenuOpen(false); onNavigate('register'); }}
            className="w-full bg-brand-600 text-white py-3 rounded-lg font-semibold shadow-md"
          >
            Criar conta grátis
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;