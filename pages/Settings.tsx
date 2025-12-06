import React, { useState } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';
import { Moon, Sun, Save, User as UserIcon, Camera, Loader2, Bell, Globe } from 'lucide-react';

interface SettingsProps {
  user: User;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onUpdateUser: (user: Partial<User>) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, theme, toggleTheme, onUpdateUser }) => {
  const [name, setName] = useState(user.name);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar || '');
  const [webhookUrl, setWebhookUrl] = useState(user.webhookUrl || '');
  const [pushEnabled, setPushEnabled] = useState(user.pushEnabled || false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // In a real app, these extra fields would be in a separate 'profiles' table linked to auth
      // For this demo, we assume we can store them or just simulate the state update
      const { data, error } = await supabase.auth.updateUser({
        data: { name: name, avatar_url: avatarUrl, webhook_url: webhookUrl, push_enabled: pushEnabled }
      });

      if (error) throw error;

      onUpdateUser({ name, avatar: avatarUrl, webhookUrl, pushEnabled });
      setMessage({ type: 'success', text: 'Configurações atualizadas com sucesso!' });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
        <p className="text-gray-500 dark:text-gray-400">Gerencie suas preferências, perfil e integrações.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <UserIcon size={20} />
            Perfil do Usuário
          </h2>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
             <div className="flex items-center gap-4 mb-6">
                <div className="relative w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-2xl font-bold text-gray-400 overflow-hidden shrink-0">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        name.charAt(0).toUpperCase()
                    )}
                    <label className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                        <Camera className="text-white" size={20} />
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                </div>
                <div className="flex-1">
                     <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Sua foto</p>
                     <p className="text-xs text-gray-500 dark:text-gray-400">Toque na foto para alterar. Recomendado: Quadrado 400x400px.</p>
                </div>
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome de Exibição</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
                <input 
                  type="email" 
                  disabled
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                  value={user.email}
                />
                <p className="text-xs text-gray-400 mt-1">O e-mail não pode ser alterado.</p>
             </div>

             <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <h3 className="text-md font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Globe size={18} /> Integrações
                </h3>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Webhook URL</label>
                <input 
                  type="url" 
                  placeholder="https://seu-site.com/webhook"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">Receba alertas de vendas em tempo real.</p>
             </div>

             <div className="flex items-center justify-between py-2">
                 <div className="flex items-center gap-2">
                     <Bell size={18} className="text-gray-500" />
                     <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Notificações Push</span>
                 </div>
                 <button 
                    type="button"
                    onClick={() => setPushEnabled(!pushEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${pushEnabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                 >
                     <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pushEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                 </button>
             </div>

             {message && (
                 <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700'}`}>
                     {message.text}
                 </div>
             )}

             <button 
                type="submit"
                disabled={loading}
                className="flex items-center justify-center w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70"
             >
                 {loading ? <Loader2 className="animate-spin mr-2" size={18}/> : <Save size={18} className="mr-2" />}
                 {loading ? 'Salvar Tudo' : 'Salvar Alterações'}
             </button>
          </form>
        </div>

        {/* App Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 h-fit">
           <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Aparência e Preferências</h2>
           
           <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
               <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-indigo-500 text-white' : 'bg-orange-100 text-orange-500'}`}>
                       {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                   </div>
                   <div>
                       <h3 className="font-medium text-gray-900 dark:text-white">Tema do Sistema</h3>
                       <p className="text-sm text-gray-500 dark:text-gray-400">{theme === 'dark' ? 'Modo Escuro Ativo' : 'Modo Claro Ativo'}</p>
                   </div>
               </div>
               <button 
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-200'}`}
               >
                   <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
               </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;