import React from 'react';
import { DollarSign, ShoppingBag, CreditCard, TrendingUp, Plus, Link as LinkIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatsCard from '../components/StatsCard';
import { Sale } from '../types';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../types';

const mockData = [
  { name: 'Seg', value: 2400 },
  { name: 'Ter', value: 1398 },
  { name: 'Qua', value: 9800 },
  { name: 'Qui', value: 3908 },
  { name: 'Sex', value: 4800 },
  { name: 'Sab', value: 3800 },
  { name: 'Dom', value: 4300 },
];

const recentSales: Sale[] = [
  { id: '1', productId: '101', productName: 'Fone Bluetooth Pro', date: 'Hoje, 14:30', amount: 1500.00, method: 'PIX', status: 'Completed', customerName: 'João Silva' },
  { id: '2', productId: '102', productName: 'Curso React Master', date: 'Hoje, 10:15', amount: 3500.00, method: 'Credit Card', status: 'Completed', customerName: 'Maria Garcia' },
  { id: '3', productId: '103', productName: 'Smartwatch V2', date: 'Ontem, 18:45', amount: 2450.00, method: 'Credit Card', status: 'Pending', customerName: 'Carlos Souza' },
  { id: '4', productId: '101', productName: 'Fone Bluetooth Pro', date: 'Ontem, 09:20', amount: 1500.00, method: 'Apple Pay', status: 'Completed', customerName: 'Ana Paula' },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Bem-vindo de volta! Aqui está o resumo das suas vendas.</p>
        </div>
        <div className="flex gap-3">
          <button 
             onClick={() => navigate(AppRoute.PRODUCTS)}
             className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
          >
            <Plus size={16} className="mr-2" />
            Novo Produto
          </button>
          <button 
             onClick={() => navigate(AppRoute.LINKS)}
             className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <LinkIcon size={16} className="mr-2" />
            Criar Link
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Receita Total" 
          value="MT 124.500" 
          trend="+12.5%" 
          trendUp={true} 
          icon={DollarSign} 
          color="bg-emerald-500" 
        />
        <StatsCard 
          title="Vendas" 
          value="142" 
          trend="+8.2%" 
          trendUp={true} 
          icon={ShoppingBag} 
          color="bg-blue-500" 
        />
        <StatsCard 
          title="Ticket Médio" 
          value="MT 876" 
          trend="-2.1%" 
          trendUp={false} 
          icon={CreditCard} 
          color="bg-violet-500" 
        />
        <StatsCard 
          title="Conversão" 
          value="3.2%" 
          trend="+1.4%" 
          trendUp={true} 
          icon={TrendingUp} 
          color="bg-amber-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Visão Geral de Vendas</h2>
            <select className="text-sm border-gray-200 dark:border-gray-700 bg-transparent rounded-lg text-gray-500 focus:ring-indigo-500 focus:border-indigo-500">
              <option>Esta Semana</option>
              <option>Este Mês</option>
              <option>Este Ano</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} prefix="MT " />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ stroke: '#4f46e5', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Últimas Vendas</h2>
          <div className="space-y-6">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                    {sale.customerName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{sale.productName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{sale.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">+MT {sale.amount.toFixed(2)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    sale.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 
                    sale.status === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {sale.status === 'Completed' ? 'Pago' : sale.status === 'Pending' ? 'Pendente' : 'Falha'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">
            Ver todas as transações
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;