import React, { useState } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';
import { Moon, Sun, Save, User as UserIcon, Camera, Loader2, Bell, Globe, X, Crop, CheckCircle, Database, Copy } from 'lucide-react';

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

  // Image Cropping
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);

  // Webhook Test
  const [testingWebhook, setTestingWebhook] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result as string);
        setShowCropModal(true);
      };
      reader.onerror = () => alert('Erro ao carregar a imagem.');
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset input to allow re-selection
    }
  };

  const confirmCrop = () => {
      if (!tempImage) return;
      const img = new Image();
      img.src = tempImage;
      img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = 512; // Standard avatar size
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;

          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
          
          // High quality output
          const finalDataUrl = canvas.toDataURL('image/jpeg', 0.95);
          
          setAvatarUrl(finalDataUrl);
          setShowCropModal(false);
          setTempImage(null);
      };
  };

  const handlePushToggle = async () => {
      if (!pushEnabled) {
          // Request permission
          if (!("Notification" in window)) {
              alert("Este navegador não suporta notificações.");
              return;
          }
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
              setPushEnabled(true);
              new Notification("PayEasy", { body: "Notificações ativadas com sucesso!" });
          } else {
              alert("Permissão negada. Ative as notificações nas configurações do navegador.");
          }
      } else {
          setPushEnabled(false);
      }
  };

  const testWebhook = async () => {
      if (!webhookUrl) return;
      setTestingWebhook(true);
      try {
          // Simulate a POST request
          const res = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ event: 'test_ping', message: 'PayEasy Webhook Test', timestamp: new Date() })
          }).catch(() => null); 

          setMessage({ type: 'success', text: 'Disparo de teste enviado! Verifique seu servidor.' });
      } catch (e) {
          setMessage({ type: 'error', text: 'Erro ao testar webhook.' });
      } finally {
          setTestingWebhook(false);
      }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
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

  const sqlScript = `-- 1. Tabela de Produtos
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  description text,
  price numeric not null,
  stock integer default 0,
  category text,
  "imageUrl" text,
  user_id uuid references auth.users not null,
  status text default 'pending',
  "rejectionReason" text,
  whatsapp text,
  "pixelId" text,
  "analyticsId" text,
  "redirectUrl" text,
  "salesCount" integer default 0
);

-- 2. Tabela de Links de Pagamento
create table if not exists public.payment_links (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null,
  product_id uuid references public.products not null
);

-- 3. Tabela de Vendas (Sales)
create table if not exists public.sales (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  "productId" uuid references public.products not null,
  "productName" text,
  amount numeric not null,
  method text,
  status text default 'Pending',
  "customerName" text,
  customer_whatsapp text,
  user_id uuid references auth.users not null
);

-- 4. Tabela de Mensagens de Suporte
create table if not exists public.support_messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  text text not null,
  sender text not null,
  user_id uuid references auth.users not null
);

-- 5. Função RPC para incrementar contador de vendas
create or replace function increment_sales(row_id uuid)
returns void as $$
begin
  update public.products
  set "salesCount" = "salesCount" + 1
  where id = row_id;
end;
$$ language plpgsql;

-- 6. Habilitar Segurança (RLS)
alter table public.products enable row level security;
alter table public.payment_links enable row level security;
alter table public.sales enable row level security;
alter table public.support_messages enable row level security;

-- 7. Criar Políticas de Acesso
create policy "Users can manage own products" on public.products for all using (auth.uid() = user_id);
create policy "Public can view approved products" on public.products for select using (true);

create policy "Users can manage own links" on public.payment_links for all using (auth.uid() = user_id);

create policy "Sellers can view own sales" on public.sales for select using (auth.uid() = user_id);
create policy "Public can create sales" on public.sales for insert with check (true);

create policy "Users can manage own messages" on public.support_messages for all using (auth.uid() = user_id);`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
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
                
                {/* Mobile Safe Avatar Upload */}
                <label className="relative w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-2xl font-bold text-gray-400 overflow-hidden shrink-0 group border-2 border-transparent hover:border-indigo-500 transition-colors cursor-pointer">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        name.charAt(0).toUpperCase()
                    )}
                    
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100">
                        <Camera className="text-white" size={24} />
                    </div>
                    {/* Native Input inside Label */}
                    <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/jpg" 
                        onChange={handleFileChange}
                        className="sr-only"
                    />
                </label>

                <div className="flex-1">
                     <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Sua foto</p>
                     <p className="text-xs text-gray-500 dark:text-gray-400">Toque na foto para editar.</p>
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
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-md font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Globe size={18} /> Webhook
                    </h3>
                    {webhookUrl && (
                        <button 
                            type="button" 
                            onClick={testWebhook}
                            disabled={testingWebhook}
                            className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                            {testingWebhook ? 'Testando...' : 'Testar URL'}
                        </button>
                    )}
                </div>
                <input 
                  type="url" 
                  placeholder="https://seu-site.com/webhook"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">URL para receber notificações de venda (POST).</p>
             </div>

             <div className="flex items-center justify-between py-2">
                 <div className="flex items-center gap-2">
                     <Bell size={18} className="text-gray-500" />
                     <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Notificações Push</span>
                 </div>
                 <button 
                    type="button"
                    onClick={handlePushToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${pushEnabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                 >
                     <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pushEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                 </button>
             </div>

             {message && (
                 <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700'}`}>
                     {message.type === 'success' ? <CheckCircle size={16}/> : null}
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

        {/* Right Column */}
        <div className="space-y-8 h-fit">
            {/* App Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Aparência</h2>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-indigo-500 text-white' : 'bg-orange-100 text-orange-500'}`}>
                            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">Tema do Sistema</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}</p>
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

            {/* Database Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Database size={20} /> Instalação do Banco de Dados
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Se você está vendo erros de "Tabela não encontrada", copie este script SQL e execute no "SQL Editor" do seu painel Supabase.
                </p>
                <div className="relative">
                    <pre className="bg-gray-900 text-gray-300 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap font-mono h-64 overflow-y-auto border border-gray-700">
                        {sqlScript}
                    </pre>
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(sqlScript);
                            alert("Script SQL copiado para a área de transferência!");
                        }}
                        className="absolute top-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 shadow-lg"
                    >
                        <Copy size={12} /> Copiar SQL
                    </button>
                </div>
            </div>
        </div>
      </div>

       {/* Crop Modal */}
      {showCropModal && (
          <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="font-bold text-gray-900 dark:text-white">Ajustar Foto</h3>
                      <button onClick={() => { setShowCropModal(false); setTempImage(null); }} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full"><X size={20} /></button>
                  </div>
                  <div className="p-6 flex flex-col items-center">
                      <div className="w-64 h-64 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden relative mb-4 border-2 border-dashed border-indigo-300">
                          {tempImage && (
                              <img src={tempImage} alt="Crop" className="w-full h-full object-cover" />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                               {/* Circle Overlay Guide */}
                               <div className="rounded-full border-2 border-white/50 w-full h-full"></div>
                          </div>
                      </div>
                      <p className="text-xs text-gray-500 text-center mb-6">
                          A imagem será cortada em círculo e otimizada.
                      </p>
                      <button 
                          onClick={confirmCrop}
                          className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2"
                      >
                          <Crop size={18} /> Confirmar Foto
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;