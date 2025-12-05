import React from 'react';
import { ChevronRight, ShieldCheck, Zap, BarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../types';

const Welcome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-bold text-gray-900">PayEasy</span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate(AppRoute.LOGIN)}
            className="text-gray-600 font-medium hover:text-indigo-600 transition-colors"
          >
            Entrar
          </button>
          <button 
            onClick={() => navigate(AppRoute.REGISTER)}
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Criar conta
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-gradient-to-b from-white to-indigo-50/50">
        <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-6 animate-pulse">
            🚀 Nova plataforma de pagamentos
        </span>
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 max-w-4xl">
          Simplifique suas vendas e receba pagamentos de forma <span className="text-indigo-600">rápida e segura.</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl">
          O PayEasy é a solução completa para gerenciar produtos, gerar links de pagamento e acompanhar o crescimento do seu negócio em tempo real.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
             <button 
                onClick={() => navigate(AppRoute.REGISTER)}
                className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center"
            >
                Começar Agora
                <ChevronRight className="ml-2" />
            </button>
             <button className="px-8 py-4 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                Ver Demonstração
            </button>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-6xl mx-auto text-left">
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 text-emerald-600">
                    <Zap size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Venda Rápida</h3>
                <p className="text-gray-500">Crie links de pagamento em segundos e envie via WhatsApp ou redes sociais.</p>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 text-blue-600">
                    <ShieldCheck size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Segurança Total</h3>
                <p className="text-gray-500">Seus dados e de seus clientes protegidos com criptografia de ponta a ponta.</p>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-4 text-violet-600">
                    <BarChart size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Gestão Completa</h3>
                <p className="text-gray-500">Dashboards intuitivos para você acompanhar cada centavo do seu lucro.</p>
            </div>
        </div>
      </main>

      <footer className="py-8 text-center text-gray-500 text-sm bg-white border-t border-gray-100">
        © 2024 PayEasy Inc. Todos os direitos reservados.
      </footer>
    </div>
  );
};

export default Welcome;