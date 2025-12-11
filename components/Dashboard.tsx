import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Settings, 
  Plus, 
  Copy, 
  Wallet,
  Menu,
  X,
  Loader2,
  Edit3,
  ExternalLink,
  Link as LinkIcon,
  Save,
  Trash2,
  Image as ImageIcon,
  Search,
  UploadCloud,
  TrendingUp,
  X as XIcon,
  Bell,
  Activity,
  Sparkles
} from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { GoogleGenAI } from "@google/genai";

type Tab = 'overview' | 'products' | 'links' | 'sales' | 'settings';
type ProductStatus = 'draft' | 'analyzing' | 'active' | 'rejected';
type ProductCategory = 'ebooks' | 'cursos' | 'mentoria' | 'software' | 'audio' | 'templates' | 'outros';
type PaymentMethod = 'mpesa' | 'emola';
type SaleStatus = 'approved' | 'pending' | 'cancelled';
type DateRange = 'today' | '7days' | '30days' | 'year' | 'all';

interface DashboardProps {
  session: Session;
  onLogout: () => void;
  initialTab?: Tab;
}

interface Product {
  id: string;
  user_id: string;
  name: string;
  category: ProductCategory;
  subcategory: string;
  description: string;
  price: number;
  whatsapp: string;
  status: ProductStatus;
  is_limited_time: boolean;
  image_url: string | null;
  has_offer: boolean;
  offer_title: string;
  offer_price: number;
  redemption_link: string;
  sales_count: number;
  total_revenue: number;
  views_count?: number;
  created_at: string;
}

interface PaymentLink {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  url: string;
  created_at: string;
}

interface Sale {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  amount: number;
  fee: number;
  status: SaleStatus;
  payment_method: PaymentMethod;
  created_at: string;
}

interface AppNotification {
    id: string;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
}

const Dashboard: React.FC<DashboardProps> = ({ session, onLogout, initialTab = 'overview' }) => {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const productImageInputRef = useRef<HTMLInputElement>(null);

  // Notification State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Date Filtering State
  const [dateRange, setDateRange] = useState<DateRange>('7days');

  // User Profile
  const initialMeta = session.user.user_metadata || {};
  const [profile] = useState({
    fullName: initialMeta.full_name || 'Empreendedor',
  });

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Link State
  const [selectedProductIdForLink, setSelectedProductIdForLink] = useState('');
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  
  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  
  // Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{
      isOpen: boolean;
      type: 'product' | 'link' | null;
      id: string | null;
      title: string;
  }>({ isOpen: false, type: null, id: null, title: '' });
  
  const [productFormStep, setProductFormStep] = useState(1);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New Product Form
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    category: 'ebooks',
    subcategory: '',
    description: '',
    price: 0,
    whatsapp: '',
    status: 'draft',
    is_limited_time: false,
    image_url: null,
    has_offer: false,
    offer_title: '',
    offer_price: 0,
    redemption_link: '',
  });

  const fetchNotifications = async () => {
      const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20);
      if (data) {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.read).length);
      }
  };

  const markNotificationsRead = async () => {
      await supabase.from('notifications').update({ read: true }).eq('read', false);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
  };

  const addNotificationToDB = async (title: string, message: string) => {
      try {
          await supabase.from('notifications').insert({
              user_id: session.user.id,
              title,
              message
          });
      } catch (e) {
          console.error("Failed to persist notification", e);
      }
  };

  const getFilteredSales = () => {
    const now = new Date();
    let result = sales;

    // Filter by Date
    result = result.filter(sale => {
      const saleDate = new Date(sale.created_at);
      if (dateRange === 'today') return saleDate.getDate() === now.getDate() && saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
      if (dateRange === '7days') { const d = new Date(); d.setDate(now.getDate() - 7); return saleDate >= d; }
      if (dateRange === '30days') { const d = new Date(); d.setDate(now.getDate() - 30); return saleDate >= d; }
      if (dateRange === 'year') return saleDate.getFullYear() === now.getFullYear();
      return true;
    });

    // Filter by Search Query (ID)
    if (searchQuery) {
        result = result.filter(s => s.id.toLowerCase().includes(searchQuery.toLowerCase()) || s.product_name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return result;
  };

  const filteredSales = useMemo(() => getFilteredSales(), [sales, dateRange, searchQuery]);
  const filteredApprovedSales = filteredSales.filter(s => s.status === 'approved');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const calculateGrossRevenue = (salesData: Sale[]) => {
      return salesData.filter(s => s.status === 'approved').reduce((acc, curr) => acc + curr.amount, 0);
  };

  const calculateCVR = () => {
      const totalViews = products.reduce((acc, p) => acc + (p.views_count || 0), 0);
      const totalApprovedSales = sales.filter(s => s.status === 'approved').length;
      if (totalViews === 0) return 0;
      return ((totalApprovedSales / totalViews) * 100).toFixed(1);
  };

  const changeTab = (tab: Tab) => {
      if (tab === activeTab) return;
      setIsTabLoading(true);
      setActiveTab(tab);
      setMobileMenuOpen(false);
      try { window.history.pushState({}, '', `/dashboard/${tab}`); } catch (e) {}
      setTimeout(() => { setIsTabLoading(false); }, 600);
  };

  const fetchData = async () => {
    try {
        const { data: salesData } = await supabase.from('sales').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
        if (salesData) setSales(salesData);

        const { data: productsData } = await supabase.from('products').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
        if (productsData) setProducts(productsData);

        const { data: linksData } = await supabase.from('payment_links').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
        if (linksData) setPaymentLinks(linksData);
    } catch (e) {
        console.error("Error fetching data", e);
    }
  };

  useEffect(() => {
    const initialLoad = async () => {
        setLoading(true);
        await fetchData();
        await fetchNotifications();
        setLoading(false);
    };
    initialLoad();

    const intervalId = setInterval(() => { fetchData(); }, 2000); 
    
    // Realtime Subscriptions
    const channel = supabase.channel('dashboard_updates')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `user_id=eq.${session.user.id}` }, () => fetchData())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
             const newNotif = payload.new as AppNotification;
             setNotifications(prev => [newNotif, ...prev]);
             setUnreadCount(prev => prev + 1);
        }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'sales', filter: `user_id=eq.${session.user.id}` }, (payload) => {
         if (payload.eventType === 'INSERT') {
             const newSale = payload.new as Sale;
             setSales(prev => [newSale, ...prev]);
             if (newSale.status === 'approved') {
                 addNotificationToDB("Venda Aprovada!", `Venda de ${newSale.product_name} no valor de ${newSale.amount} MT confirmada. ID: ${newSale.id.slice(0,8)}`);
             }
         } else if (payload.eventType === 'UPDATE') {
             const updatedSale = payload.new as Sale;
             setSales(prev => prev.map(s => s.id === updatedSale.id ? updatedSale : s));
             if (updatedSale.status === 'approved' && (payload.old as Sale)?.status !== 'approved') {
                 addNotificationToDB("Pagamento Confirmado", `A venda #${updatedSale.id.slice(0,8)} foi aprovada.`);
             }
         }
    })
    .subscribe();

    return () => { 
        supabase.removeChannel(channel); 
        clearInterval(intervalId);
    };
  }, []);

  const generateLink = async (prodId?: string) => {
    const targetId = prodId || selectedProductIdForLink;
    if (!targetId) return;
    setIsCreatingLink(true);
    try {
        const product = products.find(p => p.id === targetId);
        if (!product) throw new Error("Produto não encontrado");
        const baseUrl = window.location.origin;
        const newLinkPayload = { user_id: session.user.id, product_id: product.id, product_name: product.name, url: 'Gerando link...' };
        const { data, error } = await supabase.from('payment_links').insert([newLinkPayload]).select();
        if (error) throw error;
        const createdLink = data[0]; 
        const finalUrl = `${baseUrl}/p/${product.id}?ref=${createdLink.id}`;
        await supabase.from('payment_links').update({ url: finalUrl }).eq('id', createdLink.id);
        const finalLinkObject = { ...createdLink, url: finalUrl };
        await new Promise(resolve => setTimeout(resolve, 1500));
        setPaymentLinks(prev => [finalLinkObject, ...prev]);
        setSelectedProductIdForLink('');
        if (activeTab !== 'links') changeTab('links');
    } catch (e: any) {
        if (!e.message.includes("permissões")) alert("Erro ao gerar link: " + e.message);
    } finally { setIsCreatingLink(false); }
  };
  
  const openDeleteModal = (type: 'product' | 'link', id: string, name: string) => setDeleteModal({ isOpen: true, type, id, title: name });
  
  const handleOpenNewProduct = () => { setNewProduct({ name: '', category: 'ebooks', description: '', price: 0, status: 'draft', is_limited_time: false, image_url: null, has_offer: false, redemption_link: '' }); setEditingId(null); setProductFormStep(1); setShowProductModal(true); };
  const handleEditProduct = (product: Product) => { setNewProduct({ ...product }); setEditingId(product.id); setProductFormStep(1); setShowProductModal(true); };
  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => setNewProduct(p => ({ ...p, image_url: ev.target?.result as string })); reader.readAsDataURL(file); }};
  const saveProduct = async (requestedStatus: ProductStatus = 'draft') => {
    if (!newProduct.name || !newProduct.price) return alert("Nome e Preço obrigatórios.");
    setIsSavingProduct(true);
    try {
        const finalStatus = requestedStatus === 'active' ? 'analyzing' : requestedStatus;
        const payload = { user_id: session.user.id, ...newProduct, status: finalStatus };
        if (editingId) { await supabase.from('products').update(payload).eq('id', editingId); setProducts(prev => prev.map(p => p.id === editingId ? { ...p, ...payload } as Product : p)); } 
        else { const { data } = await supabase.from('products').insert([payload]).select(); if (data) setProducts(prev => [data[0] as Product, ...prev]); }
        setShowProductModal(false);
        if (finalStatus === 'analyzing') setTimeout(async () => { await supabase.from('products').update({ status: 'active' }).eq('name', newProduct.name); fetchData(); }, 3000);
    } catch (e: any) { alert("Erro: " + e.message); } finally { setIsSavingProduct(false); }
  };
  const handleGenerateDescriptionAI = async () => {
    if (!newProduct.name) return alert("Digite o nome do produto primeiro.");
    setIsGeneratingAI(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const result = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: `Atue como um especialista em Copywriting... Produto: "${newProduct.name}". Categoria: ${newProduct.category}. Público: Moçambique.` });
        if (result.text) setNewProduct(p => ({ ...p, description: result.text!.trim() }));
    } catch (e) { alert("IA indisponível no momento."); } finally { setIsGeneratingAI(false); }
  };

  const renderSimpleChart = () => {
    const daysToShow = dateRange === 'today' ? 24 : dateRange === '7days' ? 7 : 12;
    const dataPoints = [];
    for (let i = 0; i < daysToShow; i++) {
        const date = new Date();
        if (dateRange === 'today') {
           date.setHours(date.getHours() - (daysToShow - 1 - i));
           const amount = sales.filter(s => s.status === 'approved' && new Date(s.created_at).getHours() === date.getHours() && new Date(s.created_at).toDateString() === new Date().toDateString()).reduce((acc, curr) => acc + curr.amount, 0);
           dataPoints.push({ label: `${date.getHours()}h`, value: amount });
        } else {
           date.setDate(date.getDate() - (daysToShow - 1 - i));
           const amount = sales.filter(s => s.status === 'approved' && new Date(s.created_at).toDateString() === date.toDateString()).reduce((acc, curr) => acc + curr.amount, 0);
           dataPoints.push({ label: date.toLocaleDateString('pt-MZ', { day: '2-digit' }), value: amount });
        }
    }
    const maxValue = Math.max(...dataPoints.map(d => d.value), 100);
    const height = 200;
    const width = 800;
    const padding = 20;
    const chartW = width - (padding * 2);
    const chartH = height - (padding * 2);
    const points = dataPoints.map((d, i) => `${padding + (i / (dataPoints.length - 1)) * chartW},${height - padding - (d.value / maxValue) * chartH}`).join(' ');

    return (
        <div className="relative h-64 w-full bg-white rounded-lg p-6 border border-slate-200">
             <div className="flex justify-between items-start mb-4">
                 <div>
                    <h3 className="text-slate-800 font-bold text-lg flex items-center gap-2">
                         Receita
                    </h3>
                 </div>
                 <div className="text-right">
                     <div className="text-2xl font-bold text-slate-900">
                         {filteredApprovedSales.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()} MT
                     </div>
                 </div>
             </div>

             <div className="flex-1 w-full min-h-0 relative">
                 <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                     <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1" />
                     <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                     {dataPoints.map((d, i) => {
                         const x = padding + (i / (dataPoints.length - 1)) * chartW;
                         const y = height - padding - (d.value / maxValue) * chartH;
                         return (
                             <circle key={i} cx={x} cy={y} r="3" fill="#3b82f6" />
                         );
                     })}
                 </svg>
             </div>
             <div className="flex justify-between mt-2 px-1">
                 {dataPoints.filter((_, i) => i % Math.ceil(dataPoints.length / 6) === 0).map((d, i) => (
                     <span key={i} className="text-xs text-slate-400 font-medium">{d.label}</span>
                 ))}
             </div>
        </div>
    );
  };

  const getStatusBadge = (status: ProductStatus) => {
      switch (status) {
          case 'active': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase">Ativo</span>;
          case 'analyzing': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase flex items-center gap-1"><Loader2 size={10} className="animate-spin"/> Análise</span>;
          case 'draft': return <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold uppercase">Rascunho</span>;
          case 'rejected': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold uppercase">Recusado</span>;
          default: return <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs font-bold uppercase">{status}</span>;
      }
  };

  const getProductStats = (productId: string) => {
      const productSales = sales.filter(s => s.product_id === productId && s.status === 'approved');
      const count = productSales.length;
      const revenue = productSales.reduce((acc, curr) => acc + curr.amount, 0);
      return { count, revenue };
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
             <div className="lg:hidden p-2 bg-slate-50 rounded-lg text-slate-600" onClick={() => setMobileMenuOpen(true)}>
                 <Menu size={24}/>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
                  <Wallet size={18} />
                </div>
                <div className="hidden md:block">
                    <span className="block text-lg font-bold text-slate-900">Pay<span className="text-brand-600">Easy</span></span>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-6">
              <div className="relative">
                  <button 
                     className="relative p-2 text-slate-500 hover:text-brand-600 transition-colors"
                     onClick={() => { setShowNotificationsDropdown(!showNotificationsDropdown); if(unreadCount > 0) markNotificationsRead(); }}
                  >
                      <Bell size={20} />
                      {unreadCount > 0 && (
                          <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                      )}
                  </button>
                  {showNotificationsDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50">
                          <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                              <h4 className="font-bold text-slate-900 text-sm">Notificações</h4>
                              <button className="text-xs text-brand-600 font-bold hover:underline" onClick={() => setShowNotificationsDropdown(false)}>Fechar</button>
                          </div>
                          <div className="max-h-80 overflow-y-auto">
                              {notifications.length === 0 ? (
                                  <div className="p-4 text-center text-slate-400 text-sm">Sem notificações.</div>
                              ) : (
                                  notifications.map((notif) => (
                                      <div key={notif.id} className={`p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-blue-50/50' : ''}`}>
                                          <div className="flex justify-between items-start mb-1">
                                              <span className="font-bold text-slate-800 text-sm">{notif.title}</span>
                                              <span className="text-[10px] text-slate-400">{new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                          </div>
                                          <p className="text-xs text-slate-500 leading-relaxed">{notif.message}</p>
                                      </div>
                                  ))
                              )}
                          </div>
                      </div>
                  )}
              </div>

              <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
                  <div className="text-right hidden md:block">
                      <p className="text-sm font-bold text-slate-900">{profile.fullName.split(' ')[0]}</p>
                      <button onClick={onLogout} className="text-xs text-slate-400 hover:text-red-500">Sair</button>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 overflow-hidden">
                      <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-sm">
                          {profile.fullName.charAt(0)}
                      </div>
                  </div>
              </div>
          </div>
      </header>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)}>
              <div className="absolute left-0 top-0 bottom-0 w-64 bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-8">
                       <span className="text-xl font-bold">Menu</span>
                       <button onClick={() => setMobileMenuOpen(false)}><XIcon size={24}/></button>
                  </div>
                  <nav className="space-y-2">
                      {[
                        { id: 'overview', icon: LayoutDashboard, label: 'Visão Geral' },
                        { id: 'sales', icon: TrendingUp, label: 'Vendas' },
                        { id: 'products', icon: ShoppingBag, label: 'Produtos' },
                        { id: 'links', icon: LinkIcon, label: 'Links' },
                        { id: 'settings', icon: Settings, label: 'Configurações' },
                      ].map((item) => (
                        <button key={item.id} onClick={() => changeTab(item.id as Tab)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm ${activeTab === item.id ? 'bg-brand-50 text-brand-600' : 'text-slate-600'}`}>
                            <item.icon size={18}/> {item.label}
                        </button>
                      ))}
                  </nav>
              </div>
          </div>
      )}

      {/* MAIN CONTENT */}
      <main className="pt-24 pb-12 px-4 md:px-8 max-w-[1200px] mx-auto">
          {activeTab === 'overview' && (
              <div className="space-y-6">
                  <div className="flex justify-between items-center">
                      <div>
                          <h1 className="text-2xl font-bold text-slate-900">
                              {getGreeting()}, {profile.fullName.split(' ')[0]}
                          </h1>
                          <p className="text-slate-500">
                              Resumo das suas vendas
                          </p>
                      </div>
                      
                      <div className="flex gap-2">
                          <select 
                            value={dateRange} 
                            onChange={(e) => setDateRange(e.target.value as DateRange)}
                            className="bg-white border border-slate-200 text-slate-700 py-2 px-4 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                          >
                              <option value="today">Hoje</option>
                              <option value="7days">7 dias</option>
                              <option value="30days">30 dias</option>
                              <option value="all">Todo Período</option>
                          </select>
                          <button onClick={() => handleOpenNewProduct()} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-slate-800 transition-colors flex items-center gap-2">
                              <Plus size={16}/> <span className="hidden sm:inline">Criar</span>
                          </button>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                      <div className="bg-white p-5 rounded-lg border border-slate-200">
                          <div className="flex justify-between items-start mb-2">
                              <div className="text-slate-500 text-sm font-medium">Receita Bruta</div>
                              <Wallet size={18} className="text-slate-400"/>
                          </div>
                          <div className="text-2xl font-bold text-slate-900">{calculateGrossRevenue(filteredSales).toLocaleString()} MT</div>
                      </div>

                      <div className="bg-white p-5 rounded-lg border border-slate-200">
                           <div className="flex justify-between items-start mb-2">
                              <div className="text-slate-500 text-sm font-medium">Vendas Aprovadas</div>
                              <ShoppingBag size={18} className="text-slate-400"/>
                          </div>
                          <div className="text-2xl font-bold text-slate-900">{filteredApprovedSales.length}</div>
                      </div>

                      <div className="bg-white p-5 rounded-lg border border-slate-200">
                           <div className="flex justify-between items-start mb-2">
                              <div className="text-slate-500 text-sm font-medium">Conversão</div>
                              <Activity size={18} className="text-slate-400"/>
                          </div>
                          <div className="text-2xl font-bold text-slate-900">{calculateCVR()}%</div>
                      </div>

                      <div className="bg-white p-5 rounded-lg border border-slate-200">
                           <div className="flex justify-between items-start mb-2">
                              <div className="text-slate-500 text-sm font-medium">Canceladas</div>
                              <XIcon size={18} className="text-slate-400"/>
                          </div>
                          <div className="text-2xl font-bold text-slate-900">{filteredSales.filter(s => s.status === 'cancelled').length}</div>
                      </div>
                  </div>

                  {renderSimpleChart()}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 overflow-hidden">
                          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                              <h3 className="font-bold text-slate-900">Transações Recentes</h3>
                              <button onClick={() => changeTab('sales')} className="text-sm text-brand-600 font-medium hover:underline">Ver todas</button>
                          </div>
                          <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                  <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                      <tr>
                                          <th className="p-3 pl-4">Produto</th>
                                          <th className="p-3">Cliente</th>
                                          <th className="p-3">Valor</th>
                                          <th className="p-3">Status</th>
                                      </tr>
                                  </thead>
                                  <tbody className="text-sm">
                                      {filteredSales.slice(0, 5).map(sale => (
                                          <tr key={sale.id} className="border-b border-slate-50 hover:bg-slate-50">
                                              <td className="p-3 pl-4 font-medium text-slate-900">{sale.product_name}</td>
                                              <td className="p-3 text-slate-600">{sale.customer_name}</td>
                                              <td className="p-3 font-bold text-slate-900">{sale.amount.toLocaleString()} MT</td>
                                              <td className="p-3">
                                                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                      sale.status === 'approved' ? 'bg-green-100 text-green-700' : 
                                                      sale.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                                                      'bg-red-100 text-red-700'
                                                  }`}>
                                                      {sale.status === 'approved' ? 'Pago' : sale.status === 'pending' ? 'Pendente' : 'Cancelado'}
                                                  </span>
                                              </td>
                                          </tr>
                                      ))}
                                      {filteredSales.length === 0 && (
                                          <tr><td colSpan={4} className="p-6 text-center text-slate-400 text-sm">Nenhuma venda encontrada.</td></tr>
                                      )}
                                  </tbody>
                              </table>
                          </div>
                      </div>

                      <div className="lg:col-span-1 bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">
                          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                              <h3 className="font-bold text-slate-900 text-sm">Feed ao Vivo</h3>
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          </div>
                          <div className="flex-1 overflow-y-auto max-h-[400px] p-2 space-y-2">
                              {sales.slice(0, 10).map((sale) => (
                                  <div key={sale.id} className="p-3 rounded border border-slate-100 hover:bg-slate-50">
                                      <div className="flex justify-between items-center mb-1">
                                          <span className="text-xs font-bold text-slate-800 line-clamp-1">{sale.product_name}</span>
                                          <span className="text-xs font-bold text-green-600">{sale.amount}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                          <span className="text-[10px] text-slate-400 uppercase">{sale.payment_method}</span>
                                          <span className="text-[10px] text-slate-400">#{sale.id.slice(0,4)}</span>
                                      </div>
                                  </div>
                              ))}
                              {sales.length === 0 && (
                                  <div className="text-center p-4 text-xs text-slate-400">Sem atividade recente.</div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'products' && (
             <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                   <h1 className="text-2xl font-bold text-slate-900">Meus Produtos</h1>
                   <button onClick={handleOpenNewProduct} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold flex items-center gap-2 text-sm"><Plus size={16} /> Novo Produto</button>
                </div>
                {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-400" size={32}/></div> : 
                 products.length === 0 ? <div className="text-center py-20 text-slate-500">Nenhum produto encontrado.</div> :
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {products.map(product => (
                         <div key={product.id} className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm flex flex-col">
                             <div className="flex gap-4 mb-4">
                                 <div className="w-16 h-16 rounded bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover"/> : <ImageIcon className="text-slate-300" size={20}/>}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                     <h3 className="font-bold text-slate-900 truncate text-sm mb-1">{product.name}</h3>
                                     <div className="flex justify-between items-center">
                                         <span className="text-slate-600 font-bold text-sm">{product.price.toLocaleString()} MT</span>
                                         {getStatusBadge(product.status)}
                                     </div>
                                 </div>
                             </div>
                             <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 mt-auto">
                                 <button onClick={() => handleEditProduct(product)} className="py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded hover:bg-slate-100 flex justify-center items-center gap-1"><Edit3 size={14}/> Editar</button>
                                 <button onClick={() => openDeleteModal('product', product.id, product.name)} className="py-2 bg-red-50 text-red-500 text-xs font-bold rounded hover:bg-red-100 flex justify-center items-center gap-1"><Trash2 size={14}/> Excluir</button>
                             </div>
                         </div>
                     ))}
                 </div>
                }
             </div>
          )}

          {activeTab === 'links' && (
             <div className="space-y-6">
                <div className="border-b border-slate-200 pb-4">
                     <h1 className="text-2xl font-bold text-slate-900">Links de Pagamento</h1>
                </div>
                <div className="bg-white p-6 rounded-lg border border-slate-200 flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full"><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Produto</label><select value={selectedProductIdForLink} onChange={e => setSelectedProductIdForLink(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-sm"><option value="">Selecione...</option>{products.filter(p=>p.status==='active').map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                    <button onClick={() => generateLink()} disabled={isCreatingLink || !selectedProductIdForLink} className="w-full md:w-auto px-6 py-2 bg-brand-600 text-white font-bold rounded text-sm hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2">{isCreatingLink ? <Loader2 className="animate-spin" size={16}/> : <LinkIcon size={16}/>} Gerar Link</button>
                </div>
                <div className="space-y-3">
                    {paymentLinks.map(link => (
                        <div key={link.id} className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-900 text-sm truncate">{link.product_name}</h4>
                                <div className="text-xs text-slate-400 font-mono truncate">{link.url}</div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => navigator.clipboard.writeText(link.url).then(()=>alert("Copiado!"))} className="p-2 text-slate-500 hover:text-brand-600 bg-slate-50 hover:bg-brand-50 rounded"><Copy size={16}/></button>
                                <a href={link.url} target="_blank" className="p-2 text-slate-500 hover:text-brand-600 bg-slate-50 hover:bg-brand-50 rounded"><ExternalLink size={16}/></a>
                                <button onClick={() => openDeleteModal('link', link.id, link.product_name)} className="p-2 text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
          )}

          {activeTab === 'sales' && (
             <div className="space-y-6">
                 <div className="pb-4 border-b border-slate-200">
                    <h1 className="text-2xl font-bold text-slate-900">Histórico de Vendas</h1>
                 </div>
                 <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase"><tr><th className="p-4">ID</th><th className="p-4">Produto</th><th className="p-4">Cliente</th><th className="p-4">Valor</th><th className="p-4">Status</th></tr></thead>
                            <tbody className="text-sm">
                                {filteredSales.map(sale => (
                                    <tr key={sale.id} className="border-b border-slate-50 hover:bg-slate-50">
                                        <td className="p-4 font-mono text-xs text-slate-400">#{sale.id.slice(0,8)}</td>
                                        <td className="p-4 font-medium">{sale.product_name}</td>
                                        <td className="p-4 text-slate-600">{sale.customer_name}</td>
                                        <td className="p-4 font-bold">{sale.amount.toLocaleString()} MT</td>
                                        <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${sale.status==='approved'?'bg-green-100 text-green-700':sale.status==='cancelled'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700'}`}>{sale.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 </div>
             </div>
          )}

          {activeTab === 'settings' && (
             <div className="max-w-xl mx-auto py-10">
                 <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
                     <Settings size={48} className="mx-auto text-slate-300 mb-4"/>
                     <h2 className="text-xl font-bold text-slate-900 mb-2">Configurações</h2>
                     <p className="text-slate-500 mb-6 text-sm">Gerencie suas preferências de conta.</p>
                     <button className="bg-brand-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-brand-700">Editar Perfil</button>
                 </div>
             </div>
          )}
      </main>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">{editingId ? 'Editar Produto' : 'Novo Produto'}</h2>
                <button onClick={() => setShowProductModal(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-white">
               <div className="space-y-4">
                   {productFormStep === 1 && (
                       <div className="space-y-4">
                           <div>
                               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nome do Produto</label>
                               <input type="text" className="w-full p-3 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Ex: Curso de Marketing" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Descrição</label>
                               <div className="relative">
                                   <textarea className="w-full p-3 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-brand-500 outline-none min-h-[100px]" placeholder="Detalhes do produto..." value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})}></textarea>
                                   <button onClick={handleGenerateDescriptionAI} disabled={isGeneratingAI} className="absolute bottom-2 right-2 text-brand-600 bg-brand-50 px-2 py-1 rounded text-xs font-bold flex gap-1 items-center disabled:opacity-50">{isGeneratingAI ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>} IA</button>
                               </div>
                           </div>
                           <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Imagem URL</label>
                                <div className="flex gap-2">
                                     <input type="text" className="w-full p-3 border border-slate-300 rounded text-sm" placeholder="https://..." value={newProduct.image_url || ''} onChange={e => setNewProduct({...newProduct, image_url: e.target.value})} />
                                     <button onClick={() => productImageInputRef.current?.click()} className="px-4 bg-slate-100 border border-slate-300 rounded text-slate-600 hover:bg-slate-200"><UploadCloud size={18}/></button>
                                     <input type="file" className="hidden" ref={productImageInputRef} onChange={handleProductImageUpload} accept="image/*" />
                                </div>
                           </div>
                       </div>
                   )}
                   {productFormStep === 2 && (
                       <div className="space-y-4">
                           <div>
                               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Preço (MT)</label>
                               <input type="number" className="w-full p-3 border border-slate-300 rounded text-sm font-bold" placeholder="0.00" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} />
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Link de Entrega</label>
                               <input type="url" className="w-full p-3 border border-slate-300 rounded text-sm" placeholder="https://drive.google.com..." value={newProduct.redemption_link || ''} onChange={e => setNewProduct({...newProduct, redemption_link: e.target.value})} />
                           </div>
                           <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-4">
                               <div className="flex items-center justify-between">
                                   <span className="text-sm font-bold text-slate-700">Oferta Limitada</span>
                                   <input type="checkbox" checked={newProduct.is_limited_time} onChange={e => setNewProduct({...newProduct, is_limited_time: e.target.checked})} className="w-5 h-5"/>
                               </div>
                               <div className="flex items-center justify-between">
                                   <span className="text-sm font-bold text-slate-700">Order Bump</span>
                                   <input type="checkbox" checked={newProduct.has_offer} onChange={e => setNewProduct({...newProduct, has_offer: e.target.checked})} className="w-5 h-5"/>
                               </div>
                               {newProduct.has_offer && (<div className="grid grid-cols-2 gap-2"><input type="text" placeholder="Título Extra" className="p-2 border rounded text-xs" value={newProduct.offer_title} onChange={e => setNewProduct({...newProduct, offer_title: e.target.value})} /><input type="number" placeholder="Preço" className="p-2 border rounded text-xs" value={newProduct.offer_price || ''} onChange={e => setNewProduct({...newProduct, offer_price: parseFloat(e.target.value)})} /></div>)}
                           </div>
                       </div>
                   )}
                   {productFormStep === 3 && (
                       <div className="text-center py-8">
                           <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600"><Save size={24}/></div>
                           <h3 className="font-bold text-lg text-slate-900 mb-2">Pronto para publicar?</h3>
                           <p className="text-slate-500 text-sm mb-6">Seu produto estará disponível imediatamente.</p>
                           <button onClick={() => saveProduct('active')} disabled={isSavingProduct} className="bg-brand-600 text-white px-8 py-3 rounded-lg font-bold w-full flex justify-center items-center gap-2 hover:bg-brand-700">{isSavingProduct ? <Loader2 className="animate-spin" size={18} /> : null}{isSavingProduct ? 'Salvando...' : 'Publicar'}</button>
                       </div>
                   )}
               </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                {productFormStep > 1 ? <button onClick={() => setProductFormStep(s => s-1)} className="text-slate-600 text-sm font-bold hover:text-slate-900">Voltar</button> : <div/>}
                {productFormStep < 3 && <button onClick={() => setProductFormStep(s => s+1)} className="bg-slate-900 text-white px-6 py-2 rounded text-sm font-bold hover:bg-slate-800">Continuar</button>}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;