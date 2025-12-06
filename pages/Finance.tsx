import React, { useState } from 'react';
import { Wallet, TrendingUp, History, ArrowDownLeft, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { Transaction } from '../types';

const mockTransactions: Transaction[] = [
  { id: '1', type: 'withdrawal', amount: 500, fee: 15, netAmount: 485, status: 'completed', method: 'M-Pesa', phoneNumber: '841234567', date: '2023-10-25' },
  { id: '2', type: 'withdrawal', amount: 1200, fee: 29, netAmount: 1171, status: 'pending', method: 'e-Mola', phoneNumber: '869876543', date: '2023-10-26' },
  { id: '3', type: 'withdrawal', amount: 200, fee: 9, netAmount: 191, status: 'rejected', method: 'M-Pesa', phoneNumber: '855551111', date: '2023-10-24' },
];

const Finance: React.FC = () => {
  const [balance, setBalance] = useState({ available: 15400, pending: 2350, withdrawn: 4500 });
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawMethod, setWithdrawMethod] = useState<'M-Pesa' | 'e-Mola'>('M-Pesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const calculateFee = (amount: number) => {
      // Taxa: 5 MZN fixo + 2%
      return 5 + (amount * 0.02);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    const amount = parseFloat(withdrawAmount);

    // Validation
    if (isNaN(amount) || amount < 200) {
        setMessage({ type: 'error', text: 'O valor mínimo para saque é 200 MZN.' });
        setLoading(false);
        return;
    }

    if (amount > balance.available) {
        setMessage({ type: 'error', text: 'Saldo insuficiente.' });
        setLoading(false);
        return;
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (withdrawMethod === 'M-Pesa' && (!cleanPhone.startsWith('84') && !cleanPhone.startsWith('85'))) {
        setMessage({ type: 'error', text: 'Para M-Pesa, o número deve começar com 84 ou 85.' });
        setLoading(false);
        return;
    }
    if (withdrawMethod === 'e-Mola' && !cleanPhone.startsWith('86')) {
        setMessage({ type: 'error', text: 'Para e-Mola, o número deve começar com 86.' });
        setLoading(false);
        return;
    }
    if (cleanPhone.length !== 9) {
        setMessage({ type: 'error', text: 'Número de telefone inválido (deve ter 9 dígitos).' });
        setLoading(false);
        return;
    }

    // Simulate API Call
    setTimeout(() => {
        const fee = calculateFee(amount);
        const net = amount - fee;

        const newTransaction: Transaction = {
            id: Date.now().toString(),
            type: 'withdrawal',
            amount: amount,
            fee: fee,
            netAmount: net,
            status: 'pending',
            method: withdrawMethod,
            phoneNumber: cleanPhone,
            date: new Date().toISOString().split('T')[0]
        };

        setTransactions([newTransaction, ...transactions]);
        setBalance(prev => ({ ...prev, available: prev.available - amount, withdrawn: prev.withdrawn + amount }));
        setMessage({ type: 'success', text: 'Saque solicitado com sucesso!' });
        setWithdrawAmount('');
        setLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financeiro</h1>
        <p className="text-gray-500 dark:text-gray-400">Gerencie seus ganhos e saques.</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-indigo-600 rounded-xl p-6 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <p className="text-indigo-100 text-sm font-medium mb-1">Saldo Disponível</p>
              <h2 className="text-3xl font-bold">{balance.available.toLocaleString('pt-MZ', {style: 'currency', currency: 'MZN'})}</h2>
              <p className="text-xs text-indigo-200 mt-2">Pronto para saque</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Saldo Pendente</p>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{balance.pending.toLocaleString('pt-MZ', {style: 'currency', currency: 'MZN'})}</h2>
              <p className="text-xs text-gray-400 mt-2">Vendas em processamento ou garantia</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total Retirado</p>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{balance.withdrawn.toLocaleString('pt-MZ', {style: 'currency', currency: 'MZN'})}</h2>
              <p className="text-xs text-gray-400 mt-2">Histórico total</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Withdrawal Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <ArrowDownLeft size={20} className="text-indigo-600" />
                  Solicitar Saque
              </h3>
              
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg mb-6">
                  <p className="text-xs text-indigo-800 dark:text-indigo-300 font-medium">Regras de Saque:</p>
                  <ul className="text-xs text-indigo-700 dark:text-indigo-400 mt-2 list-disc pl-4 space-y-1">
                      <li>Valor mínimo: 200 MZN</li>
                      <li>Taxa: 5 MZN + 2% do valor</li>
                      <li>M-Pesa: Números 84 ou 85</li>
                      <li>e-Mola: Números 86</li>
                  </ul>
              </div>

              <form onSubmit={handleWithdraw} className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor (MZN)</label>
                      <input 
                        type="number"
                        placeholder="0.00"
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                      />
                      {withdrawAmount && !isNaN(parseFloat(withdrawAmount)) && (
                          <div className="mt-2 text-xs flex justify-between text-gray-500 dark:text-gray-400">
                              <span>Taxa: {calculateFee(parseFloat(withdrawAmount)).toFixed(2)} MZN</span>
                              <span className="font-bold text-gray-700 dark:text-gray-200">Receberá: {(parseFloat(withdrawAmount) - calculateFee(parseFloat(withdrawAmount))).toFixed(2)} MZN</span>
                          </div>
                      )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <button 
                        type="button"
                        onClick={() => setWithdrawMethod('M-Pesa')}
                        className={`p-3 rounded-lg border text-sm font-medium flex flex-col items-center justify-center gap-2 transition-colors ${withdrawMethod === 'M-Pesa' ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}
                      >
                          M-Pesa
                      </button>
                      <button 
                        type="button"
                        onClick={() => setWithdrawMethod('e-Mola')}
                         className={`p-3 rounded-lg border text-sm font-medium flex flex-col items-center justify-center gap-2 transition-colors ${withdrawMethod === 'e-Mola' ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}
                      >
                          e-Mola
                      </button>
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número de Telefone</label>
                      <input 
                        type="tel"
                        placeholder={withdrawMethod === 'M-Pesa' ? "84/85..." : "86..."}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                  </div>

                  {message && (
                    <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {message.type === 'success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
                        {message.text}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-70 flex items-center justify-center"
                  >
                      {loading ? <Loader2 className="animate-spin" /> : "Confirmar Saque"}
                  </button>
              </form>
          </div>

          {/* Transaction History */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <History size={20} className="text-gray-500" />
                  Histórico de Saques
              </h3>
              
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-xs">
                          <tr>
                              <th className="p-3 rounded-l-lg">Data</th>
                              <th className="p-3">Método</th>
                              <th className="p-3">Valor Líquido</th>
                              <th className="p-3 text-right rounded-r-lg">Status</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {transactions.map((tx) => (
                              <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                  <td className="p-3 text-gray-900 dark:text-white">{tx.date}</td>
                                  <td className="p-3 text-gray-500 dark:text-gray-400">
                                      {tx.method} <span className="text-xs text-gray-400">({tx.phoneNumber})</span>
                                  </td>
                                  <td className="p-3 font-medium text-gray-900 dark:text-white">
                                      {tx.netAmount.toLocaleString('pt-MZ', {style: 'currency', currency: 'MZN'})}
                                  </td>
                                  <td className="p-3 text-right">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          tx.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                                          tx.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                                          'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                      }`}>
                                          {tx.status === 'completed' ? 'Concluído' : tx.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                                      </span>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                  {transactions.length === 0 && (
                      <p className="text-center text-gray-500 py-6">Nenhum saque realizado ainda.</p>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Finance;