import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Settings, 
  LogOut, 
  Plus, 
  Copy, 
  DollarSign,
  Users,
  Wallet,
  Menu,
  X,
  Bell,
  Smartphone,
  Globe,
  Trash2,
  Lock,
  Save,
  Loader2,
  Upload,
  AlertTriangle,
  Monitor
} from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

interface DashboardProps {
  session: Session;
  onLogout: () => void;
}

type Tab = 'overview' | 'products' | 'settings';
type Language = 'pt-MZ' | 'en-US' | 'es';

// Dicionário de Traduções
const TRANSLATIONS = {
  'pt-MZ': {
    overview: 'Visão Geral',
    products: 'Produtos',
    settings: 'Configurações',
    welcome: 'Bem-vindo de volta',
    subtitle_overview: 'Aqui está o resumo do seu negócio.',
    total_revenue: 'Receita Total',
    sales_made: 'Vendas Realizadas',
    active_products: 'Produtos Ativos',
    recent_sales: 'Vendas nos últimos 7 dias',
    recent_transactions: 'Vendas Recentes',
    your_products: 'Seus Produtos',
    manage_products: 'Gerencie seus links de pagamento e ofertas.',
    new_product: 'Novo Produto',
    no_products: 'Você ainda não tem produtos',
    create_product: 'Criar Produto',
    settings_title: 'Configurações da Conta',
    settings_subtitle: 'Gerencie seu perfil, segurança e preferências.',
    public_profile: 'Perfil Público',
    change_photo: 'Alterar foto',
    photo_help: 'JPG, GIF ou PNG. Max 5MB.',
    full_name: 'Nome Completo',
    phone: 'Telefone',
    change_password: 'Alterar Senha',
    send_reset_email: 'Enviar email de redefinição de senha',
    notifications: 'Notificações',
    email_marketing: 'Email Marketing',
    email_marketing_desc: 'Receba novidades e dicas sobre vendas.',
    push_notif: 'Notificações Push',
    push_notif_desc: 'Alertas no navegador sobre vendas.',
    sms_sales: 'SMS (Vendas)',
    sms_sales_desc: 'Receba SMS a cada venda realizada.',
    connected_devices: 'Dispositivos Conectados',
    current: 'Atual',
    language: 'Idioma',
    danger_zone: 'Zona de Perigo',
    danger_desc: 'Ao excluir sua conta, todos os seus produtos, links de checkout e dados de vendas serão apagados permanentemente.',
    delete_account: 'Excluir minha conta',
    actions: 'Ações',
    save_changes: 'Salvar Alterações',
    saving: 'Salvando...',
    saved_success: 'Configurações salvas com sucesso!',
    product_name: 'Nome do Produto',
    price: 'Preço',
    description: 'Descrição',
    create_and_generate: 'Criar Produto e Gerar Link',
    delete_modal_title: 'Excluir Conta Permanentemente',
    delete_modal_desc: 'Você deseja deletar sua conta? Se sim, digite',
    cancel: 'Cancelar',
    confirm_delete: 'Confirmar Exclusão',
    email_active_subject: 'Notificações de Marketing Ativadas',
    email_active_body: 'Você ativou as notificações de Marketing da PayEasy.',
    email_inactive_subject: 'Notificações de Marketing Desativadas',
    email_inactive_body: 'Você desativou as notificações de Marketing.',
    sms_active_msg: 'PayEasy: As notificações via SMS foram Ativadas com sucesso!',
    device_info: 'Informações do Dispositivo',
    location: 'Localização',
    ip_address: 'Endereço IP',
    logout_device: 'Terminar Sessão',
  },
  'en-US': {
    overview: 'Overview',
    products: 'Products',
    settings: 'Settings',
    welcome: 'Welcome back',
    subtitle_overview: 'Here is your business summary.',
    total_revenue: 'Total Revenue',
    sales_made: 'Sales Made',
    active_products: 'Active Products',
    recent_sales: 'Sales in last 7 days',
    recent_transactions: 'Recent Transactions',
    your_products: 'Your Products',
    manage_products: 'Manage your payment links and offers.',
    new_product: 'New Product',
    no_products: 'You have no products yet',
    create_product: 'Create Product',
    settings_title: 'Account Settings',
    settings_subtitle: 'Manage your profile, security and preferences.',
    public_profile: 'Public Profile',
    change_photo: 'Change photo',
    photo_help: 'JPG, GIF or PNG. Max 5MB.',
    full_name: 'Full Name',
    phone: 'Phone',
    change_password: 'Change Password',
    send_reset_email: 'Send password reset email',
    notifications: 'Notifications',
    email_marketing: 'Email Marketing',
    email_marketing_desc: 'Receive news and sales tips.',
    push_notif: 'Push Notifications',
    push_notif_desc: 'Browser alerts about sales.',
    sms_sales: 'SMS (Sales)',
    sms_sales_desc: 'Receive SMS for every sale made.',
    connected_devices: 'Connected Devices',
    current: 'Current',
    language: 'Language',
    danger_zone: 'Danger Zone',
    danger_desc: 'By deleting your account, all your products, checkout links, and sales data will be permanently erased.',
    delete_account: 'Delete my account',
    actions: 'Actions',
    save_changes: 'Save Changes',
    saving: 'Saving...',
    saved_success: 'Settings saved successfully!',
    product_name: 'Product Name',
    price: 'Price',
    description: 'Description',
    create_and_generate: 'Create Product & Generate Link',
    delete_modal_title: 'Delete Account Permanently',
    delete_modal_desc: 'Do you want to delete your account? If yes, type',
    cancel: 'Cancel',
    confirm_delete: 'Confirm Deletion',
    email_active_subject: 'Marketing Notifications Enabled',
    email_active_body: 'You have enabled PayEasy Marketing notifications.',
    email_inactive_subject: 'Marketing Notifications Disabled',
    email_inactive_body: 'You have disabled Marketing notifications.',
    sms_active_msg: 'PayEasy: SMS notifications have been successfully Enabled!',
    device_info: 'Device Information',
    location: 'Location',
    ip_address: 'IP Address',
    logout_device: 'Sign Out',
  },
  'es': {
    overview: 'Visión General',
    products: 'Productos',
    settings: 'Configuración',
    welcome: 'Bienvenido de nuevo',
    subtitle_overview: 'Aquí está el resumen de tu negocio.',
    total_revenue: 'Ingresos Totales',
    sales_made: 'Ventas Realizadas',
    active_products: 'Productos Activos',
    recent_sales: 'Ventas en los últimos 7 días',
    recent_transactions: 'Ventas Recientes',
    your_products: 'Tus Productos',
    manage_products: 'Administra tus enlaces de pago y ofertas.',
    new_product: 'Nuevo Producto',
    no_products: 'Aún no tienes productos',
    create_product: 'Crear Producto',
    settings_title: 'Configuración de la Cuenta',
    settings_subtitle: 'Administra tu perfil, seguridad y preferencias.',
    public_profile: 'Perfil Público',
    change_photo: 'Cambiar foto',
    photo_help: 'JPG, GIF o PNG. Max 5MB.',
    full_name: 'Nombre Completo',
    phone: 'Teléfono',
    change_password: 'Cambiar Contraseña',
    send_reset_email: 'Enviar correo de restablecimiento',
    notifications: 'Notificaciones',
    email_marketing: 'Email Marketing',
    email_marketing_desc: 'Recibe noticias y consejos de ventas.',
    push_notif: 'Notificaciones Push',
    push_notif_desc: 'Alertas en el navegador sobre ventas.',
    sms_sales: 'SMS (Ventas)',
    sms_sales_desc: 'Recibe SMS por cada venta realizada.',
    connected_devices: 'Dispositivos Conectados',
    current: 'Actual',
    language: 'Idioma',
    danger_zone: 'Zona de Peligro',
    danger_desc: 'Al eliminar tu cuenta, todos tus productos, enlaces de pago y datos de ventas se borrarán permanentemente.',
    delete_account: 'Eliminar mi cuenta',
    actions: 'Acciones',
    save_changes: 'Guardar Cambios',
    saving: 'Guardando...',
    saved_success: '¡Configuración guardada con éxito!',
    product_name: 'Nombre del Producto',
    price: 'Precio',
    description: 'Descripción',
    create_and_generate: 'Crear Producto y Generar Enlace',
    delete_modal_title: 'Eliminar Cuenta Permanentemente',
    delete_modal_desc: '¿Deseas eliminar tu cuenta? Si es así, escribe',
    cancel: 'Cancelar',
    confirm_delete: 'Confirmar Eliminación',
    email_active_subject: 'Notificaciones de Marketing Activadas',
    email_active_body: 'Has activado las notificaciones de Marketing de PayEasy.',
    email_inactive_subject: 'Notificaciones de Marketing Desactivadas',
    email_inactive_body: 'Has desactivado las notificaciones de Marketing.',
    sms_active_msg: 'PayEasy: ¡Las notificaciones por SMS se han activado correctamente!',
    device_info: 'Información del Dispositivo',
    location: 'Ubicación',
    ip_address: 'Dirección IP',
    logout_device: 'Cerrar Sesión',
  }
};

const Dashboard: React.FC<DashboardProps> = ({ session, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial Data
  const initialMeta = session.user.user_metadata || {};
  
  // States
  const [language, setLanguage] = useState<Language>(initialMeta.language || 'pt-MZ');
  const [profile, setProfile] = useState({
    fullName: initialMeta.full_name || '',
    email: session.user.email || '',
    phone: initialMeta.phone_number || '',
    photoUrl: initialMeta.avatar_url || null,
  });
  
  const [notifications, setNotifications] = useState(initialMeta.notifications || {
    email: true,
    push: false,
    sms: false
  });

  // Device Info State
  const [deviceInfo, setDeviceInfo] = useState({
    browser: '',
    os: '',
    ip: '',
    city: '',
    country: ''
  });

  // Previous Notifications State to compare changes
  const prevNotificationsRef = useRef(notifications);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Delete Account Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationName, setDeleteConfirmationName] = useState('');

  // Products State (Mock Data)
  const [products, setProducts] = useState([
    { id: 1, name: 'Curso de Marketing Digital', price: 2500, sales: 42, revenue: 105000, link: 'payeasy.co.mz/p/cmd-123' },
    { id: 2, name: 'Ebook Receitas Moçambicanas', price: 500, sales: 115, revenue: 57500, link: 'payeasy.co.mz/p/erm-456' },
  ]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '' });

  // Translations helper
  const t = (key: keyof typeof TRANSLATIONS['pt-MZ']) => {
    return TRANSLATIONS[language][key] || key;
  };

  // Detect Device Info on Mount
  useEffect(() => {
    const getDeviceDetails = async () => {
      // 1. Browser & OS Detection (Simple Regex)
      const ua = navigator.userAgent;
      let browser = "Desconhecido";
      if (ua.indexOf("Chrome") > -1) browser = "Google Chrome";
      else if (ua.indexOf("Safari") > -1) browser = "Safari";
      else if (ua.indexOf("Firefox") > -1) browser = "Mozilla Firefox";
      else if (ua.indexOf("Edge") > -1) browser = "Microsoft Edge";

      let os = "Desconhecido";
      if (ua.indexOf("Win") > -1) os = "Windows";
      else if (ua.indexOf("Mac") > -1) os = "MacOS";
      else if (ua.indexOf("Linux") > -1) os = "Linux";
      else if (ua.indexOf("Android") > -1) os = "Android";
      else if (ua.indexOf("iPhone") > -1 || ua.indexOf("iPad") > -1) os = "iOS";

      // 2. IP & Location (Using free API)
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        setDeviceInfo({
          browser,
          os,
          ip: data.ip || 'N/A',
          city: data.city || '',
          country: data.country_name || ''
        });
      } catch (e) {
        setDeviceInfo(prev => ({ ...prev, browser, os, ip: 'Detectando...', city: '', country: '' }));
      }
    };

    getDeviceDetails();
  }, []);

  // --- API INTEGRATIONS ---

  const sendEmailNotification = async (isActive: boolean, userEmail: string) => {
    const subject = isActive ? t('email_active_subject') : t('email_inactive_subject');
    const body = `<p>${isActive ? t('email_active_body') : t('email_inactive_body')}</p>`;
    
    // SOLUÇÃO CORS: Usando um Proxy CORS público (corsproxy.io) para contornar o bloqueio da Resend
    // A Resend não permite chamadas diretas do browser. O proxy faz a ponte.
    
    const targetUrl = 'https://api.resend.com/emails';
    const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(targetUrl);

    try {
      console.log(`Sending Email via Resend Proxy to ${userEmail}`);
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer re_Yb7BKpid_EdiTN1pb6J8w8y3YyTPUDUvz'
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: userEmail,
          subject: subject,
          html: body
        })
      });

      if (response.ok) {
        console.log('Resend Email Sent Successfully');
      } else {
        const err = await response.text();
        console.warn('Resend API Error:', err);
      }
    } catch (e) {
      console.error('Failed to send email:', e);
    }
  };

  const sendSMSNotification = async (userPhone: string) => {
    if (!userPhone) return;

    let cleanNumber = userPhone.replace(/\D/g, '');
    if (cleanNumber.startsWith('258') && cleanNumber.length > 9) {
      cleanNumber = cleanNumber.substring(3);
    }
    
    const message = t('sms_active_msg');
    const url = `https://app.yezosms.com/api?username=colddimas1@gmail.com&password=f87766ab5b8ff18287a2b66747193ac9fd53ad3f&message=${encodeURIComponent(message)}&to=258${cleanNumber}&from=INFOMSG&messageid=100023`;
    
    try {
      // SOLUÇÃO CORS: Usando mode: 'no-cors'
      // O navegador vai enviar a requisição (fire and forget), mas a resposta virá "opaca".
      // Não tente ler response.text() ou response.json(), pois isso causa o TypeError no modo no-cors.
      await fetch(url, { mode: 'no-cors' });
      console.log(`SMS Request Triggered (Opaque Response)`);
    } catch (error: any) {
      console.warn('SMS Network Error:', error.message);
    }
  };

  // --- ACTIONS ---

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('O arquivo deve ter no máximo 5MB.');
        return;
      }

      setIsSaving(true);
      
      // Sanitizando o nome do arquivo para evitar Erro 400 (Bad Request)
      // Remove caracteres especiais, espaços, etc.
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '');
      const fileExt = cleanFileName.split('.').pop();
      
      // Nome único e seguro
      const fileName = `${session.user.id}/avatar_${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error("Upload Error:", uploadError);
        if (uploadError.message.includes("row-level security")) {
            throw new Error("Erro de Permissão: O Supabase bloqueou o upload. Vá em 'Storage' > 'Policies' e permita INSERT/UPDATE.");
        }
        throw uploadError;
      }

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setProfile(prev => ({ ...prev, photoUrl: publicUrl }));
      
      // Update User Metadata immediately
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) throw updateError;

      setSaveMessage('Foto atualizada!');
      setTimeout(() => setSaveMessage(''), 3000);

    } catch (error: any) {
      alert('Erro ao fazer upload: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      alert(`Email de redefinição enviado para ${profile.email}`);
    } catch (error: any) {
      alert('Erro: ' + error.message);
    }
  };

  const updateSettings = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      const { error } = await supabase.auth.updateUser({
        email: profile.email,
        data: {
          full_name: profile.fullName,
          phone_number: profile.phone,
          notifications: notifications,
          language: language
        }
      });

      if (error) throw error;

      if (notifications.email !== prevNotificationsRef.current.email) {
        await sendEmailNotification(notifications.email, profile.email);
      }

      if (notifications.sms && !prevNotificationsRef.current.sms) {
        await sendSMSNotification(profile.phone);
      }

      prevNotificationsRef.current = notifications;

      setSaveMessage(t('saved_success'));
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error: any) {
      alert("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirmationName !== profile.fullName) {
      alert("O nome digitado não corresponde ao seu perfil.");
      return;
    }

    try {
      alert("Solicitação enviada. Sua conta será desativada em breve.");
      await supabase.auth.signOut();
      onLogout();
    } catch (error: any) {
      alert("Erro ao excluir: " + error.message);
    }
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const product = {
      id: products.length + 1,
      name: newProduct.name,
      price: Number(newProduct.price),
      sales: 0,
      revenue: 0,
      link: `payeasy.co.mz/p/${Math.random().toString(36).substr(2, 6)}`
    };
    setProducts([product, ...products]);
    setNewProduct({ name: '', price: '', description: '' });
    setShowProductModal(false);
  };

  const NavItem = ({ tab, icon: Icon, label }: { tab: Tab, icon: any, label: string }) => (
    <button
      onClick={() => { setActiveTab(tab); setMobileMenuOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
        activeTab === tab 
          ? 'bg-brand-50 text-brand-600' 
          : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      <Icon size={20} />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
              <Wallet size={18} />
            </div>
            <span className="text-xl font-bold text-slate-900">Pay<span className="text-brand-500">Easy</span></span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem tab="overview" icon={LayoutDashboard} label={t('overview')} />
          <NavItem tab="products" icon={ShoppingBag} label={t('products')} />
          <NavItem tab="settings" icon={Settings} label={t('settings')} />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold overflow-hidden border border-brand-200 relative">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                profile.fullName.charAt(0)
              )}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-bold text-slate-900 truncate">{profile.fullName}</div>
              <div className="text-xs text-slate-500 truncate">{profile.email}</div>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-20 flex items-center justify-between px-4">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
              <Wallet size={18} />
            </div>
            <span className="text-xl font-bold text-slate-900">Pay<span className="text-brand-500">Easy</span></span>
         </div>
         <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-600">
           {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
         </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-slate-900/50 z-10" onClick={() => setMobileMenuOpen(false)}></div>
      )}
      <aside className={`lg:hidden fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-slate-200 z-20 transform transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <nav className="p-4 space-y-2">
          <NavItem tab="overview" icon={LayoutDashboard} label={t('overview')} />
          <NavItem tab="products" icon={ShoppingBag} label={t('products')} />
          <NavItem tab="settings" icon={Settings} label={t('settings')} />
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100 bg-white">
           <button onClick={onLogout} className="flex items-center gap-2 text-red-500 w-full p-2">
             <LogOut size={18} /> Sair
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 mt-16 lg:mt-0 overflow-y-auto">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{t('overview')}</h1>
              <p className="text-slate-500">{t('welcome')}, {profile.fullName}. {t('subtitle_overview')}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <DollarSign size={20} />
                  </div>
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
                </div>
                <div className="text-3xl font-bold text-slate-900">162.500 MT</div>
                <div className="text-sm text-slate-500">{t('total_revenue')}</div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600">
                    <ShoppingBag size={20} />
                  </div>
                  <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-1 rounded-full">+5</span>
                </div>
                <div className="text-3xl font-bold text-slate-900">157</div>
                <div className="text-sm text-slate-500">{t('sales_made')}</div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                    <Users size={20} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900">2</div>
                <div className="text-sm text-slate-500">{t('active_products')}</div>
              </div>
            </div>

            {/* Recent Activity / Chart Simulation */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-slate-900">{t('recent_sales')}</h3>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 text-xs text-slate-500"><div className="w-3 h-3 bg-brand-500 rounded-full"></div> M-Pesa</div>
                  <div className="flex items-center gap-1 text-xs text-slate-500"><div className="w-3 h-3 bg-slate-300 rounded-full"></div> Emola</div>
                </div>
              </div>
              
              <div className="h-64 flex items-end justify-between gap-2 px-2">
                {[40, 65, 30, 85, 50, 95, 60].map((height, i) => (
                  <div key={i} className="w-full bg-slate-100 rounded-t-lg relative group">
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-brand-500 rounded-t-lg transition-all duration-500 group-hover:bg-brand-400"
                      style={{ height: `${height}%` }}
                    ></div>
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded pointer-events-none transition-opacity">
                      {height * 100} MT
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-400 font-medium uppercase">
                <span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sab</span><span>Dom</span>
              </div>
            </div>

            {/* Recent Transactions List */}
             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="font-bold text-lg text-slate-900">{t('recent_transactions')}</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {[
                    { customer: "Ana Silva", product: "Ebook Receitas", amount: "500 MT", time: "2 min atrás", method: "M-Pesa" },
                    { customer: "Carlos Mondlane", product: "Curso Marketing", amount: "2.500 MT", time: "1 hora atrás", method: "M-Pesa" },
                    { customer: "Berta Langa", product: "Curso Marketing", amount: "2.500 MT", time: "3 horas atrás", method: "Emola" },
                  ].map((tx, i) => (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                             {tx.customer.charAt(0)}
                          </div>
                          <div>
                             <div className="text-sm font-bold text-slate-900">{tx.customer}</div>
                             <div className="text-xs text-slate-500">{tx.product} • {tx.time}</div>
                          </div>
                       </div>
                       <div className="text-right">
                          <div className="text-sm font-bold text-brand-600">{tx.amount}</div>
                          <div className="text-[10px] uppercase text-slate-400">{tx.method}</div>
                       </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{t('your_products')}</h1>
                <p className="text-slate-500">{t('manage_products')}</p>
              </div>
              <button 
                onClick={() => setShowProductModal(true)}
                className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-200 transition-all"
              >
                <Plus size={20} /> {t('new_product')}
              </button>
            </div>

            {products.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
                <ShoppingBag size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">{t('no_products')}</h3>
                <p className="text-slate-500 mb-6">{t('manage_products')}</p>
                <button 
                  onClick={() => setShowProductModal(true)}
                  className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors"
                >
                  {t('create_product')}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-4 font-semibold text-sm text-slate-600">{t('product_name')}</th>
                        <th className="p-4 font-semibold text-sm text-slate-600">{t('price')}</th>
                        <th className="p-4 font-semibold text-sm text-slate-600">Vendas</th>
                        <th className="p-4 font-semibold text-sm text-slate-600">Receita</th>
                        <th className="p-4 font-semibold text-sm text-slate-600 text-right">{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-slate-900">{p.name}</div>
                          </td>
                          <td className="p-4 text-slate-600 font-medium">{p.price} MT</td>
                          <td className="p-4 text-slate-600">{p.sales}</td>
                          <td className="p-4 font-bold text-green-600">{p.revenue.toLocaleString()} MT</td>
                          <td className="p-4 text-right">
                             <div className="flex items-center justify-end gap-2">
                               <button 
                                onClick={() => navigator.clipboard.writeText(p.link)}
                                className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Copiar Link"
                               >
                                 <Copy size={18} />
                               </button>
                               <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                                 <Settings size={18} />
                               </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fadeIn max-w-4xl pb-10">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{t('settings_title')}</h1>
              <p className="text-slate-500">{t('settings_subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column - Menu */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Edit Profile */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                   <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                     <Users size={20} className="text-brand-600"/> {t('public_profile')}
                   </h3>
                   
                   <div className="flex items-center gap-6 mb-6">
                      <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-3xl font-bold text-slate-500 overflow-hidden relative border border-slate-200">
                        {profile.photoUrl ? (
                          <img src={profile.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          profile.fullName.charAt(0)
                        )}
                        {isSaving && <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}
                      </div>
                      <div>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/png, image/jpeg, image/gif"
                          onChange={handlePhotoUpload}
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors text-sm flex items-center gap-2"
                        >
                          <Upload size={16} /> {t('change_photo')}
                        </button>
                        <p className="text-xs text-slate-400 mt-2">{t('photo_help')}</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">{t('full_name')}</label>
                        <input 
                          type="text" 
                          value={profile.fullName}
                          onChange={(e) => setProfile({...profile, fullName: e.target.value})}
                          className="w-full p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">{t('phone')}</label>
                        <input 
                          type="text" 
                          value={profile.phone}
                          onChange={(e) => setProfile({...profile, phone: e.target.value})}
                          className="w-full p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                      </div>
                   </div>
                   <div className="mb-4">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                      <input 
                        type="email" 
                        value={profile.email}
                        onChange={(e) => setProfile({...profile, email: e.target.value})}
                        className="w-full p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                   </div>
                   
                   <div className="pt-4 border-t border-slate-100 mt-4">
                     <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><Lock size={16}/> {t('change_password')}</h4>
                     <button 
                       onClick={handlePasswordReset}
                       className="text-brand-600 text-sm font-medium hover:underline"
                     >
                       {t('send_reset_email')}
                     </button>
                   </div>
                </div>

                {/* 2. Notifications */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                   <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                     <Bell size={20} className="text-brand-600"/> {t('notifications')}
                   </h3>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <div>
                           <div className="font-medium text-slate-900">{t('email_marketing')}</div>
                           <div className="text-xs text-slate-500">{t('email_marketing_desc')}</div>
                         </div>
                         <label className="relative inline-flex items-center cursor-pointer">
                           <input type="checkbox" checked={notifications.email} onChange={(e) => setNotifications({...notifications, email: e.target.checked})} className="sr-only peer" />
                           <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                         </label>
                      </div>
                      <div className="flex items-center justify-between">
                         <div>
                           <div className="font-medium text-slate-900">{t('push_notif')}</div>
                           <div className="text-xs text-slate-500">{t('push_notif_desc')}</div>
                         </div>
                         <label className="relative inline-flex items-center cursor-pointer">
                           <input type="checkbox" checked={notifications.push} onChange={(e) => setNotifications({...notifications, push: e.target.checked})} className="sr-only peer" />
                           <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                         </label>
                      </div>
                      <div className="flex items-center justify-between">
                         <div>
                           <div className="font-medium text-slate-900">{t('sms_sales')}</div>
                           <div className="text-xs text-slate-500">{t('sms_sales_desc')}</div>
                         </div>
                         <label className="relative inline-flex items-center cursor-pointer">
                           <input type="checkbox" checked={notifications.sms} onChange={(e) => setNotifications({...notifications, sms: e.target.checked})} className="sr-only peer" />
                           <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                         </label>
                      </div>
                   </div>
                </div>

                {/* 3. Real Time Connected Device */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                     <Monitor size={20} className="text-brand-600"/> {t('connected_devices')}
                   </h3>
                   <div className="space-y-4">
                      {/* Current Device - Real Time */}
                      <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-brand-50/50 rounded-xl border border-brand-100 gap-4">
                        <div className="flex items-center gap-4 w-full">
                           <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                             <Globe size={20} />
                           </div>
                           <div className="min-w-0">
                             <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                               {deviceInfo.browser} no {deviceInfo.os}
                               <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full uppercase tracking-wider">{t('current')}</span>
                             </div>
                             <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-2">
                               {deviceInfo.city && deviceInfo.country ? (
                                 <span>{deviceInfo.city}, {deviceInfo.country}</span>
                               ) : (
                                 <span>{t('location')}: Detectando...</span>
                               )}
                               <span>•</span>
                               <span>IP: {deviceInfo.ip}</span>
                             </div>
                           </div>
                        </div>
                        
                        <button 
                          onClick={onLogout}
                          className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors shrink-0"
                        >
                          {t('logout_device')}
                        </button>
                      </div>

                      <p className="text-xs text-slate-400 text-center">
                        Esta é a sessão ativa neste momento. Para segurança, você pode encerrar esta sessão acima.
                      </p>
                   </div>
                </div>

              </div>

              {/* Right Column - Preferences & Actions */}
              <div className="space-y-6">
                
                {/* Save Button Sticky */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-4 z-10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-900">{t('actions')}</h3>
                      {saveMessage && <span className="text-xs text-green-600 font-bold animate-pulse">{saveMessage}</span>}
                    </div>
                    
                    <button 
                      onClick={updateSettings}
                      disabled={isSaving}
                      className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      {t('save_changes')}
                    </button>
                </div>

                {/* Language */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                   <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                     <Globe size={20} className="text-brand-600"/> {t('language')}
                   </h3>
                   <select 
                     value={language}
                     onChange={(e) => setLanguage(e.target.value as Language)}
                     className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                   >
                     <option value="pt-MZ">Português (Moçambique)</option>
                     <option value="en-US">English (US)</option>
                     <option value="es">Español</option>
                   </select>
                </div>

                {/* Delete Account */}
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                   <h3 className="text-lg font-bold text-red-700 mb-2 flex items-center gap-2">
                     <Trash2 size={20}/> {t('danger_zone')}
                   </h3>
                   <p className="text-xs text-red-600/80 mb-4 leading-relaxed">
                     {t('danger_desc')}
                   </p>
                   <button 
                     onClick={() => setShowDeleteModal(true)}
                     className="w-full py-2 bg-white border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-100 transition-colors text-sm"
                   >
                     {t('delete_account')}
                   </button>
                </div>

              </div>

            </div>
          </div>
        )}
      </main>

      {/* CREATE PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl transform transition-all scale-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Novo Produto Digital</h2>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{t('product_name')}</label>
                <input 
                  type="text" 
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                  placeholder="Ex: Ebook de Receitas"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{t('price')} (MT)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400 font-bold">MT</span>
                  <input 
                    type="number" 
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{t('description')}</label>
                <textarea 
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500 resize-none"
                  placeholder="Descreva seu produto..."
                ></textarea>
              </div>

              <button type="submit" className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors">
                {t('create_and_generate')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl transform transition-all scale-100 border border-red-100">
             <div className="flex items-center gap-3 mb-4 text-red-600">
               <AlertTriangle size={32} />
               <h2 className="text-xl font-bold text-slate-900">{t('delete_modal_title')}</h2>
             </div>
             
             <p className="text-slate-600 mb-6">
               {t('delete_modal_desc')} <span className="font-bold text-slate-900">{profile.fullName}</span>.
             </p>

             <input 
               type="text" 
               value={deleteConfirmationName}
               onChange={(e) => setDeleteConfirmationName(e.target.value)}
               className="w-full p-3 mb-6 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
               placeholder={profile.fullName}
             />

             <div className="flex gap-3">
               <button 
                 onClick={() => { setShowDeleteModal(false); setDeleteConfirmationName(''); }}
                 className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors"
               >
                 {t('cancel')}
               </button>
               <button 
                 onClick={deleteAccount}
                 disabled={deleteConfirmationName !== profile.fullName}
                 className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {t('confirm_delete')}
               </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;