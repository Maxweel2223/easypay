import React, { useState } from 'react';
import { Eye, EyeOff, Facebook, Mail, AlertCircle, PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { AppRoute } from '../types';

interface AuthProps {
  mode: 'login' | 'register';
  onLogin?: () => void;
}

const Auth: React.FC<AuthProps> = ({ mode, onLogin }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();

    try {
      if (mode === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              name: name,
            },
          },
        });
        
        if (signUpError) throw signUpError;

        if (data.user && !data.session) {
            setSuccessMessage("Conta criada com sucesso! Por favor, verifique seu e-mail para confirmar o cadastro antes de entrar.");
            setLoading(false);
            return;
        }

      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (signInError) throw signInError;
      }
      
      if (onLogin) onLogin();
      
    } catch (err: any) {
      console.error(err);
      const msg = err.message || '';

      if (msg === 'Invalid login credentials') {
          setError('E-mail ou senha incorretos. Tente novamente.');
      } else if (msg.includes('Email not confirmed')) {
          setError('Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada (e spam) e clique no link de confirmação.');
      } else if (msg.includes('invalid') || err.status === 422) {
          setError('O formato do e-mail é inválido. Verifique se não há espaços ou erros de digitação.');
      } else if (msg.includes('User already registered')) {
          setError('Este e-mail já está cadastrado. Tente fazer login.');
      } else if (msg.includes('Password should be at least')) {
          setError('A senha deve ter pelo menos 6 caracteres.');
      } else if (msg.includes('Failed to fetch')) {
          setError('Falha de conexão com o servidor. Verifique sua conexão de internet.');
      } else {
          setError(msg || 'Ocorreu um erro. Tente novamente.');
      }
    } finally {
      if (!successMessage) { 
        setLoading(false);
      }
    }
  };

  const handleSwitchMode = () => {
      setError(null);
      setSuccessMessage(null);
      if (mode === 'login') {
          navigate(AppRoute.REGISTER);
      } else {
          navigate(AppRoute.LOGIN);
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">P</span>
            </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {mode === 'login' ? 'Acesse sua conta' : 'Crie sua conta grátis'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Ou{' '}
          <button 
            onClick={handleSwitchMode}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            {mode === 'login' ? 'comece seu período de teste' : 'faça login se já tem conta'}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 flex flex-col items-start rounded-r-md">
              <div className="flex items-center mb-1">
                  <AlertCircle size={20} className="text-red-500 mr-2 flex-shrink-0" />
                  <p className="text-sm font-bold text-red-700">Erro de Login</p>
              </div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-md">
              <p className="text-sm text-green-700 font-medium">{successMessage}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome completo
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Endereço de e-mail
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <button 
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
               <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                  Eu aceito os <a href="#" className="text-indigo-600 hover:text-indigo-500">Termos de Serviço</a>
                </label>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Processando...' : (mode === 'login' ? 'Entrar' : 'Criar Conta')}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Ou continue com</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div>
                <button
                  type="button"
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                >
                   <Facebook size={20} className="text-blue-600" />
                </button>
              </div>
              <div>
                <button
                  type="button"
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                >
                   <Mail size={20} className="text-red-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;