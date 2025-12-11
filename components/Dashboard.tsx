import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Settings, 
  LogOut, 
  Plus, 
  Copy, 
  Wallet,
  Menu,
  X,
  Loader2,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Edit3,
  ExternalLink,
  Link as LinkIcon,
  Save,
  Trash2,
  Image as ImageIcon,
  Search,
  UploadCloud,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  Filter,
  ChevronDown,
  Bell,
  BellRing,
  MousePointerClick,
  Activity,
  ArrowUpRight
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
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
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

  // --- NOTIFICATION HELPER ---
  const handleEnableNotifications = async () => {
    if (!("Notification" in window)) {
        alert("Seu navegador não suporta notificações.");
        return;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            setShowNotificationPrompt(false);
            new Notification("Notificações Ativadas! 🚀", { 
                body: "Você será avisado a cada nova venda.",
                icon: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png'
            });
            playNotificationSound();
        }
    } catch (e) {
        console.error("Error requesting permission", e);
    }
  };

  const playNotificationSound = () => {
     const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3");
     audio.play().catch(e => console.log("Audio play failed", e));
  };

  const triggerBrowserNotification = (title: string, body: string) => {
    if (Notification.permission === "granted") {
      try {
        new Notification(title, { body, icon: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png' });
        playNotificationSound();
      } catch (e) {
        console.error("Notification trigger failed", e);
      }
    }
  };

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
      // Insert into DB for persistence
      try {
          await supabase.from('notifications').insert({
              user_id: session.user.id,
              title,
              message
          });
          // Optimistic UI update handled by Realtime subscription on notifications table
      } catch (e) {
          console.error("Failed to persist notification", e);
      }
  };

  // --- FILTRAGEM POR DATA & PESQUISA ---
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

  // --- HELPER PARA CALCULAR ESTATISTICAS ---
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // NOVA LÓGICA DE RECEITA LÍQUIDA: Total Bruto - (8% + 8MT)
  const calculateNetRevenue = (salesData: Sale[]) => {
      return salesData.filter(s => s.status === 'approved').reduce((acc, curr) => {
          const fee = (curr.amount * 0.08) + 8;
          return acc + (curr.amount - fee);
      }, 0);
  };

  const calculateGrossRevenue = (salesData: Sale[]) => {
      return salesData.filter(s => s.status === 'approved').reduce((acc, curr) => acc + curr.amount, 0);
  };

  // CVR Calculation: (Vendas Aprovadas / Total Views) * 100
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
        if ("Notification" in window && Notification.permission === "default") {
            setShowNotificationPrompt(true);
        }
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
                 triggerBrowserNotification("Nova Venda Aprovada! 💰", `Você recebeu ${newSale.amount} MT.`);
                 addNotificationToDB("Venda Aprovada!", `Venda de ${newSale.product_name} no valor de ${newSale.amount} MT confirmada. ID: ${newSale.id.slice(0,8)}`);
             }
         } else if (payload.eventType === 'UPDATE') {
             const updatedSale = payload.new as Sale;
             setSales(prev => prev.map(s => s.id === updatedSale.id ? updatedSale : s));
             if (updatedSale.status === 'approved' && (payload.old as Sale)?.status !== 'approved') {
                 triggerBrowserNotification("Pagamento Confirmado! ✅", `${updatedSale.amount} MT confirmados.`);
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

  // --- ACTIONS (Keeping generateLink, delete, product management mostly same logic) ---
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
  
  const confirmDelete = async () => {
      const { type, id } = deleteModal;
      if (!id || !type) return;
      setDeleteModal({ ...deleteModal, isOpen: false });
      const previousProducts = [...products];
      const previousLinks = [...paymentLinks];
      if (type === 'link') setPaymentLinks(prev => prev.filter(item => item.id !== id));
      else { setProducts(prev => prev.filter(item => item.id !== id)); setPaymentLinks(prev => prev.filter(item => item.product_id !== id)); }
      try {
          if (type === 'link') await supabase.from('payment_links').delete().eq('id', id);
          else { await supabase.from('payment_links').delete().eq('product_id', id); await supabase.from('products').delete().eq('id', id); }
      } catch (error: any) {
          alert(`Falha ao excluir: ${error.message}`);
          setProducts(previousProducts); setPaymentLinks(previousLinks); fetchData();
      }
  };

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

  // --- NEW RENDER HELPERS ---
  const renderNeoGlassChart = () => {
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
    const height = 250;
    const width = 800;
    const padding = 20;
    const chartW = width - (padding * 2);
    const chartH = height - (padding * 2);
    const points = dataPoints.map((d, i) => `${padding + (i / (dataPoints.length - 1)) * chartW},${height - padding - (d.value / maxValue) * chartH}`).join(' ');
    const fillPath = `${padding},${height-padding} ${points} ${width-padding},${height-padding}`;

    return (
        <div className="relative h-72 w-full bg-white rounded-3xl overflow-hidden shadow-card border border-slate-100 group">
             {/* New Blue/White SaaS Theme */}
             <div className="relative z-10 p-6 flex flex-col h-full">
                 <div className="flex justify-between items-start mb-4">
                     <div>
                        <h3 className="text-slate-800 font-bold text-lg flex items-center gap-2">
                             <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
                                <TrendingUp size={18} /> 
                             </div>
                             Receita
                        </h3>
                     </div>
                     <div className="text-right">
                         <div className="text-3xl font-bold text-slate-900 tracking-tight">
                             {filteredApprovedSales.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()} MT
                         </div>
                     </div>
                 </div>

                 <div className="flex-1 w-full min-h-0 relative">
                     <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                         <defs>
                             <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                                 <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                             </linearGradient>
                         </defs>
                         <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1" />
                         <polygon points={fillPath} fill="url(#blueGradient)" />
                         <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                         {dataPoints.map((d, i) => {
                             const x = padding + (i / (dataPoints.length - 1)) * chartW;
                             const y = height - padding - (d.value / maxValue) * chartH;
                             return (
                                 <circle key={i} cx={x} cy={y} r="4" fill="#fff" stroke="#3b82f6" strokeWidth="2" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                             );
                         })}
                     </svg>
                 </div>
                 <div className="flex justify-between mt-2 px-1">
                     {dataPoints.filter((_, i) => i % Math.ceil(dataPoints.length / 6) === 0).map((d, i) => (
                         <span key={i} className="text-[10px] text-slate-400 font-medium">{d.label}</span>
                     ))}
                 </div>
             </div>
        </div>
    );
  };

  // Helper for Product Status Badge
  const getStatusBadge = (status: ProductStatus) => {
      switch (status) {
          case 'active': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide">Ativo</span>;
          case 'analyzing': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"><Loader2 size={10} className="animate-spin"/> Análise</span>;
          case 'draft': return <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide">Rascunho</span>;
          case 'rejected': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide">Recusado</span>;
          default: return <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide">{status}</span>;
      }
  };

  // Helper for Product Stats
  const getProductStats = (productId: string) => {
      const productSales = sales.filter(s => s.product_id === productId && s.status === 'approved');
      const count = productSales.length;
      const revenue = productSales.reduce((acc, curr) => acc + curr.amount, 0);
      return { count, revenue };
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] font-sans text-slate-900">
      
      {/* NOTIFICATION PROMPT */}
      {showNotificationPrompt && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-slideDown w-full max-w-md px-4">
              <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between gap-4 border border-slate-700">
                  <div className="flex items-center gap-3">
                      <div className="bg-brand-600 p-2 rounded-lg animate-pulse">
                          <BellRing size={20} />
                      </div>
                      <div>
                          <p className="font-bold text-sm">Ativar notificações?</p>
                          <p className="text-xs text-slate-400">Receba alertas de vendas na hora.</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                      <button onClick={() => setShowNotificationPrompt(false)} className="text-xs font-bold text-slate-400 hover:text-white px-2 py-1">Depois</button>
                      <button onClick={handleEnableNotifications} className="text-xs font-bold bg-white text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">Ativar</button>
                  </div>
              </div>
          </div>
      )}

      {/* HEADER SUPERIOR NOVO */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white border-b border-slate-200 z-40 flex items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-3">
             <div className="lg:hidden p-2 bg-slate-50 rounded-lg text-slate-600" onClick={() => setMobileMenuOpen(true)}>
                 <Menu size={24}/>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-glow">
                  <Wallet size={20} />
                </div>
                <div className="hidden md:block">
                    <span className="block text-xl font-bold text-slate-900 leading-none">Pay<span className="text-brand-600">Easy</span></span>
                </div>
             </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-6 hidden md:block">
              <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Pesquisar ID da transação..." 
                    className="w-full pl-11 pr-4 py-2.5 bg-[#F5F6F8] border border-transparent focus:bg-white focus:border-brand-200 focus:ring-4 focus:ring-brand-50 rounded-xl outline-none transition-all text-sm font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>
          </div>

          <div className="flex items-center gap-6">
              {/* Notifications */}
              <div className="relative">
                  <button 
                     className="relative p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors"
                     onClick={() => { setShowNotificationsDropdown(!showNotificationsDropdown); if(unreadCount > 0) markNotificationsRead(); }}
                  >
                      <Bell size={22} />
                      {unreadCount > 0 && (
                          <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                      )}
                  </button>
                  {showNotificationsDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-slideDown z-50">
                          <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                              <h4 className="font-bold text-slate-900">Notificações</h4>
                              <button className="text-xs text-brand-600 font-bold hover:underline" onClick={() => setShowNotificationsDropdown(false)}>Fechar</button>
                          </div>
                          <div className="max-h-80 overflow-y-auto">
                              {notifications.length === 0 ? (
                                  <div className="p-8 text-center text-slate-400 text-sm">Sem notificações.</div>
                              ) : (
                                  notifications.map((notif) => (
                                      <div key={notif.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-blue-50/50' : ''}`}>
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

              {/* Profile */}
              <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
                  <div className="text-right hidden md:block">
                      <p className="text-sm font-bold text-slate-900 leading-tight">{profile.fullName.split(' ')[0]}</p>
                      <button onClick={onLogout} className="text-[10px] text-slate-400 hover:text-red-500 font-medium">Sair</button>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
                      {/* Avatar Placeholder */}
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-slate-500 font-bold">
                          {profile.fullName.charAt(0)}
                      </div>
                  </div>
              </div>
          </div>
      </header>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)}>
              <div className="absolute left-0 top-0 bottom-0 w-64 bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-8">
                       <span className="text-xl font-bold">Menu</span>
                       <button onClick={() => setMobileMenuOpen(false)}><X size={24}/></button>
                  </div>
                  <nav className="space-y-2">
                      {[
                        { id: 'overview', icon: LayoutDashboard, label: 'Visão Geral' },
                        { id: 'sales', icon: TrendingUp, label: 'Vendas' },
                        { id: 'products', icon: ShoppingBag, label: 'Produtos' },
                        { id: 'links', icon: LinkIcon, label: 'Links' },
                        { id: 'settings', icon: Settings, label: 'Configurações' },
                      ].map((item) => (
                        <button key={item.id} onClick={() => changeTab(item.id as Tab)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm ${activeTab === item.id ? 'bg-brand-50 text-brand-600' : 'text-slate-600'}`}>
                            <item.icon size={18}/> {item.label}
                        </button>
                      ))}
                  </nav>
              </div>
          </div>
      )}

      {/* MAIN CONTENT WITH GRID LAYOUT */}
      <main className="pt-24 pb-12 px-4 md:px-8 max-w-[1600px] mx-auto">
          {activeTab === 'overview' && (
              <div className="grid grid-cols-12 gap-8">
                  
                  {/* LEFT COLUMN (MAIN) */}
                  <div className="col-span-12 lg:col-span-9 space-y-8">
                      
                      {/* GREETING SECTION */}
                      <div className="flex justify-between items-end">
                          <div>
                              <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                                  {getGreeting()}, {profile.fullName.split(' ')[0]}
                              </h1>
                              <p className="text-lg text-slate-500 font-medium">
                                  Visão Geral das suas vendas aprovadas
                              </p>
                          </div>
                          
                          {/* Period Selector */}
                          <div className="flex gap-2">
                              <select 
                                value={dateRange} 
                                onChange={(e) => setDateRange(e.target.value as DateRange)}
                                className="bg-white border border-slate-200 text-slate-700 py-2 px-4 rounded-xl font-bold text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer hover:bg-slate-50"
                              >
                                  <option value="today">Hoje</option>
                                  <option value="7days">Últimos 7 dias</option>
                                  <option value="30days">Últimos 30 dias</option>
                                  <option value="all">Todo Período</option>
                              </select>
                              <button onClick={() => handleOpenNewProduct()} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-colors flex items-center gap-2">
                                  <Plus size={16}/> <span className="hidden sm:inline">Criar</span>
                              </button>
                          </div>
                      </div>

                      {/* KPI CARDS (4 COLS) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                          {/* 1. Receita Bruta */}
                          <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-100 hover:border-brand-200 transition-colors group">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="p-3 bg-brand-50 text-brand-600 rounded-xl group-hover:scale-110 transition-transform">
                                      <Wallet size={24}/>
                                  </div>
                                  <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">+12%</span>
                              </div>
                              <div className="text-3xl font-bold text-slate-900 tracking-tight mb-1">{calculateGrossRevenue(filteredSales).toLocaleString()} MT</div>
                              <p className="text-sm font-medium text-slate-500">Receita Bruta</p>
                          </div>

                          {/* 2. Vendas Aprovadas */}
                          <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-100 hover:border-blue-200 transition-colors group">
                               <div className="flex justify-between items-start mb-4">
                                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                                      <ShoppingBag size={24}/>
                                  </div>
                              </div>
                              <div className="text-3xl font-bold text-slate-900 tracking-tight mb-1">{filteredApprovedSales.length}</div>
                              <p className="text-sm font-medium text-slate-500">Vendas Aprovadas</p>
                          </div>

                          {/* 3. CVR (Taxa de Conversão) - REPLACED TICKET AVERAGE */}
                          <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-100 hover:border-purple-200 transition-colors group">
                               <div className="flex justify-between items-start mb-4">
                                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                                      <MousePointerClick size={24}/>
                                  </div>
                              </div>
                              <div className="text-3xl font-bold text-slate-900 tracking-tight mb-1">{calculateCVR()}%</div>
                              <p className="text-sm font-medium text-slate-500">Taxa de Conversão</p>
                          </div>

                          {/* 4. Canceladas - REPLACED PENDING */}
                          <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-100 hover:border-red-200 transition-colors group">
                               <div className="flex justify-between items-start mb-4">
                                  <div className="p-3 bg-red-50 text-red-600 rounded-xl group-hover:scale-110 transition-transform">
                                      <X size={24}/>
                                  </div>
                              </div>
                              <div className="text-3xl font-bold text-slate-900 tracking-tight mb-1">{filteredSales.filter(s => s.status === 'cancelled').length}</div>
                              <p className="text-sm font-medium text-slate-500">Vendas Canceladas</p>
                          </div>
                      </div>

                      {/* CHART SECTION */}
                      {renderNeoGlassChart()}

                      {/* RECENT SALES TABLE (Filtered by Search) */}
                      <div className="bg-white rounded-3xl shadow-card border border-slate-100 overflow-hidden">
                          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                              <h3 className="font-bold text-slate-900 text-lg">Histórico de Transações</h3>
                              <button onClick={() => changeTab('sales')} className="text-sm text-brand-600 font-bold hover:underline">Ver tudo</button>
                          </div>
                          <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                  <thead>
                                      <tr className="bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wide">
                                          <th className="p-4 pl-6">ID Transação</th>
                                          <th className="p-4">Produto</th>
                                          <th className="p-4">Cliente</th>
                                          <th className="p-4">Valor</th>
                                          <th className="p-4">Status</th>
                                      </tr>
                                  </thead>
                                  <tbody className="text-sm">
                                      {filteredSales.slice(0, 5).map(sale => (
                                          <tr key={sale.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                              <td className="p-4 pl-6 font-mono text-xs text-slate-500">#{sale.id.slice(0,8).toUpperCase()}</td>
                                              <td className="p-4 font-medium text-slate-900">{sale.product_name}</td>
                                              <td className="p-4 text-slate-600">{sale.customer_name}</td>
                                              <td className="p-4 font-bold text-slate-900">{sale.amount.toLocaleString()} MT</td>
                                              <td className="p-4">
                                                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                      sale.status === 'approved' ? 'bg-green-100 text-green-700' : 
                                                      sale.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                                                      'bg-red-100 text-red-700'
                                                  }`}>
                                                      {sale.status === 'approved' ? 'Aprovado' : sale.status === 'pending' ? 'Pendente' : 'Cancelado'}
                                                  </span>
                                              </td>
                                          </tr>
                                      ))}
                                      {filteredSales.length === 0 && (
                                          <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhuma transação encontrada.</td></tr>
                                      )}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>

                  {/* RIGHT COLUMN (LIVE FEED) */}
                  <div className="col-span-12 lg:col-span-3 space-y-6">
                      <div className="sticky top-24">
                          <div className="bg-white rounded-3xl shadow-card border border-slate-100 overflow-hidden min-h-[500px] flex flex-col">
                              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                  <h3 className="font-bold text-slate-900">Últimas Vendas</h3>
                                  <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 animate-pulse shadow-glow">
                                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div> AO VIVO
                                  </div>
                              </div>
                              <div className="flex-1 overflow-y-auto max-h-[600px] p-2 space-y-1 custom-scrollbar">
                                  {sales.slice(0, 15).map((sale, idx) => (
                                      <div key={sale.id} className="p-3 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group animate-fadeIn" style={{animationDelay: `${idx * 100}ms`}}>
                                          <div className="flex justify-between items-start mb-1">
                                              <span className="text-xs font-bold text-slate-800 line-clamp-1 w-3/4">{sale.product_name}</span>
                                              <span className="text-xs font-bold text-green-600">{sale.amount.toLocaleString()}</span>
                                          </div>
                                          <div className="flex justify-between items-center mt-2">
                                              <div className="flex items-center gap-1.5">
                                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${sale.payment_method === 'mpesa' ? 'bg-red-500' : 'bg-orange-500'}`}>
                                                      {sale.payment_method === 'mpesa' ? 'M' : 'E'}
                                                  </div>
                                                  <span className="text-[10px] text-slate-400 uppercase">{sale.payment_method}</span>
                                              </div>
                                              <div className="text-[10px] font-mono text-slate-300 group-hover:text-slate-500 transition-colors" title={sale.id}>
                                                  #{sale.id.slice(0,6)}
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                                  {sales.length === 0 && (
                                      <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-xs gap-2">
                                          <Activity size={24} className="opacity-20"/>
                                          Aguardando vendas...
                                      </div>
                                  )}
                              </div>
                          </div>

                          {/* Mini Promo Card or Extra Info */}
                          <div className="mt-6 bg-gradient-to-br from-brand-600 to-brand-800 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg shadow-brand-200">
                              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                              <h4 className="font-bold text-lg mb-2 relative z-10">Maximize suas vendas!</h4>
                              <p className="text-xs text-brand-100 mb-4 relative z-10 leading-relaxed">Ative o Order Bump nos seus produtos e aumente seu lucro em até 30%.</p>
                              <button onClick={() => changeTab('products')} className="w-full bg-white text-brand-700 py-2.5 rounded-xl text-xs font-bold hover:bg-brand-50 transition-colors shadow-md relative z-10">Configurar Agora</button>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* OTHER TABS (Keeping logic, just updating wrapper if needed - currently inheriting grid via main) */}
          {activeTab !== 'overview' && (
             <div className="max-w-6xl mx-auto">
                 {/* Logic for Products, Links, Sales List, Settings remains same but rendered within this container */}
                 {activeTab === 'products' && (
                     <div className="space-y-8 animate-fadeIn">
                        {/* Products Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200">
                           <div>
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Meus Produtos</h1>
                                <p className="text-slate-500 mt-1 font-medium">Gerencie seu catálogo, edite ofertas e crie novos itens.</p>
                           </div>
                           <button onClick={handleOpenNewProduct} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"><Plus size={20} /> Criar Produto</button>
                        </div>
                        {/* Products Grid (Reusing Logic) */}
                        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-600" size={40}/></div> : 
                         products.length === 0 ? <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-slate-200"><ShoppingBag size={32} className="mx-auto text-slate-300 mb-4"/><h3 className="font-bold text-slate-900">Catálogo vazio</h3><button onClick={handleOpenNewProduct} className="text-brand-600 font-bold hover:underline mt-2">Criar primeiro produto</button></div> :
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                             {products.map(product => (
                                 <div key={product.id} className="bg-white rounded-2xl p-5 shadow-card border border-slate-100 hover:border-brand-300 transition-all group flex flex-col">
                                     <div className="flex gap-4 mb-4">
                                         <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover"/> : <ImageIcon className="text-slate-300" size={20}/>}
                                         </div>
                                         <div className="flex-1 min-w-0">
                                             <div className="flex justify-between items-start"><h3 className="font-bold text-slate-900 truncate">{product.name}</h3>{getStatusBadge(product.status)}</div>
                                             <div className="text-brand-600 font-bold mt-1">{product.price.toLocaleString()} MT</div>
                                         </div>
                                     </div>
                                     <div className="grid grid-cols-2 gap-2 border-t border-b border-slate-50 py-3 mb-4 text-center">
                                         <div><div className="text-[10px] text-slate-400 font-bold uppercase">Vendas</div><div className="font-bold text-slate-800">{getProductStats(product.id).count}</div></div>
                                         <div><div className="text-[10px] text-slate-400 font-bold uppercase">Receita</div><div className="font-bold text-slate-800">{getProductStats(product.id).revenue.toLocaleString()}</div></div>
                                     </div>
                                     <div className="mt-auto grid grid-cols-2 gap-2">
                                         <button onClick={() => handleEditProduct(product)} className="py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-100 flex justify-center items-center gap-1"><Edit3 size={14}/> Editar</button>
                                         <button onClick={() => openDeleteModal('product', product.id, product.name)} className="py-2 bg-red-50 text-red-500 text-xs font-bold rounded-lg hover:bg-red-100 flex justify-center items-center gap-1"><Trash2 size={14}/> Excluir</button>
                                     </div>
                                 </div>
                             ))}
                         </div>
                        }
                     </div>
                 )}
                 {activeTab === 'links' && (
                     <div className="space-y-8 animate-fadeIn">
                        <div className="pb-6 border-b border-slate-200">
                             <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Links de Pagamento</h1>
                             <p className="text-slate-500 mt-1 font-medium">Crie checkouts seguros para seus produtos.</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-200 flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 w-full"><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Produto</label><select value={selectedProductIdForLink} onChange={e => setSelectedProductIdForLink(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm focus:ring-2 focus:ring-brand-500"><option value="">Selecione...</option>{products.filter(p=>p.status==='active').map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                            <button onClick={() => generateLink()} disabled={isCreatingLink || !selectedProductIdForLink} className="w-full md:w-auto px-8 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-brand-200">{isCreatingLink ? <Loader2 className="animate-spin" size={18}/> : <LinkIcon size={18}/>} Gerar Link</button>
                        </div>
                        <div className="space-y-3">
                            {paymentLinks.map(link => (
                                <div key={link.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1"><span className="text-[10px] font-bold bg-brand-50 text-brand-700 px-2 py-0.5 rounded uppercase">Produto</span><h4 className="font-bold text-slate-900 truncate">{link.product_name}</h4></div>
                                        <div className="text-xs text-slate-400 font-mono truncate">{link.url}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => navigator.clipboard.writeText(link.url).then(()=>alert("Copiado!"))} className="p-2 text-slate-500 hover:text-brand-600 bg-slate-50 hover:bg-brand-50 rounded-lg"><Copy size={16}/></button>
                                        <a href={link.url} target="_blank" className="p-2 text-slate-500 hover:text-brand-600 bg-slate-50 hover:bg-brand-50 rounded-lg"><ExternalLink size={16}/></a>
                                        <button onClick={() => openDeleteModal('link', link.id, link.product_name)} className="p-2 text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>
                 )}
                 {activeTab === 'sales' && (
                     <div className="space-y-8 animate-fadeIn">
                         {/* Sales Tab Logic Reused from original but simpler layout */}
                         <div className="pb-6 border-b border-slate-200 flex justify-between items-end">
                             <div>
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Vendas</h1>
                                <p className="text-slate-500 mt-1 font-medium">Relatório completo de transações.</p>
                             </div>
                             <div className="bg-white border border-slate-200 p-1 rounded-lg flex text-xs font-bold text-slate-600">
                                 <div className="px-3 py-1 bg-slate-100 rounded">Exportar CSV</div>
                             </div>
                         </div>
                         <div className="bg-white rounded-3xl shadow-card border border-slate-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase"><tr className="border-b border-slate-100"><th className="p-4">ID</th><th className="p-4">Produto</th><th className="p-4">Cliente</th><th className="p-4">Valor</th><th className="p-4">Status</th></tr></thead>
                                    <tbody className="text-sm">
                                        {filteredSales.map(sale => (
                                            <tr key={sale.id} className="border-b border-slate-50 hover:bg-slate-50">
                                                <td className="p-4 font-mono text-xs text-slate-400">#{sale.id.slice(0,8)}</td>
                                                <td className="p-4 font-medium">{sale.product_name}</td>
                                                <td className="p-4 text-slate-600">{sale.customer_name}<div className="text-[10px] text-slate-400">{sale.customer_phone}</div></td>
                                                <td className="p-4 font-bold">{sale.amount.toLocaleString()} MT</td>
                                                <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${sale.status==='approved'?'bg-green-100 text-green-700':sale.status==='cancelled'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700'}`}>{sale.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                         </div>
                     </div>
                 )}
                 {activeTab === 'settings' && (
                     <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-card border border-slate-100">
                         <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center text-brand-200 mb-6"><Settings size={48}/></div>
                         <h2 className="text-2xl font-bold text-slate-900 mb-2">Configurações</h2>
                         <p className="text-slate-500 mb-8">Gerencie perfil e notificações.</p>
                         <button onClick={handleEnableNotifications} className="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-200">Ativar Notificações Push</button>
                     </div>
                 )}
             </div>
          )}
      </main>

      {/* Product Modal (Reused) */}
      {showProductModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-glow flex flex-col overflow-hidden max-h-[90vh] animate-slideUp border border-white/20">
             {/* ... Modal content is the same ... */}
            <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-white">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Editar Produto' : 'Novo Produto'}</h2>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Preencha os dados para começar a vender.</p>
                </div>
                <button onClick={() => setShowProductModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-white">
               <div className="space-y-6">
                   {productFormStep === 1 && (
                       <div className="space-y-6 animate-fadeIn">
                           <div>
                               <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">Nome do Produto</label>
                               <input type="text" className="w-full p-4 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder-slate-400" placeholder="Ex: Curso de Marketing Digital 2.0" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">Descrição</label>
                               <div className="relative">
                                   <textarea className="w-full p-4 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all min-h-[120px] resize-y placeholder-slate-400" placeholder="Descreva os benefícios do seu produto..." value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})}></textarea>
                                   <button onClick={handleGenerateDescriptionAI} disabled={isGeneratingAI} className="absolute bottom-3 right-3 text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-1 rounded-lg text-xs font-bold flex gap-1 items-center transition-colors disabled:opacity-50">{isGeneratingAI ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}{isGeneratingAI ? "Gerando..." : "Gerar com IA"}</button>
                               </div>
                           </div>
                           <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">Imagem de Capa</label>
                                <div className="flex items-start gap-4">
                                    <div className="w-24 h-24 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
                                        {newProduct.image_url ? <img src={newProduct.image_url} className="w-full h-full object-cover"/> : <UploadCloud className="text-slate-300 w-8 h-8"/>}
                                    </div>
                                    <div className="flex-1">
                                         <input type="text" className="w-full p-3 text-xs border border-slate-200 rounded-lg mb-3 placeholder-slate-400" placeholder="Ou cole a URL da imagem aqui..." value={newProduct.image_url || ''} onChange={e => setNewProduct({...newProduct, image_url: e.target.value})} />
                                         <div className="flex gap-2">
                                            <button onClick={() => productImageInputRef.current?.click()} className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-2"><UploadCloud size={14}/> Carregar Arquivo</button>
                                            <span className="text-xs text-slate-400 self-center font-medium">Max 2MB (JPG, PNG)</span>
                                            <input type="file" className="hidden" ref={productImageInputRef} onChange={handleProductImageUpload} accept="image/*" />
                                         </div>
                                    </div>
                                </div>
                           </div>
                       </div>
                   )}
                   {productFormStep === 2 && (
                       <div className="space-y-6 animate-fadeIn">
                           <div>
                               <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">Preço (MT)</label>
                               <div className="relative">
                                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">MT</span>
                                   <input type="number" className="w-full pl-12 p-4 border border-slate-200 rounded-xl text-xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder-slate-300" placeholder="0.00" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} />
                               </div>
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">Link de Entrega (Acesso)</label>
                               <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 focus-within:ring-2 focus-within:ring-brand-500 focus-within:bg-white transition-all">
                                   <LinkIcon size={18} className="text-slate-400"/>
                                   <input type="url" className="w-full p-3 bg-transparent outline-none text-sm placeholder-slate-400" placeholder="Ex: Link do Google Drive, Canal Telegram, Área de Membros..." value={newProduct.redemption_link || ''} onChange={e => setNewProduct({...newProduct, redemption_link: e.target.value})} />
                               </div>
                               <p className="text-[10px] text-slate-400 mt-1 ml-1 font-medium">O cliente será redirecionado para este link após o pagamento confirmado.</p>
                           </div>
                           <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-5">
                               <div className="flex items-center justify-between">
                                   <div><span className="text-sm font-bold text-slate-800 block">Oferta por Tempo Limitado</span><span className="text-xs text-slate-500 font-medium">Adiciona um contador de escassez no checkout.</span></div>
                                   <div onClick={() => setNewProduct({...newProduct, is_limited_time: !newProduct.is_limited_time})} className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors ${newProduct.is_limited_time ? 'bg-brand-500' : 'bg-slate-300'}`}><div className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform ${newProduct.is_limited_time ? 'translate-x-5' : 'translate-x-0'}`}></div></div>
                               </div>
                               <hr className="border-slate-200"/>
                               <div className="flex items-center justify-between">
                                   <div><span className="text-sm font-bold text-slate-800 block">Order Bump (Upsell)</span><span className="text-xs text-slate-500 font-medium">Oferta extra na hora do pagamento.</span></div>
                                   <div onClick={() => setNewProduct({...newProduct, has_offer: !newProduct.has_offer})} className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors ${newProduct.has_offer ? 'bg-brand-500' : 'bg-slate-300'}`}><div className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform ${newProduct.has_offer ? 'translate-x-5' : 'translate-x-0'}`}></div></div>
                               </div>
                               {newProduct.has_offer && (<div className="p-4 bg-white rounded-lg border border-slate-200 grid grid-cols-2 gap-3 animate-slideDown"><input type="text" placeholder="Título Extra (Ex: Mentoria)" className="p-2 border rounded text-xs" value={newProduct.offer_title} onChange={e => setNewProduct({...newProduct, offer_title: e.target.value})} /><input type="number" placeholder="Preço Extra" className="p-2 border rounded text-xs" value={newProduct.offer_price || ''} onChange={e => setNewProduct({...newProduct, offer_price: parseFloat(e.target.value)})} /></div>)}
                           </div>
                       </div>
                   )}
                   {productFormStep === 3 && (
                       <div className="text-center py-10 animate-fadeIn">
                           <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-600 animate-bounce-slow shadow-sm"><Sparkles size={32}/></div>
                           <h3 className="font-bold text-xl text-slate-900 mb-2">Tudo pronto!</h3>
                           <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto leading-relaxed font-medium">Seu produto será revisado por nossa IA de segurança em instantes após a publicação.</p>
                           <button onClick={() => saveProduct('active')} disabled={isSavingProduct} className="bg-gradient-to-r from-brand-500 to-brand-700 hover:shadow-glow text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-brand-200 w-full flex justify-center items-center gap-2 transition-all transform hover:-translate-y-1">{isSavingProduct ? <Loader2 className="animate-spin" size={20} /> : <Save size={20}/>}{isSavingProduct ? 'Salvando...' : 'Publicar Produto'}</button>
                       </div>
                   )}
               </div>
            </div>
            <div className="px-8 py-5 border-t border-slate-50 bg-slate-50 flex justify-between items-center">
                {productFormStep > 1 ? <button onClick={() => setProductFormStep(s => s-1)} className="text-slate-500 text-sm font-bold hover:text-slate-800 transition-colors">Voltar</button> : <div/>}
                {productFormStep < 3 && <button onClick={() => setProductFormStep(s => s+1)} className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-md">Continuar</button>}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;