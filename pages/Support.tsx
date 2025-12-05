import React, { useState, useRef, useEffect } from 'react';
import { Send, User as UserIcon, Bot, Loader2, AlertCircle } from 'lucide-react';
import { generateSupportResponse } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';
import { Message, User } from '../types';

interface SupportProps {
  user: User;
}

const Support: React.FC<SupportProps> = ({ user }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
        
      if (error) throw error;

      if (data) {
        setMessages(data);
      }
      
      // If no messages, add greeting locally (don't save yet)
      if (!data || data.length === 0) {
          setMessages([{
             id: 'welcome',
             text: 'Olá! Como posso ajudar você hoje com o PayEasy?',
             sender: 'bot'
          }]);
      }
    } catch (err: any) {
      console.error('Error fetching chat history', err);
      if (err?.code === '42P01' || err?.code === 'PGRST205') {
          setError("Tabela 'support_messages' não configurada. Fale com o administrador do sistema.");
          console.info(`
-- Script SQL para criar tabela support_messages (Execute no Supabase Editor):
create table public.support_messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  text text not null,
  sender text not null,
  user_id uuid references auth.users not null
);
alter table public.support_messages enable row level security;
create policy "Users can view their own messages" on public.support_messages for select using (auth.uid() = user_id);
create policy "Users can insert their own messages" on public.support_messages for insert with check (auth.uid() = user_id);
          `);
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const text = input;
    setInput('');
    setIsTyping(true);

    // 1. Optimistic UI Update & Save User Message
    const optimisticUserMsg: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      user_id: user.id
    };
    setMessages(prev => [...prev, optimisticUserMsg]);

    try {
        await supabase.from('support_messages').insert([{
            text: text,
            sender: 'user',
            user_id: user.id
        }]);

        // 2. Generate AI Response
        // Build simple context from last 3 messages
        const context = messages.slice(-3).map(m => `${m.sender}: ${m.text}`).join('\n');
        const responseText = await generateSupportResponse(text, context);
        
        // 3. Save Bot Message
        const { data } = await supabase.from('support_messages').insert([{
            text: responseText,
            sender: 'bot',
            user_id: user.id
        }]).select();

        const botMsg = data ? data[0] : {
            id: (Date.now() + 1).toString(),
            text: responseText,
            sender: 'bot'
        };

        setMessages(prev => [...prev, botMsg]);

    } catch (err) {
        console.error("Error in chat flow", err);
    } finally {
        setIsTyping(false);
    }
  };

  if (loadingHistory) {
      return (
          <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
      );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col max-w-4xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Suporte PayEasy</h1>
        <p className="text-gray-500 dark:text-gray-400">Fale com nosso assistente virtual inteligente.</p>
      </div>

      {error ? (
          <div className="flex-1 flex items-center justify-center">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md">
                  <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-red-700 mb-2">Erro de Configuração</h3>
                  <p className="text-red-600 text-sm mb-4">{error}</p>
                  <p className="text-xs text-gray-500">Verifique o console para mais detalhes técnicos.</p>
              </div>
          </div>
      ) : (
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
            {messages.map((msg) => (
                <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                <div className={`flex max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-emerald-500 text-white'}`}>
                    {msg.sender === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm ${
                    msg.sender === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm'
                    }`}>
                    {msg.text}
                    </div>
                </div>
                </div>
            ))}
            {isTyping && (
                <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm ml-10">
                    <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                </div>
                </div>
            )}
            <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSend} className="flex gap-2">
                <input 
                type="text" 
                className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Digite sua dúvida..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                />
                <button 
                type="submit" 
                disabled={!input.trim() || isTyping}
                className="px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                <Send size={20} />
                </button>
            </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Support;