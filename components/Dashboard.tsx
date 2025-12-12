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
  Sparkles,
  LogOut,
  ChevronRight,
  User,
  Zap,
  DollarSign,
  ArrowUpRight,
  Filter,
  Check,
  CreditCard,
  Mail,
  Phone,
  Clock,
  PieChart,
  BarChart2,
  AlertCircle,
  Download,
  Calendar,
  Smartphone,
  ChevronDown,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { GoogleGenAI } from "@google/genai";

// --- ASSETS ---
const mpesaLogo = "https://play-lh.googleusercontent.com/BeFHX9dTKeuLrF8TA0gr9kfXLGicQtnxoTM8xJThn9EKCl-h5JmJoqFkaPBoo4qi7w";
const emolaLogo = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRO8LfqUNexEHyVJhjmUeFNYSVkUoZvCkCwkw&s";

// --- TYPES ---
type Tab = 'overview' | 'products' | 'links' | 'sales' | 'metrics' | 'settings';
type ProductStatus = 'draft' | 'analyzing' | 'active' | 'rejected';
type ProductCategory = 'ebooks' | 'cursos' | 'mentoria' | 'software' | 'audio' | 'templates' | 'outros';
type PaymentMethod = 'mpesa' | 'emola';
type SaleStatus = 'approved' | 'pending' | 'cancelled' | 'refunded';
type DateRange = 'today' | 'yesterday' | '7days' | '15days' | '30days' | '60days' | '90days' | '6months' | 'year' | 'custom';
type MetricsSubTab = 'resumo' | 'checkout' | 'gateway' | 'historico';

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

// --- SKELETON COMPONENT ---
const Skeleton = ({ className, ...props }: { className?: string } & React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`bg-slate-200 animate-pulse rounded ${className}`} {...props} />
);

const Dashboard: React.FC<DashboardProps> = ({ session, onLogout, initialTab = 'overview' }) => {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [metricsSubTab, setMetricsSubTab] = useState<MetricsSubTab>('resumo');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const productImageInputRef = useRef<HTMLInputElement>(null);

  // Notification State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [showDateDropdown, setShowDateDropdown] = useState(false); // For custom dropdown
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('all');

  // User Profile
  const initialMeta = session.user.user_metadata || {};
  const [profile] = useState({
    fullName: initialMeta.full_name || 'Empreendedor',
    email: session.user.email,
    phone: initialMeta.phone_number || ''
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
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: 'product' | 'link' | null; id: string | null; title: string; }>({ isOpen: false, type: null, id: null, title: '' });
  
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

  // --- Push Notification Logic ---
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const showBrowserNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon-192x192.png', 
        badge: '/badge.png'
      });
    }
  };

  // --- PWA Logic ---
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const hasSeenPrompt = localStorage.getItem('payeasy_install_prompt_seen');
      if (!hasSeenPrompt) {
         setShowInstallModal(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
      setShowInstallModal(false);
    }
  };

  // --- Filtering Logic ---
  const getDateRangeStart = () => {
      const now = new Date();
      now.setHours(0,0,0,0);

      switch (dateRange) {
          case 'today': return now;
          case 'yesterday': 
              const y = new Date(now); y.setDate(y.getDate() - 1); return y;
          case '7days': { const d = new Date(now); d.setDate(d.getDate() - 7); return d; }
          case '15days': { const d = new Date(now); d.setDate(d.getDate() - 15); return d; }
          case '30days': { const d = new Date(now); d.setDate(d.getDate() - 30); return d; }
          case '60days': { const d = new Date(now); d.setDate(d.getDate() - 60); return d; }
          case '90days': { const d = new Date(now); d.setDate(d.getDate() - 90); return d; }
          case '6months': { const d = new Date(now); d.setMonth(d.getMonth() - 6); return d; }
          case 'year': { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d; }
          case 'custom': return customStartDate ? new Date(customStartDate) : null;
          default: return now;
      }
  };

  const getFilteredSales = () => {
    const now = new Date();
    const startDate = getDateRangeStart();
    const endDate = dateRange === 'custom' && customEndDate ? new Date(customEndDate) : now;
    endDate.setHours(23, 59, 59, 999);

    let result = sales;

    if (startDate) {
        if (dateRange === 'yesterday') {
             const endYest = new Date(startDate);
             endYest.setHours(23, 59, 59, 999);
             result = result.filter(s => {
                 const d = new Date(s.created_at);
                 return d >= startDate && d <= endYest;
             });
        } else {
             result = result.filter(s => {
                 const d = new Date(s.created_at);
                 return d >= startDate && d <= endDate;
             });
        }
    }

    if (selectedProductId !== 'all') {
        result = result.filter(s => s.product_id === selectedProductId);
    }

    if (searchQuery) {
        result = result.filter(s => 
            s.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
            s.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    return result;
  };

  const filteredSales = useMemo(() => getFilteredSales(), [sales, dateRange, customStartDate, customEndDate, selectedProductId, searchQuery]);
  const filteredApprovedSales = filteredSales.filter(s => s.status === 'approved');

  // KPI Calculations
  const grossRevenue = filteredApprovedSales.reduce((acc, curr) => acc + curr.amount, 0);
  const netRevenue = filteredApprovedSales.reduce((acc, curr) => {
      const fee = (curr.amount * 0.08) + 8;
      return acc + (curr.amount - fee);
  }, 0);

  const calculateCVR = () => {
      const totalViews = products.reduce((acc, p) => acc + (p.views_count || 0), 0);
      const totalApprovedSales = sales.filter(s => s.status === 'approved').length; 
      if (totalViews === 0) return 0;
      return ((totalApprovedSales / totalViews) * 100).toFixed(1);
  };

  const changeTab = (tab: Tab) => {
      if (tab === activeTab) return;
      setActiveTab(tab);
      setMobileMenuOpen(false);
      try { window.history.pushState({}, '', `/dashboard/${tab}`); } catch (e) {}
  };

  const fetchData = async () => {
    // Note: Do not setLoading(true) here to avoid flickering on auto-refresh
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
        await requestNotificationPermission();
        setLoading(false);
    };
    initialLoad();

    const intervalId = setInterval(() => { fetchData(); }, 5000); 
    
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
                 const msg = `Venda de ${newSale.product_name} confirmada!`;
                 addNotificationToDB("Venda Aprovada!", msg);
                 showBrowserNotification("PayEasy: Nova Venda!", `${newSale.amount} MT - ${newSale.product_name}`);
             }
         } else if (payload.eventType === 'UPDATE') {
             const updatedSale = payload.new as Sale;
             setSales(prev => prev.map(s => s.id === updatedSale.id ? updatedSale : s));
             if (updatedSale.status === 'approved' && (payload.old as Sale)?.status !== 'approved') {
                 const msg = `Pagamento de ${updatedSale.amount} MT aprovado.`;
                 addNotificationToDB("Pagamento Confirmado", msg);
                 showBrowserNotification("PayEasy: Pagamento Confirmado", msg);
             }
         }
    })
    .subscribe();

    return () => { 
        supabase.removeChannel(channel); 
        clearInterval(intervalId);
    };
  }, []);

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
  
  const handleDeleteItem = async () => {
      if (!deleteModal.id || !deleteModal.type) return;
      try {
          if (deleteModal.type === 'product') {
              await supabase.from('products').delete().eq('id', deleteModal.id);
              setProducts(prev => prev.filter(p => p.id !== deleteModal.id));
          } else {
              await supabase.from('payment_links').delete().eq('id', deleteModal.id);
              setPaymentLinks(prev => prev.filter(l => l.id !== deleteModal.id));
          }
          setDeleteModal({ isOpen: false, type: null, id: null, title: '' });
      } catch (e) {
          alert("Erro ao excluir.");
      }
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

  // --- Metrics Render Helpers ---
  const renderHourlyChart = () => {
    // 24 hours distribution for filtered sales
    const hours = Array(24).fill(0);
    filteredApprovedSales.forEach(s => {
        const h = new Date(s.created_at).getHours();
        hours[h] += s.amount;
    });
    const maxVal = Math.max(...hours, 100);

    if (hours.every(v => v === 0)) {
        return (
            <div className="h-48 flex flex-col items-center justify-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <BarChart2 className="text-slate-300 mb-2" size={48} />
                <p className="font-serif text-slate-800 text-lg">Sem dados</p>
                <p className="text-slate-400 text-sm">Nenhuma transação registrada hoje!</p>
            </div>
        )
    }

    return (
        <div className="h-48 flex items-end justify-between gap-1 pt-4 relative">
             <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none">
                 <div className="border-t border-dashed border-gray-100 w-full h-px"></div>
                 <div className="border-t border-dashed border-gray-100 w-full h-px"></div>
                 <div className="border-t border-dashed border-gray-100 w-full h-px"></div>
             </div>
            {hours.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end items-center group relative z-10 h-full">
                    {val > 0 && (
                         <div className="w-full bg-[#E0F2F1] rounded-t-sm hover:bg-[#00C49F] transition-colors relative group-hover:scale-y-105 origin-bottom duration-300" style={{ height: `${(val / maxVal) * 100}%` }}>
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                                  {val.toLocaleString()} MT
                              </div>
                         </div>
                    )}
                    {val === 0 && <div className="w-full h-[2px] bg-[#E0F2F1] rounded-full"></div>}
                    
                    {i % 3 === 0 && <span className="text-[10px] text-slate-300 mt-2 absolute -bottom-5">{i}h</span>}
                </div>
            ))}
        </div>
    );
  };

  const SidebarItem = ({ id, icon: Icon, label }: { id: Tab, icon: any, label: string }) => (
    <button 
        onClick={() => changeTab(id)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
            activeTab === id 
            ? 'bg-brand-50 text-brand-600 shadow-sm' 
            : 'text-slate-500 hover:bg-white hover:text-slate-700'
        }`}
    >
        <Icon size={20} className={activeTab === id ? 'text-brand-600' : 'text-slate-400'} />
        {label}
        {activeTab === id && <ChevronRight size={16} className="ml-auto opacity-50"/>}
    </button>
  );

  // --- DATE LABEL HELPER ---
  const getDateLabel = () => {
      switch(dateRange) {
          case 'today': return 'Hoje';
          case 'yesterday': return 'Ontem';
          case '7days': return 'Últimos 7 dias';
          case '15days': return 'Últimos 15 dias';
          case '30days': return 'Últimos 30 dias';
          case '60days': return 'Últimos 60 dias';
          case '90days': return 'Últimos 90 dias';
          case '6months': return 'Últimos 6 meses';
          case 'year': return 'Último ano';
          case 'custom': return 'Período personalizado';
          default: return 'Selecione';
      }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94A3B8;
        }
      `}</style>
      
      {/* PWA INSTALL PROMPT MODAL */}
      {showInstallModal && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-[#1a1a1a] border border-gray-800 w-full max-w-sm p-6 rounded-2xl shadow-2xl animate-in slide-in-from-bottom duration-300">
                  <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-brand-600 to-brand-800 rounded-xl flex items-center justify-center text-white shadow-lg">
                          <Wallet size={24} />
                      </div>
                      <div>
                          <h3 className="text-white font-bold text-lg leading-none">PayEasy App</h3>
                          <p className="text-gray-400 text-xs mt-1">Gerencie suas vendas de qualquer lugar.</p>
                      </div>
                  </div>
                  <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                      Instale o aplicativo oficial para ter acesso rápido e notificações de vendas em tempo real.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => { setShowInstallModal(false); localStorage.setItem('payeasy_install_prompt_seen', 'true'); }} className="py-3 px-4 rounded-xl text-gray-400 font-bold text-sm hover:bg-white/5 transition-colors">
                          Agora não
                      </button>
                      <button onClick={handleInstallClick} className="py-3 px-4 rounded-xl bg-white text-black font-bold text-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                          <Download size={16}/> Instalar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:flex w-64 bg-surface border-r border-gray-100 flex-col p-6 z-20">
         <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-glow">
               <Wallet size={20} />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Pay<span className="text-brand-600">Easy</span></span>
         </div>

         <nav className="flex-1 space-y-2">
             <SidebarItem id="overview" icon={LayoutDashboard} label="Visão Geral" />
             <SidebarItem id="metrics" icon={BarChart2} label="Métricas" />
             <SidebarItem id="sales" icon={TrendingUp} label="Vendas" />
             <SidebarItem id="products" icon={ShoppingBag} label="Produtos" />
             <SidebarItem id="links" icon={LinkIcon} label="Links" />
             <SidebarItem id="settings" icon={Settings} label="Configurações" />
         </nav>

         <div className="mt-auto pt-6 border-t border-gray-50">
             <button onClick={onLogout} className="flex items-center gap-3 text-sm font-medium text-slate-500 hover:text-red-500 transition-colors px-4 py-2">
                 <LogOut size={18} />
                 Sair
             </button>
         </div>
      </aside>

      {/* MOBILE HEADER & OVERLAY */}
      {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)}>
              <div className="absolute left-0 top-0 bottom-0 w-64 bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-8">
                       <span className="text-xl font-bold">Menu</span>
                       <button onClick={() => setMobileMenuOpen(false)}><XIcon size={24}/></button>
                  </div>
                  <nav className="space-y-2">
                      <SidebarItem id="overview" icon={LayoutDashboard} label="Visão Geral" />
                      <SidebarItem id="metrics" icon={BarChart2} label="Métricas" />
                      <SidebarItem id="sales" icon={TrendingUp} label="Vendas" />
                      <SidebarItem id="products" icon={ShoppingBag} label="Produtos" />
                      <SidebarItem id="links" icon={LinkIcon} label="Links" />
                      <SidebarItem id="settings" icon={Settings} label="Configurações" />
                  </nav>
              </div>
          </div>
      )}

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
          
          {/* HEADER FIXED */}
          <header className="h-20 bg-surface border-b border-gray-100 flex items-center justify-between px-6 z-10 sticky top-0">
              <div className="flex items-center gap-4">
                  <button className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-lg" onClick={() => setMobileMenuOpen(true)}>
                      <Menu size={24}/>
                  </button>
                  
                  {/* Left: User Profile */}
                  <div className="hidden md:flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-700 font-bold">
                          {profile.fullName.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800 leading-tight">{profile.fullName}</span>
                          <span className="text-xs text-slate-400">Empreendedor</span>
                      </div>
                  </div>
              </div>

              {/* Center: Search */}
              <div className="flex-1 max-w-md mx-4 hidden md:block">
                  <div className="relative group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                      <input 
                         type="text" 
                         placeholder="Buscar por ID ou Cliente..." 
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         className="w-full bg-background border border-transparent focus:border-brand-200 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400"
                      />
                  </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-4">
                  <div className="relative">
                      <button 
                        onClick={() => { setShowNotificationsDropdown(!showNotificationsDropdown); if(unreadCount > 0) markNotificationsRead(); }}
                        className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-brand-600 transition-all relative"
                      >
                          <Bell size={20} />
                          {unreadCount > 0 && (
                              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                          )}
                      </button>
                      
                      {/* Notifications Dropdown */}
                      {showNotificationsDropdown && (
                          <div className="absolute right-0 top-full mt-4 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                              <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                  <h4 className="font-bold text-slate-900 text-sm">Notificações</h4>
                                  <button className="text-xs text-brand-600 font-bold hover:underline" onClick={() => setShowNotificationsDropdown(false)}>Fechar</button>
                              </div>
                              <div className="max-h-[300px] overflow-y-auto">
                                  {notifications.length === 0 ? (
                                      <div className="p-8 text-center text-slate-400 text-sm">Tudo limpo por aqui!</div>
                                  ) : (
                                      notifications.map((notif) => (
                                          <div key={notif.id} className={`p-4 border-b border-gray-50 hover:bg-brand-50/30 transition-colors ${!notif.read ? 'bg-brand-50/10' : ''}`}>
                                              <div className="flex justify-between items-start mb-1">
                                                  <span className="font-bold text-slate-800 text-sm line-clamp-1">{notif.title}</span>
                                                  <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                              </div>
                                              <p className="text-xs text-slate-500 leading-relaxed">{notif.message}</p>
                                          </div>
                                      ))
                                  )}
                              </div>
                          </div>
                      )}
                  </div>
                  <button 
                    onClick={handleOpenNewProduct}
                    className="hidden sm:flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                  >
                      <Plus size={18} />
                      <span className="hidden lg:inline">Novo Produto</span>
                  </button>
              </div>
          </header>

          {/* CONTENT SCROLLABLE */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
             <div className="max-w-7xl mx-auto">
                {activeTab === 'overview' && (
                    <div className="flex flex-col xl:flex-row gap-8">
                        {/* LEFT COLUMN (MAIN STATS) */}
                        <div className="flex-1 space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-4">Visão Geral das suas vendas aprovadas</h2>
                                {/* Advanced Filters (Overview version - simplified) */}
                                <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-2 text-slate-500 text-sm px-2">
                                        <Filter size={16} />
                                        <span className="font-bold">Filtrar:</span>
                                    </div>
                                    <select value={dateRange} onChange={(e) => setDateRange(e.target.value as DateRange)} className="appearance-none bg-gray-50 border border-gray-200 text-slate-700 text-sm rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-2.5 pr-8 font-medium cursor-pointer">
                                        <option value="today">Hoje</option>
                                        <option value="7days">Últimos 7 dias</option>
                                        <option value="30days">Últimos 30 dias</option>
                                    </select>
                                </div>
                            </div>

                            {/* KPI CARDS (Filtered) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                <div className="bg-surface p-5 rounded-2xl shadow-card border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden group hover:border-brand-200 transition-colors">
                                    <div className="flex justify-between items-start z-10">
                                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Receita Bruta</span>
                                        <div className="p-2 bg-brand-50 rounded-lg text-brand-600"><Wallet size={16}/></div>
                                    </div>
                                    <div className="z-10">
                                        {loading ? <Skeleton className="h-8 w-32 mt-1" /> : <div className="text-2xl font-bold text-slate-900">{grossRevenue.toLocaleString()} MT</div>}
                                    </div>
                                </div>

                                <div className="bg-surface p-5 rounded-2xl shadow-card border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden group hover:border-green-200 transition-colors">
                                    <div className="flex justify-between items-start z-10">
                                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Receita Líquida</span>
                                        <div className="p-2 bg-green-50 rounded-lg text-green-600"><DollarSign size={16}/></div>
                                    </div>
                                    <div className="z-10">
                                        {loading ? <Skeleton className="h-8 w-32 mt-1" /> : <div className="text-2xl font-bold text-slate-900">{netRevenue.toLocaleString()} MT</div>}
                                    </div>
                                </div>

                                <div className="bg-surface p-5 rounded-2xl shadow-card border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden group hover:border-blue-200 transition-colors">
                                    <div className="flex justify-between items-start z-10">
                                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Conversão</span>
                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Activity size={16}/></div>
                                    </div>
                                    <div className="z-10">
                                        {loading ? <Skeleton className="h-8 w-16 mt-1" /> : <div className="text-2xl font-bold text-slate-900">{calculateCVR()}%</div>}
                                    </div>
                                </div>

                                <div className="bg-surface p-5 rounded-2xl shadow-card border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden group hover:border-purple-200 transition-colors">
                                    <div className="flex justify-between items-start z-10">
                                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Aprovadas</span>
                                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><ShoppingBag size={16}/></div>
                                    </div>
                                    <div className="z-10">
                                        {loading ? <Skeleton className="h-8 w-12 mt-1" /> : <div className="text-2xl font-bold text-slate-900">{filteredApprovedSales.length}</div>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN (LIVE FEED) */}
                        <div className="w-full xl:w-80 flex-shrink-0 space-y-6">
                             <div className="bg-surface rounded-2xl shadow-card border border-gray-100 overflow-hidden flex flex-col h-[500px]">
                                 <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                                     <div className="flex items-center gap-2">
                                         <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                         <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Ao Vivo</span>
                                     </div>
                                 </div>
                                 
                                 <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                                     {loading ? (
                                        Array(5).fill(0).map((_, i) => (
                                            <div key={i} className="p-3 bg-white rounded-xl border border-gray-50">
                                                <div className="flex justify-between mb-2"><Skeleton className="h-4 w-24"/><Skeleton className="h-4 w-12"/></div>
                                                <div className="flex justify-between"><Skeleton className="h-3 w-16"/><Skeleton className="h-3 w-10"/></div>
                                            </div>
                                        ))
                                     ) : (
                                        sales.slice(0, 15).map((sale) => (
                                            <div key={sale.id} className="p-3 bg-white rounded-xl border border-gray-100 hover:border-brand-200 shadow-sm transition-all group">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-xs font-bold text-slate-700 line-clamp-1 group-hover:text-brand-600 transition-colors">{sale.product_name}</span>
                                                    <span className="text-xs font-bold text-slate-900">{sale.amount} MT</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-1.5">
                                                        <img 
                                                            src={sale.payment_method === 'mpesa' ? mpesaLogo : emolaLogo} 
                                                            alt={sale.payment_method} 
                                                            className="h-4 w-auto object-contain rounded-sm"
                                                        />
                                                    </div>
                                                    <span className="text-[10px] text-slate-300">Há {Math.floor((new Date().getTime() - new Date(sale.created_at).getTime()) / 60000)}m</span>
                                                </div>
                                            </div>
                                        ))
                                     )}
                                     {!loading && sales.length === 0 && (
                                         <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                                             <Zap size={24} className="opacity-20"/>
                                             <span className="text-xs">Aguardando vendas...</span>
                                         </div>
                                     )}
                                 </div>
                             </div>
                        </div>
                    </div>
                )}

                {/* --- METRICS TAB (REDESIGNED) --- */}
                {activeTab === 'metrics' && (
                    <div className="space-y-6">
                        
                         {/* 1. Header with Filters (Styled like screenshot) */}
                         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            {/* Product Selector - Simple Dropdown Left */}
                             <div className="relative">
                                 <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-3 py-2 cursor-pointer hover:border-brand-300 transition-colors group">
                                    <BarChart2 size={16} className="text-slate-500 group-hover:text-brand-600" />
                                    <select 
                                        value={selectedProductId} 
                                        onChange={(e) => setSelectedProductId(e.target.value)} 
                                        className="appearance-none bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer pr-4"
                                    >
                                        <option value="all">Todos os produtos</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="text-slate-400 absolute right-3 pointer-events-none" />
                                 </div>
                             </div>

                             {/* Date Selector - Custom Green Dropdown Right */}
                             <div className="relative z-50">
                                 <button 
                                    onClick={() => setShowDateDropdown(!showDateDropdown)}
                                    className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:border-gray-300 transition-all shadow-sm"
                                 >
                                     <Calendar size={16} className="text-slate-500" />
                                     {getDateLabel()}
                                     <ChevronDown size={14} className="text-slate-400 ml-2" />
                                 </button>

                                 {showDateDropdown && (
                                     <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                         <div className="bg-[#00C49F] px-4 py-2 text-white text-sm font-medium">
                                             {getDateLabel()}
                                         </div>
                                         <div className="py-2">
                                             <button onClick={() => { setDateRange('today'); setShowDateDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-gray-50 hover:text-brand-600 transition-colors">Hoje</button>
                                             <button onClick={() => { setDateRange('yesterday'); setShowDateDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-gray-50 hover:text-brand-600 transition-colors">Ontem</button>
                                             
                                             <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Períodos</div>
                                             
                                             <button onClick={() => { setDateRange('7days'); setShowDateDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-gray-50 hover:text-brand-600 transition-colors">Últimos 7 dias</button>
                                             <button onClick={() => { setDateRange('15days'); setShowDateDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-gray-50 hover:text-brand-600 transition-colors">Últimos 15 dias</button>
                                             <button onClick={() => { setDateRange('30days'); setShowDateDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-gray-50 hover:text-brand-600 transition-colors">Últimos 30 dias</button>
                                             <button onClick={() => { setDateRange('60days'); setShowDateDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-gray-50 hover:text-brand-600 transition-colors">Últimos 60 dias</button>
                                             <button onClick={() => { setDateRange('90days'); setShowDateDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-gray-50 hover:text-brand-600 transition-colors">Últimos 90 dias</button>
                                             <button onClick={() => { setDateRange('6months'); setShowDateDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-gray-50 hover:text-brand-600 transition-colors">Últimos 6 meses</button>
                                             <button onClick={() => { setDateRange('year'); setShowDateDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-gray-50 hover:text-brand-600 transition-colors">Último ano</button>
                                             
                                             <div className="border-t border-gray-50 mt-1 pt-1">
                                                <button onClick={() => { setDateRange('custom'); setShowDateDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-gray-50 flex items-center gap-2"><Calendar size={14}/> Período personalizado</button>
                                             </div>
                                         </div>
                                     </div>
                                 )}
                             </div>
                         </div>

                        {/* 2. Tabs Navigation */}
                        <div className="flex border-b border-gray-200 overflow-x-auto">
                            {[
                                { id: 'resumo', label: 'Resumo', icon: TrendingUp },
                                { id: 'checkout', label: 'Performance do Checkout', icon: ShoppingBag },
                                { id: 'gateway', label: 'Performance por Gateway', icon: CreditCard },
                                { id: 'historico', label: 'Histórico de Vendas', icon: PieChart },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setMetricsSubTab(tab.id as MetricsSubTab)}
                                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                                        metricsSubTab === tab.id 
                                        ? 'border-[#00C49F] text-[#00C49F]' 
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {metricsSubTab === 'resumo' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* 3. KPI Cards - Clean Style */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="text-sm text-slate-500 mb-2">Total</div>
                                        {loading ? <Skeleton className="h-8 w-16 mb-1"/> : <div className="text-3xl font-bold text-slate-900">{filteredSales.length}</div>}
                                        <div className="text-xs text-slate-400">transações</div>
                                    </div>
                                    <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                        <div className="flex justify-between items-start">
                                            <div className="text-sm text-[#00C49F] mb-2 font-medium">Sucesso</div>
                                            <CheckCircle2 size={16} className="text-[#00C49F]" />
                                        </div>
                                        {loading ? <Skeleton className="h-8 w-16 mb-1"/> : <div className="text-3xl font-bold text-slate-900">{filteredApprovedSales.length}</div>}
                                        <div className="text-xs text-[#00C49F] opacity-80">{loading ? <Skeleton className="h-3 w-10"/> : `${calculateCVR()}% taxa`}</div>
                                    </div>
                                    <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-[#FFFDF5]">
                                        <div className="flex justify-between items-start">
                                            <div className="text-sm text-amber-600 mb-2 font-medium">Pendente</div>
                                            <RefreshCw size={16} className="text-amber-600" />
                                        </div>
                                        {loading ? <Skeleton className="h-8 w-16 mb-1"/> : <div className="text-3xl font-bold text-slate-900">{filteredSales.filter(s => s.status === 'pending').length}</div>}
                                        <div className="text-xs text-amber-600 opacity-80">aguardando</div>
                                    </div>
                                    <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-[#FFF5F5]">
                                        <div className="flex justify-between items-start">
                                            <div className="text-sm text-red-600 mb-2 font-medium">Falhas</div>
                                            <XIcon size={16} className="text-red-600" />
                                        </div>
                                        {loading ? <Skeleton className="h-8 w-16 mb-1"/> : <div className="text-3xl font-bold text-slate-900">{filteredSales.filter(s => s.status === 'cancelled').length}</div>}
                                        <div className="text-xs text-red-600 opacity-80">0% taxa</div>
                                    </div>
                                    <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow opacity-60">
                                        <div className="flex justify-between items-start">
                                            <div className="text-sm text-purple-600 mb-2 font-medium">Reembolsos</div>
                                        </div>
                                        <div className="text-3xl font-bold text-slate-900">0</div>
                                        <div className="text-xs text-purple-600 opacity-80">0% taxa</div>
                                    </div>
                                </div>

                                {/* 4. Chart Section */}
                                <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                                    <h3 className="text-slate-800 font-bold mb-6">Transações por Hora</h3>
                                    {loading ? (
                                        <div className="h-48 w-full flex items-end gap-2">
                                            {Array(24).fill(0).map((_, i) => (
                                                <Skeleton key={i} className="flex-1 rounded-t-sm" style={{height: `${Math.random() * 80 + 20}%`}} />
                                            ))}
                                        </div>
                                    ) : (
                                        renderHourlyChart()
                                    )}
                                </div>
                            </div>
                        )}

                        {metricsSubTab === 'historico' && (
                             <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data</th>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Valor</th>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm divide-y divide-gray-100">
                                            {loading ? (
                                                Array(5).fill(0).map((_, i) => (
                                                    <tr key={i}>
                                                        <td className="p-4"><Skeleton className="h-4 w-16"/></td>
                                                        <td className="p-4"><Skeleton className="h-4 w-24"/></td>
                                                        <td className="p-4"><Skeleton className="h-4 w-32"/></td>
                                                        <td className="p-4"><Skeleton className="h-4 w-16"/></td>
                                                        <td className="p-4"><Skeleton className="h-6 w-20 rounded-full"/></td>
                                                    </tr>
                                                ))
                                            ) : (
                                                filteredSales.map(sale => (
                                                    <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-4 font-mono text-xs text-slate-400">#{sale.id.slice(0,8)}</td>
                                                        <td className="p-4 text-slate-500 text-xs">{new Date(sale.created_at).toLocaleString()}</td>
                                                        <td className="p-4 font-medium text-slate-800">{sale.customer_name}</td>
                                                        <td className="p-4 font-bold">{sale.amount.toLocaleString()} MT</td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                                sale.status === 'approved' ? 'bg-[#00C49F]/10 text-[#00C49F]' : 
                                                                sale.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                                                                'bg-red-100 text-red-700'
                                                            }`}>
                                                                {sale.status === 'approved' ? 'Sucesso' : sale.status === 'pending' ? 'Pendente' : 'Falha'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                             </div>
                        )}
                        
                        {(metricsSubTab === 'checkout' || metricsSubTab === 'gateway') && (
                            <div className="bg-white p-12 rounded-lg border border-dashed border-gray-200 text-center">
                                <p className="text-slate-400">Funcionalidade em desenvolvimento.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* OTHER TABS */}
                {activeTab !== 'overview' && activeTab !== 'metrics' && (
                    <div className="space-y-6">
                        {activeTab === 'products' && (
                             <div className="space-y-6">
                                <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                                   <h2 className="text-xl font-bold text-slate-900">Meus Produtos</h2>
                                   <button onClick={handleOpenNewProduct} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold flex items-center gap-2 text-sm shadow-md hover:bg-slate-800 transition-colors"><Plus size={16} /> Novo</button>
                                </div>
                                {loading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {[1,2,3].map(i => (
                                            <div key={i} className="bg-white p-4 rounded-xl border border-gray-100">
                                                <div className="flex gap-4 mb-4">
                                                    <Skeleton className="w-16 h-16 rounded-lg"/>
                                                    <div className="flex-1 space-y-2">
                                                        <Skeleton className="h-4 w-3/4"/>
                                                        <Skeleton className="h-4 w-1/2"/>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between pt-2">
                                                    <Skeleton className="h-8 w-20 rounded-lg"/>
                                                    <Skeleton className="h-8 w-20 rounded-lg"/>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : 
                                 products.length === 0 ? <div className="text-center py-20 text-slate-500">Nenhum produto encontrado.</div> :
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                     {products.map(product => (
                                         <div key={product.id} className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-card-hover hover:border-brand-100 transition-all flex flex-col group">
                                             <div className="flex gap-4 mb-4">
                                                 <div className="w-16 h-16 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                                                    {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover"/> : <ImageIcon className="text-slate-300" size={20}/>}
                                                 </div>
                                                 <div className="flex-1 min-w-0">
                                                     <h3 className="font-bold text-slate-900 truncate text-sm mb-1">{product.name}</h3>
                                                     <div className="flex justify-between items-center">
                                                         <span className="text-brand-600 font-bold text-sm">{product.price.toLocaleString()} MT</span>
                                                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${product.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{product.status}</span>
                                                     </div>
                                                 </div>
                                             </div>
                                             <div className="grid grid-cols-2 gap-2 border-t border-gray-50 pt-3 mt-auto">
                                                 <button onClick={() => handleEditProduct(product)} className="py-2 bg-gray-50 text-slate-600 text-xs font-bold rounded-lg hover:bg-gray-100 flex justify-center items-center gap-1 transition-colors"><Edit3 size={14}/> Editar</button>
                                                 <button onClick={() => openDeleteModal('product', product.id, product.name)} className="py-2 bg-red-50 text-red-500 text-xs font-bold rounded-lg hover:bg-red-100 flex justify-center items-center gap-1 transition-colors"><Trash2 size={14}/> Excluir</button>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                                }
                             </div>
                        )}

                        {activeTab === 'links' && (
                             <div className="space-y-6">
                                <div className="border-b border-gray-200 pb-4">
                                     <h2 className="text-xl font-bold text-slate-900">Links de Pagamento</h2>
                                     <p className="text-sm text-slate-500">Gere links diretos para seus clientes pagarem.</p>
                                </div>
                                <div className="bg-surface p-6 rounded-2xl border border-gray-100 shadow-card flex flex-col md:flex-row gap-4 items-end">
                                    <div className="flex-1 w-full space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Selecionar Produto</label>
                                        <select value={selectedProductIdForLink} onChange={e => setSelectedProductIdForLink(e.target.value)} className="w-full p-3 bg-background border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500 transition-colors">
                                            <option value="">Selecione um produto...</option>
                                            {products.filter(p=>p.status==='active').map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <button onClick={() => generateLink()} disabled={isCreatingLink || !selectedProductIdForLink} className="w-full md:w-auto px-6 py-3 bg-brand-600 text-white font-bold rounded-xl text-sm hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 transition-all">
                                        {isCreatingLink ? <Loader2 className="animate-spin" size={18}/> : <LinkIcon size={18}/>} 
                                        Gerar Link
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {paymentLinks.length === 0 ? <div className="text-center py-10 text-slate-400 text-sm">Nenhum link gerado.</div> : 
                                    paymentLinks.map(link => (
                                        <div key={link.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 hover:border-brand-100 transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-900 text-sm truncate mb-1">{link.product_name}</h4>
                                                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono bg-gray-50 px-2 py-1 rounded w-fit">
                                                    <ExternalLink size={12}/> {link.url}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => navigator.clipboard.writeText(link.url).then(()=>alert("Copiado!"))} className="p-2.5 text-slate-500 hover:text-brand-600 bg-gray-50 hover:bg-brand-50 rounded-lg transition-colors"><Copy size={16}/></button>
                                                <a href={link.url} target="_blank" className="p-2.5 text-slate-500 hover:text-brand-600 bg-gray-50 hover:bg-brand-50 rounded-lg transition-colors"><ExternalLink size={16}/></a>
                                                <button onClick={() => openDeleteModal('link', link.id, link.product_name)} className="p-2.5 text-slate-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        )}

                        {activeTab === 'sales' && (
                             <div className="space-y-6">
                                 <div className="pb-4 border-b border-gray-200">
                                    <h2 className="text-xl font-bold text-slate-900">Histórico de Vendas</h2>
                                    <p className="text-sm text-slate-500">Acompanhe todas as transações realizadas.</p>
                                 </div>
                                 <div className="bg-surface rounded-2xl border border-gray-100 shadow-card overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                <tr>
                                                    <th className="p-5 pl-6">ID</th>
                                                    <th className="p-5">Produto</th>
                                                    <th className="p-5">Cliente</th>
                                                    <th className="p-5">Valor</th>
                                                    <th className="p-5">Método</th>
                                                    <th className="p-5">Data</th>
                                                    <th className="p-5">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm">
                                                {filteredSales.map(sale => (
                                                    <tr key={sale.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                        <td className="p-5 pl-6 font-mono text-xs text-slate-400">#{sale.id.slice(0,8)}</td>
                                                        <td className="p-5 font-bold text-slate-800">{sale.product_name}</td>
                                                        <td className="p-5 text-slate-600">
                                                            <div className="font-medium">{sale.customer_name}</div>
                                                            <div className="text-xs text-slate-400">{sale.customer_phone}</div>
                                                        </td>
                                                        <td className="p-5 font-bold text-slate-900">{sale.amount.toLocaleString()} MT</td>
                                                        <td className="p-5">
                                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium uppercase">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${sale.payment_method === 'mpesa' ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                                                                {sale.payment_method}
                                                            </div>
                                                        </td>
                                                        <td className="p-5 text-xs text-slate-500">{new Date(sale.created_at).toLocaleDateString()}</td>
                                                        <td className="p-5">
                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
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
                                                    <tr><td colSpan={7} className="p-8 text-center text-slate-400 text-sm">Nenhuma venda encontrada.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                 </div>
                             </div>
                        )}

                        {activeTab === 'settings' && (
                             <div className="max-w-2xl mx-auto py-6 space-y-6">
                                 <div className="pb-4 border-b border-gray-200">
                                    <h2 className="text-xl font-bold text-slate-900">Configurações</h2>
                                    <p className="text-sm text-slate-500">Gerencie seu perfil e preferências.</p>
                                 </div>
                                 
                                 <div className="bg-surface rounded-2xl border border-gray-100 shadow-card overflow-hidden">
                                     <div className="p-6 border-b border-gray-50">
                                         <h3 className="font-bold text-slate-900 mb-1">Perfil do Usuário</h3>
                                         <p className="text-sm text-slate-400">Suas informações pessoais.</p>
                                     </div>
                                     <div className="p-6 space-y-6">
                                         <div className="flex items-center gap-4 mb-4">
                                             <div className="w-16 h-16 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 font-bold text-2xl">
                                                 {profile.fullName.charAt(0)}
                                             </div>
                                             <div>
                                                 <button className="text-sm text-brand-600 font-bold hover:underline">Alterar foto</button>
                                             </div>
                                         </div>
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                             <div className="space-y-1">
                                                 <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo</label>
                                                 <div className="relative">
                                                     <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                                     <input type="text" value={profile.fullName} readOnly className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-slate-600 cursor-not-allowed"/>
                                                 </div>
                                             </div>
                                             <div className="space-y-1">
                                                 <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                                                 <div className="relative">
                                                     <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                                     <input type="text" value={profile.email} readOnly className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-slate-600 cursor-not-allowed"/>
                                                 </div>
                                             </div>
                                             <div className="space-y-1">
                                                 <label className="text-xs font-bold text-slate-500 uppercase">Telefone</label>
                                                 <div className="relative">
                                                     <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                                     <input type="text" value={profile.phone} readOnly className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-slate-600 cursor-not-allowed"/>
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                     <div className="p-4 bg-gray-50 text-right">
                                         <button disabled className="bg-slate-300 text-white px-6 py-2 rounded-xl text-sm font-bold cursor-not-allowed">Salvar Alterações</button>
                                     </div>
                                 </div>

                                 <div className="bg-red-50 rounded-2xl border border-red-100 p-6 flex items-center justify-between">
                                     <div>
                                         <h3 className="font-bold text-red-900 text-sm">Zona de Perigo</h3>
                                         <p className="text-xs text-red-700 mt-1">Sair da sua conta encerrará sua sessão atual.</p>
                                     </div>
                                     <button onClick={onLogout} className="px-4 py-2 border border-red-200 text-red-600 font-bold rounded-xl text-sm hover:bg-red-100 transition-colors">Sair da Conta</button>
                                 </div>
                             </div>
                        )}
                    </div>
                )}
             </div>
          </main>
      </div>

      {/* Product Modal - Updated Style */}
      {showProductModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] border border-gray-100">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Editar Produto' : 'Criar Novo Produto'}</h2>
                    <p className="text-sm text-slate-500">Preencha os detalhes para começar a vender.</p>
                </div>
                <button onClick={() => setShowProductModal(false)}><X size={24} className="text-slate-400 hover:text-slate-600"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-surface">
               <div className="space-y-6">
                   {productFormStep === 1 && (
                       <div className="space-y-5">
                           <div>
                               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nome do Produto</label>
                               <input type="text" className="w-full p-3.5 bg-background border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" placeholder="Ex: Curso de Marketing" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Descrição</label>
                               <div className="relative">
                                   <textarea className="w-full p-3.5 bg-background border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none min-h-[120px]" placeholder="Detalhes do produto..." value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})}></textarea>
                                   <button onClick={handleGenerateDescriptionAI} disabled={isGeneratingAI} className="absolute bottom-3 right-3 text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg text-xs font-bold flex gap-1 items-center disabled:opacity-50 hover:bg-brand-100 transition-colors">{isGeneratingAI ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>} IA</button>
                               </div>
                           </div>
                           <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Imagem URL</label>
                                <div className="flex gap-2">
                                     <input type="text" className="w-full p-3.5 bg-background border border-gray-200 rounded-xl text-sm" placeholder="https://..." value={newProduct.image_url || ''} onChange={e => setNewProduct({...newProduct, image_url: e.target.value})} />
                                     <button onClick={() => productImageInputRef.current?.click()} className="px-4 bg-gray-50 border border-gray-200 rounded-xl text-slate-600 hover:bg-gray-100"><UploadCloud size={20}/></button>
                                     <input type="file" className="hidden" ref={productImageInputRef} onChange={handleProductImageUpload} accept="image/*" />
                                </div>
                           </div>
                       </div>
                   )}
                   {productFormStep === 2 && (
                       <div className="space-y-5">
                           <div>
                               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Preço (MT)</label>
                               <input type="number" className="w-full p-3.5 bg-background border border-gray-200 rounded-xl text-sm font-bold" placeholder="0.00" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} />
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Link de Entrega</label>
                               <input type="url" className="w-full p-3.5 bg-background border border-gray-200 rounded-xl text-sm" placeholder="https://drive.google.com..." value={newProduct.redemption_link || ''} onChange={e => setNewProduct({...newProduct, redemption_link: e.target.value})} />
                           </div>
                           <div className="bg-brand-50/50 p-5 rounded-xl border border-brand-100 space-y-4">
                               <div className="flex items-center justify-between">
                                   <span className="text-sm font-bold text-slate-700 flex items-center gap-2"><Clock size={16}/> Oferta Limitada</span>
                                   <input type="checkbox" checked={newProduct.is_limited_time} onChange={e => setNewProduct({...newProduct, is_limited_time: e.target.checked})} className="w-5 h-5 text-brand-600 rounded focus:ring-brand-500 cursor-pointer"/>
                               </div>
                               <div className="flex items-center justify-between">
                                   <span className="text-sm font-bold text-slate-700 flex items-center gap-2"><Zap size={16}/> Order Bump</span>
                                   <input type="checkbox" checked={newProduct.has_offer} onChange={e => setNewProduct({...newProduct, has_offer: e.target.checked})} className="w-5 h-5 text-brand-600 rounded focus:ring-brand-500 cursor-pointer"/>
                               </div>
                               {newProduct.has_offer && (<div className="grid grid-cols-2 gap-3 pt-2"><input type="text" placeholder="Título Extra" className="p-3 border rounded-lg text-sm" value={newProduct.offer_title} onChange={e => setNewProduct({...newProduct, offer_title: e.target.value})} /><input type="number" placeholder="Preço" className="p-3 border rounded-lg text-sm" value={newProduct.offer_price || ''} onChange={e => setNewProduct({...newProduct, offer_price: parseFloat(e.target.value)})} /></div>)}
                           </div>
                       </div>
                   )}
                   {productFormStep === 3 && (
                       <div className="text-center py-8">
                           <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 shadow-lg shadow-green-100"><Save size={32}/></div>
                           <h3 className="font-bold text-xl text-slate-900 mb-2">Pronto para publicar?</h3>
                           <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto">Seu produto estará disponível para venda imediatamente após a confirmação.</p>
                       </div>
                   )}
               </div>
            </div>
            <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                {productFormStep > 1 ? <button onClick={() => setProductFormStep(s => s-1)} className="text-slate-600 text-sm font-bold hover:text-slate-900">Voltar</button> : <div/>}
                {productFormStep < 3 && <button onClick={() => setProductFormStep(s => s+1)} className="bg-slate-900 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all">Continuar</button>}
                {productFormStep === 3 && <button onClick={() => saveProduct('active')} disabled={isSavingProduct} className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-brand-700 shadow-lg shadow-brand-500/20">{isSavingProduct ? <Loader2 className="animate-spin" size={18} /> : null}{isSavingProduct ? 'Salvando...' : 'Publicar Produto'}</button>}
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Modal */}
      {deleteModal.isOpen && (
         <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
             <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                 <h3 className="text-lg font-bold text-slate-900 mb-2">Excluir item?</h3>
                 <p className="text-slate-500 text-sm mb-6">Tem certeza que deseja excluir "{deleteModal.title}"? Esta ação não pode ser desfeita.</p>
                 <div className="flex gap-3">
                     <button onClick={() => setDeleteModal({ isOpen: false, type: null, id: null, title: '' })} className="flex-1 py-2.5 bg-gray-100 text-slate-700 font-bold rounded-xl hover:bg-gray-200">Cancelar</button>
                     <button onClick={handleDeleteItem} className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600">Excluir</button>
                 </div>
             </div>
         </div>
      )}

    </div>
  );
};

export default Dashboard;