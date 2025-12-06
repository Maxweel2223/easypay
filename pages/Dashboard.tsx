import React, { useState } from 'react';
import { DollarSign, ShoppingBag, CreditCard, TrendingUp, Plus, Link as LinkIcon, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatsCard from '../components/StatsCard';
import { Sale } from '../types';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../types';

// Mock data updated to represent a timeline better
const mockChartData = [
  { name: 'Seg', approved: 2400, cancelled: 400 },
  { name: 'Ter', approved: 1398, cancelled: 300 },
  { name: 'Qua', approved: 9800, cancelled: 100 },
  { name: 'Qui', approved: 3908, cancelled: 500 },
  { name: 'Sex', approved: 4800, cancelled: 200 },
  { name: 'Sab', approved: 3800, cancelled: 100 },
  { name: 'Dom', approved: 4300, cancelled: 0 },
];

const recentSales: Sale[] = [
  { id: '1', productId: '101', productName: 'Fone Bluetooth Pro', date: 'Hoje, 14:30', amount: 1500.00, method: 'M-Pesa', status: 'Completed', customerName: 'João Silva' },
  { id: '2', productId: '102', productName: 'Curso React Master', date: 'Hoje, 10:15', amount: 3500.00, method: 'Credit Card', status: 'Cancelled', customerName: 'Maria Garcia' },
  { id: '3', productId: '103', productName: 'Smartwatch V2', date: 'Ontem, 18:45', amount: 2450.00, method: 'e-Mola', status: 'Pending', customerName: 'Carlos Souza' },
  { id: '4', productId: '101', productName: 'Fone Bluetooth Pro', date: 'Ontem, 09:20', amount: 1500.00, method: 'M-Pesa', status: 'Completed', customerName: 'Ana Paula' },
  { id: '5', productId: '104', productName: 'Carregador Portátil', date: 'Ontem, 08:00', amount: 850.00, method: 'M-Pesa', status: 'Completed', customerName: 'Felipe Santos' },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState('Esta Semana');

  // Logic for stats calculation based on mock data (replace with real DB calls later)
  const completedSales = recentSales.filter(s => s.status === 'Completed');
  const cancelledSales = recentSales.filter(s => s.status === 'Cancelled');
  const pendingSales = recentSales.filter(s => s.status === 'Pending');

  const grossRevenue = completedSales.reduce((acc, curr) => acc + curr.amount, 0);
  const netRevenue = grossRevenue * 0.95; // Assuming 5% platform fee for example

  const conversionRate = 3.2; // Mock percent

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Visão geral do seu negócio em tempo real.</p>
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

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard 
          title="Receita Bruta" 
          value={`${grossRevenue.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}`} 
          trend="+12.5%" 
          trendUp={true} 
          icon={DollarSign} 
          color="bg-emerald-500" 
        />
        <StatsCard 
          title="Receita Líquida" 
          value={`${netRevenue.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}`} 
          trend="+11.2%" 
          trendUp={true} 
          icon={CreditCard} 
          color="bg-violet-500" 
        />
         <StatsCard 
          title="Taxa de Conversão" 
          value={`${conversionRate}%`} 
          trend="+1.4%" 
          trendUp={true} 
          icon={TrendingUp} 
          color="bg-amber-500" 
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
             <div>
                 <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Vendas Aprovadas</p>
                 <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{completedSales.length}</p>
             </div>
             <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                 <CheckCircle size={24} />
             </div>
         </div>
         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
             <div>
                 <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Vendas Pendentes</p>
                 <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{pendingSales.length}</p>
             </div>
             <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                 <AlertTriangle size={24} />
             </div>
         </div>
         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
             <div>
                 <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Vendas Canceladas</p>
                 <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{cancelledSales.length}</p>
             </div>
             <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                 <XCircle size={24} />
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Performance de Vendas</h2>
            <select 
                className="text-sm border-gray-200 dark:border-gray-700 bg-transparent rounded-lg text-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
            >
              <option value="Hoje">Hoje</option>
              <option value="Esta Semana">Esta Semana</option>
              <option value="Este Mês">Este Mês</option>
              <option value="Este Ano">Este Ano</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCancelled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="approved" stackId="1" stroke="#10b981" fill="url(#colorApproved)" name="Aprovadas" />
                <Area type="monotone" dataKey="cancelled" stackId="2" stroke="#ef4444" fill="url(#colorCancelled)" name="Canceladas" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Últimas Transações</h2>
          <div className="space-y-6">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                    ${sale.status === 'Completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/20' : 
                      sale.status === 'Cancelled' ? 'bg-red-100 text-red-600 dark:bg-red-900/20' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/20'}`}>
                    {sale.customerName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{sale.productName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{sale.date} • {sale.method}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{sale.amount.toLocaleString('pt-MZ', {style: 'currency', currency: 'MZN'})}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    sale.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 
                    sale.status === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {sale.status === 'Completed' ? 'Aprovado' : sale.status === 'Pending' ? 'Pendente' : 'Cancelado'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">
            Ver histórico completo
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;