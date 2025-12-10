import React, { useState, useEffect, useRef } from 'react';
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
  Filter
} from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { GoogleGenAI } from "@google/genai";

type Tab = 'overview' | 'products' | 'links' | 'sales' | 'settings';
type ProductStatus = 'draft' | 'analyzing' | 'active' | 'rejected';
type ProductCategory = 'ebooks' | 'cursos' | 'mentoria' | 'software' | 'audio' | 'templates' | 'outros';
type PaymentMethod = 'mpesa' | 'emola';
type SaleStatus = 'approved' | 'pending' | 'cancelled';

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

const Dashboard: React.FC<DashboardProps> = ({ session, onLogout, initialTab = 'overview' }) => {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const productImageInputRef = useRef<HTMLInputElement>(null);

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

  // Helper Functions
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const calculateGrossRevenue = (salesData: Sale[]) => {
      return salesData.filter(s => s.status === 'approved').reduce((acc, curr) => acc + curr.amount, 0);
  };

  const calculateNetRevenue = (salesData: Sale[]) => {
      return salesData.filter(s => s.status === 'approved').reduce((acc, curr) => {
          // 4.9% + 5MT fee logic
          const fee = (curr.amount * 0.049) + 5;
          return acc + (curr.amount - fee);
      }, 0);
  };

  // Sync Tab with URL (Safe version)
  const changeTab = (tab: Tab) => {
      setActiveTab(tab);
      try {
        window.history.pushState({}, '', `/dashboard/${tab}`);
      } catch (e) {
        // Ignore SecurityError in restricted environments
      }
      setMobileMenuOpen(false);
  };

  const fetchData = async () => {
    setLoading(true);
    
    try {
        // Fetch Products
        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (productsData) setProducts(productsData);

        // Fetch Links
        const { data: linksData } = await supabase
        .from('payment_links')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
        
        if (linksData) setPaymentLinks(linksData);

        // Fetch Sales (Mocked structure for now as table might not exist in first migration)
        const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

        if (!salesError && salesData) {
            setSales(salesData);
        } else {
             // If table doesn't exist, we keep empty array
             setSales([]);
        }

    } catch (e) {
        console.error("Error fetching data", e);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    
    const channel = supabase.channel('dashboard_updates')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `user_id=eq.${session.user.id}` }, (payload) => {
         if (payload.eventType === 'INSERT') setProducts(prev => [payload.new as Product, ...prev]);
    })
    .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- ACTIONS ---

  const generateLink = async (prodId?: string) => {
    const targetId = prodId || selectedProductIdForLink;
    if (!targetId) return;

    setIsCreatingLink(true);
    try {
        const product = products.find(p => p.id === targetId);
        if (!product) throw new Error("Produto não encontrado");

        const newLinkPayload = {
            user_id: session.user.id,
            product_id: product.id,
            product_name: product.name,
            url: 'pending...',
        };

        const { data, error } = await supabase.from('payment_links').insert([newLinkPayload]).select().single();

        if (error) throw error;
        if (!data) throw new Error("Falha ao criar link");

        const finalUrl = `https://fastpayzinmoz.vercel.app/p/${product.id}?ref=${data.id}`;
        
        const { data: updatedData, error: updateError } = await supabase
            .from('payment_links')
            .update({ url: finalUrl })
            .eq('id', data.id)
            .select()
            .single();
            
        if (updateError) throw updateError;

        setPaymentLinks(prev => [updatedData || data, ...prev]);
        setSelectedProductIdForLink('');
        if (activeTab !== 'links') changeTab('links');

    } catch (e: any) {
        alert("Erro: " + e.message);
    } finally {
        setIsCreatingLink(false);
    }
  };

  const openDeleteModal = (type: 'product' | 'link', id: string, name: string) => {
      setDeleteModal({
          isOpen: true,
          type,
          id,
          title: name
      });
  };

  const confirmDelete = async () => {
      const { type, id } = deleteModal;
      if (!id || !type) return;

      setDeleteModal({ ...deleteModal, isOpen: false });

      const previousProducts = [...products];
      const previousLinks = [...paymentLinks];

      if (type === 'link') {
          setPaymentLinks(prev => prev.filter(item => item.id !== id));
      } else {
          setProducts(prev => prev.filter(item => item.id !== id));
          setPaymentLinks(prev => prev.filter(item => item.product_id !== id));
      }

      try {
          if (type === 'link') {
              const { error, data } = await supabase.from('payment_links').delete().eq('id', id).select();
              if (error) throw error;
              if (!data || data.length === 0) {
                  throw new Error("O item não foi apagado. Verifique se você tem permissão ou se ele já foi removido.");
              }
          } else {
              await supabase.from('payment_links').delete().eq('product_id', id);
              const { error, data } = await supabase.from('products').delete().eq('id', id).select();
              if (error) throw error;
              if (!data || data.length === 0) {
                  throw new Error("Produto não encontrado no servidor para exclusão.");
              }
          }
      } catch (error: any) {
          console.error("Delete failed:", error);
          alert(`Falha ao excluir: ${error.message}`);
          setProducts(previousProducts);
          setPaymentLinks(previousLinks);
          fetchData();
      }
  };

  const handleOpenNewProduct = () => {
    setNewProduct({
        name: '', category: 'ebooks', description: '', price: 0, status: 'draft',
        is_limited_time: false, image_url: null, has_offer: false, redemption_link: ''
    });
    setEditingId(null);
    setProductFormStep(1);
    setShowProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setNewProduct({ ...product });
    setEditingId(product.id);
    setProductFormStep(1);
    setShowProductModal(true);
  };

  const handleGenerateDescriptionAI = async () => {
    if (!newProduct.name) return alert("Digite o nome do produto primeiro.");
    
    setIsGeneratingAI(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const prompt = `
          Atue como um especialista em Copywriting para produtos digitais.
          Escreva uma descrição curta, persuasiva e focada em vendas (máximo 300 caracteres) para um produto chamado: "${newProduct.name}".
          Categoria: ${newProduct.category}.
          Público: Moçambique.
          Use gatilhos mentais e emojis. Não coloque aspas na resposta.
        `;

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });
        const text = result.text;
        
        if (text) {
          setNewProduct(p => ({ ...p, description: text.trim() }));
        }
    } catch (e: any) {
        console.error(e);
        const descriptions = [
            `🚀 Domine ${newProduct.name} hoje mesmo! O guia definitivo para quem quer resultados reais em Moçambique.`,
            `💡 Transforme sua vida com ${newProduct.name}. Conteúdo prático, direto ao ponto e acessível. Compre agora!`
        ];
        setNewProduct(p => ({ ...p, description: descriptions[Math.floor(Math.random() * descriptions.length)] }));
        alert("IA indisponível no momento. Geramos uma descrição padrão.");
    } finally {
        setIsGeneratingAI(false);
    }
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => setNewProduct(p => ({ ...p, image_url: ev.target?.result as string }));
        reader.readAsDataURL(file);
    }
  };

  const saveProduct = async (requestedStatus: ProductStatus = 'draft') => {
    if (!newProduct.name || !newProduct.price) return alert("Nome e Preço obrigatórios.");
    setIsSavingProduct(true);
    try {
        const finalStatus = requestedStatus === 'active' ? 'analyzing' : requestedStatus;
        const payload = { user_id: session.user.id, ...newProduct, status: finalStatus };

        let savedData: Product | null = null;

        if (editingId) {
             const { data } = await supabase.from('products').update(payload).eq('id', editingId).select().single();
             savedData = data;
             if (data) {
                 setProducts(prev => prev.map(p => p.id === editingId ? data : p));
             }
        } else {
             const { data } = await supabase.from('products').insert([payload]).select().single();
             savedData = data;
             if (data) {
                 setProducts(prev => [data, ...prev]);
             }
        }

        setShowProductModal(false);
        
        if (finalStatus === 'analyzing' && savedData) {
             setTimeout(async () => {
                 await supabase.from('products').update({ status: 'active' }).eq('id', savedData!.id);
                 setProducts(prev => prev.map(p => p.id === savedData!.id ? { ...p, status: 'active' } : p));
             }, 3000);
        }
    } catch (e: any) {
        alert("Erro: " + e.message);
    } finally {
        setIsSavingProduct(false);
    }
  };

  const getStatusBadge = (status: ProductStatus) => {
      const styles = {
          active: "bg-emerald-100 text-emerald-700 border-emerald-200",
          analyzing: "bg-amber-100 text-amber-700 border-amber-200",
          rejected: "bg-red-100 text-red-700 border-red-200",
          draft: "bg-slate-100 text-slate-600 border-slate-200"
      };
      const labels = {
          active: "Ativo",
          analyzing: "Analisando",
          rejected: "Rejeitado",
          draft: "Rascunho"
      };
      return (
          <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border flex items-center gap-1.5 w-fit ${styles[status]}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status === 'analyzing' ? 'animate-pulse bg-current' : 'bg-current'}`}></span>
              {labels[status]}
          </span>
      );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      
      {deleteModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scaleIn">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600 mx-auto">
                      <AlertTriangle size={24}/>
                  </div>
                  <h3 className="text-xl font-bold text-center mb-2 text-slate-900">Excluir {deleteModal.type === 'product' ? 'Produto' : 'Link'}?</h3>
                  <p className="text-center text-slate-500 mb-6 text-sm">
                      Você está prestes a remover <span className="font-bold text-slate-800">"{deleteModal.title}"</span>. Esta ação não pode ser desfeita.
                  </p>
                  <div className="flex gap-3">
                      <button 
                        onClick={() => setDeleteModal({...deleteModal, isOpen: false})} 
                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                      >
                          Cancelar
                      </button>
                      <button 
                        onClick={confirmDelete} 
                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-200"
                      >
                          Sim, Excluir
                      </button>
                  </div>
              </div>
          </div>
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-white border-r border-slate-200 flex flex-col z-50 transition-transform duration-300 lg:transform-none ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-200">
              <Wallet size={20} />
            </div>
            <div>
                <span className="block text-xl font-bold text-slate-900 leading-none">Pay<span className="text-brand-600">Easy</span></span>
                <span className="text-xs text-slate-400 font-medium">Dashboard</span>
            </div>
          </div>
        </div>
        
        <div className="lg:hidden p-4 flex justify-end">
             <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Visão Geral' },
            { id: 'sales', icon: TrendingUp, label: 'Vendas' },
            { id: 'products', icon: ShoppingBag, label: 'Meus Produtos' },
            { id: 'links', icon: LinkIcon, label: 'Links Criados' },
            { id: 'settings', icon: Settings, label: 'Configurações' },
          ].map((item) => (
            <button 
                key={item.id}
                onClick={() => changeTab(item.id as Tab)} 
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-medium text-sm ${activeTab === item.id ? 'bg-brand-50 text-brand-700 shadow-sm border border-brand-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
                <item.icon size={20} className={activeTab === item.id ? 'text-brand-600' : 'text-slate-400'} /> 
                {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm shadow-sm">
                    {profile.fullName.charAt(0)}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-bold text-slate-900 truncate">{profile.fullName}</p>
                    <p className="text-xs text-slate-500 truncate">Plano Grátis</p>
                </div>
            </div>
            <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-red-600 hover:border-red-100 rounded-lg transition-all font-bold uppercase tracking-wide">
                <LogOut size={14} /> Sair da conta
            </button>
        </div>
      </aside>
      
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 z-40">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
              <Wallet size={18} />
            </div>
            <span className="text-lg font-bold">Pay<span className="text-brand-600">Easy</span></span>
         </div>
         <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600 bg-slate-100 rounded-lg">
             <Menu size={24}/>
         </button>
      </div>

      <main className="flex-1 p-6 lg:p-10 mt-16 lg:mt-0 overflow-y-auto w-full max-w-7xl mx-auto">
        
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    {getGreeting()}, {profile.fullName.split(' ')[0]}
                </h1>
                <p className="text-slate-500 mt-1 flex items-center gap-2">
                    <Calendar size={14} /> 
                    {new Date().toLocaleDateString('pt-MZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button onClick={() => handleOpenNewProduct()} className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-700 shadow-lg shadow-brand-200 flex items-center gap-2 transition-transform hover:-translate-y-0.5">
                  <Plus size={18}/> Novo Produto
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               {[
                   { 
                       label: "Receita Bruta (Total)", 
                       value: `${calculateGrossRevenue(sales).toLocaleString()} MT`, 
                       icon: Wallet, 
                       color: "text-emerald-600", 
                       bg: "bg-emerald-50" 
                   },
                   { 
                       label: "Vendas Aprovadas", 
                       value: sales.filter(s => s.status === 'approved').length.toString(), 
                       icon: ShoppingBag, 
                       color: "text-blue-600", 
                       bg: "bg-blue-50" 
                   },
                   { 
                       label: "Produtos Ativos", 
                       value: products.filter(p => p.status === 'active').length.toString(), 
                       icon: LayoutDashboard, 
                       color: "text-purple-600", 
                       bg: "bg-purple-50" 
                   },
                   {
                       label: "Vendas Hoje",
                       value: sales.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString()).length.toString(),
                       icon: TrendingUp,
                       color: "text-brand-600",
                       bg: "bg-brand-50"
                   }
               ].map((stat, i) => (
                   <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-brand-200 transition-all hover:shadow-md group">
                     <div className="flex items-center justify-between mb-4">
                         <div className={`p-3 ${stat.bg} ${stat.color} rounded-xl group-hover:scale-110 transition-transform`}>
                             <stat.icon size={24}/>
                         </div>
                     </div>
                     <div className="text-3xl font-bold text-slate-900 tracking-tight mb-1">{stat.value}</div>
                     <span className="text-sm font-medium text-slate-500">{stat.label}</span>
                   </div>
               ))}
            </div>

            {/* Charts Section (CSS Based) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Daily Revenue Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <BarChart3 size={18} className="text-brand-600" /> Receita Diária (7 dias)
                        </h3>
                    </div>
                    <div className="h-48 flex items-end justify-between gap-2">
                        {[...Array(7)].map((_, i) => {
                            const date = new Date();
                            date.setDate(date.getDate() - (6 - i));
                            const daySales = sales
                                .filter(s => s.status === 'approved' && new Date(s.created_at).toDateString() === date.toDateString())
                                .reduce((acc, curr) => acc + curr.amount, 0);
                            
                            // Mock max for visualization height
                            const maxVal = Math.max(...[1000, ...sales.map(s => s.amount)]) * 5; 
                            const height = Math.min((daySales / maxVal) * 100, 100);

                            return (
                                <div key={i} className="flex flex-col items-center gap-2 flex-1 group cursor-pointer">
                                    <div className="w-full relative h-40 bg-slate-50 rounded-t-lg overflow-hidden flex items-end">
                                        <div 
                                            className="w-full bg-brand-500 hover:bg-brand-600 transition-all duration-500 rounded-t-lg relative" 
                                            style={{ height: `${height > 5 ? height : 5}%` }}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                {daySales} MT
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-medium uppercase">{date.toLocaleDateString('pt-MZ', { weekday: 'short' })}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Payment Methods Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                     <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <PieChart size={18} className="text-brand-600" /> Métodos de Pagamento
                        </h3>
                    </div>
                    <div className="flex items-center justify-center h-48 gap-8">
                        <div className="relative w-32 h-32 rounded-full border-8 border-slate-100 flex items-center justify-center overflow-hidden">
                             {/* Mock Pie Chart Visualization */}
                             <div className="absolute inset-0 bg-red-500" style={{ clipPath: 'polygon(50% 50%, 0 0, 100% 0, 100% 100%, 0 100%)' }}></div>
                             <div className="absolute inset-0 bg-orange-500" style={{ clipPath: 'polygon(50% 50%, 0 0, 0 100%)' }}></div>
                             <div className="z-10 bg-white w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-inner">
                                <span className="text-xs font-bold text-slate-400">Total</span>
                                <span className="font-bold text-slate-800">{sales.length}</span>
                             </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span className="text-sm font-medium text-slate-600">M-Pesa ({sales.filter(s => s.payment_method === 'mpesa').length})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                <span className="text-sm font-medium text-slate-600">e-Mola ({sales.filter(s => s.payment_method === 'emola').length})</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Sales Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-lg">Últimas Vendas</h3>
                    <button onClick={() => changeTab('sales')} className="text-sm text-brand-600 font-bold hover:underline">Ver todas</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wide">
                                <th className="p-4">ID Venda</th>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Produto</th>
                                <th className="p-4">Valor</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {sales.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhuma venda registrada ainda.</td></tr>
                            ) : (
                                sales.slice(0, 5).map(sale => (
                                    <tr key={sale.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 font-mono text-slate-400 text-xs">#{sale.id.slice(0, 8)}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800">{sale.customer_name}</div>
                                            <div className="text-xs text-slate-400">{sale.customer_email}</div>
                                        </td>
                                        <td className="p-4 text-slate-600">{sale.product_name}</td>
                                        <td className="p-4 font-bold text-slate-900">{sale.amount.toLocaleString()} MT</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${sale.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {sale.status === 'approved' ? 'Aprovado' : sale.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
            <div className="space-y-8 animate-fadeIn">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Vendas</h1>
                    <p className="text-slate-500 mt-1">Gerencie suas transações e acompanhe seu faturamento.</p>
                  </div>
                  <div className="flex gap-2">
                       <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50">
                           <Calendar size={16}/> Filtrar Data
                       </button>
                       <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50">
                           <Filter size={16}/> Status
                       </button>
                  </div>
                </div>

                {/* Sales Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                     <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                         <div className="text-xs font-bold text-slate-400 uppercase mb-2">Vendas Aprovadas</div>
                         <div className="text-2xl font-bold text-green-600">{sales.filter(s => s.status === 'approved').length}</div>
                     </div>
                     <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                         <div className="text-xs font-bold text-slate-400 uppercase mb-2">Taxa de Conversão</div>
                         <div className="text-2xl font-bold text-slate-900">
                             {(() => {
                                 const totalViews = products.reduce((acc, p) => acc + (p.views_count || 0), 0);
                                 const totalSales = sales.filter(s => s.status === 'approved').length;
                                 return totalViews > 0 ? ((totalSales / totalViews) * 100).toFixed(1) : '0';
                             })()}%
                         </div>
                         <div className="text-[10px] text-slate-400 mt-1">Baseado em visualizações de produtos</div>
                     </div>
                     <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                         <div className="text-xs font-bold text-slate-400 uppercase mb-2">Receita Bruta</div>
                         <div className="text-2xl font-bold text-slate-900">{calculateGrossRevenue(sales).toLocaleString()} MT</div>
                     </div>
                     <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                         <div className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">Receita Líquida <AlertCircle size={12} title="Descontando taxas da plataforma" /></div>
                         <div className="text-2xl font-bold text-brand-600">{calculateNetRevenue(sales).toLocaleString()} MT</div>
                     </div>
                </div>

                {/* Sales Tabs Status */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="border-b border-slate-100 p-2 flex gap-2 overflow-x-auto">
                        {['Todas', 'Aprovadas', 'Pendentes', 'Canceladas'].map(status => (
                            <button key={status} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 focus:bg-slate-100 focus:text-brand-600 transition-colors">
                                {status}
                            </button>
                        ))}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wide">
                                    <th className="p-4">ID</th>
                                    <th className="p-4">Cliente</th>
                                    <th className="p-4">Contato</th>
                                    <th className="p-4">Produto</th>
                                    <th className="p-4">Preço</th>
                                    <th className="p-4">Taxa</th>
                                    <th className="p-4">Líquido</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {sales.length === 0 ? (
                                    <tr><td colSpan={8} className="p-12 text-center text-slate-400">Nenhuma venda encontrada com os filtros atuais.</td></tr>
                                ) : (
                                    sales.map(sale => (
                                        <tr key={sale.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                            <td className="p-4 font-mono text-slate-400 text-xs">#{sale.id.slice(0, 8)}</td>
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800">{sale.customer_name}</div>
                                                <div className="text-xs text-slate-400">{sale.customer_email}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1 text-slate-600">
                                                    <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-4 h-4" alt=""/>
                                                    {sale.customer_phone}
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-600">{sale.product_name}</td>
                                            <td className="p-4 font-bold text-slate-900">{sale.amount.toLocaleString()} MT</td>
                                            <td className="p-4 text-red-400 text-xs font-medium">-{((sale.amount * 0.049) + 5).toFixed(2)} MT</td>
                                            <td className="p-4 font-bold text-green-600">{(sale.amount - ((sale.amount * 0.049) + 5)).toLocaleString()} MT</td>
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
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {sales.length > 0 && (
                        <div className="p-4 border-t border-slate-100 text-center">
                            <button className="text-sm text-slate-500 font-medium hover:text-brand-600 transition-colors">Carregar mais vendas...</button>
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-100 pb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Meus Produtos</h1>
                <p className="text-slate-500 mt-1">Gerencie seu catálogo, edite ofertas e crie novos itens.</p>
              </div>
              <button 
                onClick={handleOpenNewProduct}
                className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-brand-200 transition-all transform hover:-translate-y-0.5"
              >
                <Plus size={20} /> Criar Produto
              </button>
            </div>

            {loading ? (
                 <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-600" size={40}/></div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-slate-200 flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300"><ShoppingBag size={32}/></div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Seu catálogo está vazio</h3>
                <p className="text-slate-500 mb-8 max-w-xs mx-auto">Comece a vender hoje mesmo criando seu primeiro produto digital.</p>
                <button onClick={handleOpenNewProduct} className="text-brand-600 font-bold hover:underline">Criar primeiro produto</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map((product) => (
                      <div key={product.id} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg border border-slate-100 hover:border-brand-200 transition-all duration-300 flex flex-col group relative overflow-hidden">
                          
                          <div className="flex gap-4 mb-4">
                              <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 relative">
                                  {product.image_url ? (
                                      <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={24}/></div>
                                  )}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                     <h3 className="font-bold text-slate-900 text-lg truncate pr-2 leading-tight">{product.name}</h3>
                                     <div className="flex-shrink-0">{getStatusBadge(product.status)}</div>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1 capitalize">{product.category}</p>
                                  <div className="mt-2 font-bold text-slate-900 text-lg">{product.price.toLocaleString()} MT</div>
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 border-t border-b border-slate-50 py-3 mb-4">
                              <div className="text-center border-r border-slate-50">
                                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">Vendas</div>
                                  <div className="font-bold text-slate-800">{product.sales_count || 0}</div>
                              </div>
                              <div className="text-center">
                                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">Receita</div>
                                  <div className="font-bold text-slate-800">{(product.total_revenue || 0).toLocaleString()}</div>
                              </div>
                          </div>

                          <div className="mt-auto grid grid-cols-2 gap-2">
                              <button 
                                onClick={() => handleEditProduct(product)}
                                className="flex items-center justify-center gap-1 py-2 rounded-lg text-slate-600 bg-slate-50 hover:bg-slate-100 text-xs font-bold transition-colors"
                              >
                                  <Edit3 size={14}/> Editar
                              </button>
                              <button 
                                onClick={() => openDeleteModal('product', product.id, product.name)}
                                className="flex items-center justify-center gap-1 py-2 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 text-xs font-bold transition-colors"
                              >
                                  <Trash2 size={14}/> Excluir
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'links' && (
           <div className="space-y-8 animate-fadeIn">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Links de Pagamento</h1>
                    <p className="text-slate-500 mt-1">Gerencie, copie e acompanhe o desempenho dos seus links.</p>
                  </div>
               </div>

               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                   <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Sparkles size={18} className="text-brand-500"/> Criar Novo Link Rápido</h3>
                   <div className="flex flex-col md:flex-row gap-3 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                       <div className="flex-1 w-full">
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Produto Aprovado</label>
                           <div className="relative">
                               <select 
                                 value={selectedProductIdForLink}
                                 onChange={(e) => setSelectedProductIdForLink(e.target.value)}
                                 className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 appearance-none text-sm font-medium shadow-sm transition-all"
                               >
                                   <option value="">Selecione um produto...</option>
                                   {products.filter(p => p.status === 'active').map(p => (
                                       <option key={p.id} value={p.id}>{p.name} - {p.price} MT</option>
                                   ))}
                               </select>
                               <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><Search size={16}/></div>
                           </div>
                       </div>
                       <button 
                         onClick={() => generateLink()}
                         disabled={!selectedProductIdForLink || isCreatingLink}
                         className="w-full md:w-auto px-8 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-md"
                       >
                         {isCreatingLink ? <Loader2 size={16} className="animate-spin" /> : <LinkIcon size={16} />}
                         Gerar Link
                       </button>
                   </div>
               </div>

               <div className="space-y-4">
                   {paymentLinks.length === 0 ? (
                       <div className="p-16 text-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                           <LinkIcon size={48} className="mx-auto mb-4 opacity-20"/>
                           <p className="text-sm font-medium">Nenhum link gerado ainda.</p>
                       </div>
                   ) : (
                       <div className="grid grid-cols-1 gap-4">
                           {paymentLinks.map(link => (
                               <div key={link.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center gap-6 animate-slideDown">
                                   
                                   <div className="flex-1 w-full">
                                       <div className="flex items-center gap-2 mb-1">
                                           <span className="bg-brand-50 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">Produto</span>
                                           <h4 className="font-bold text-slate-900">{link.product_name}</h4>
                                       </div>
                                       <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100 w-full max-w-xl group cursor-pointer" onClick={() => {
                                           try {
                                               navigator.clipboard.writeText(link.url).then(() => alert("Link copiado!")).catch((e) => alert("Erro ao copiar. Tente selecionar e copiar manualmente."));
                                           } catch(e) {
                                               alert("Erro de segurança ao copiar. Selecione o texto manualmente.");
                                           }
                                       }}>
                                           <div className="bg-white p-1 rounded border border-slate-200 text-slate-400"><LinkIcon size={12}/></div>
                                           <code className="text-xs text-brand-600 truncate flex-1 font-mono">{link.url}</code>
                                           <Copy size={14} className="text-slate-400 group-hover:text-brand-600"/>
                                       </div>
                                       <p className="text-[10px] text-slate-400 mt-2 ml-1">Criado em: {new Date(link.created_at).toLocaleDateString()}</p>
                                   </div>

                                   <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-50 pt-4 md:pt-0">
                                       <div className="flex items-center gap-2">
                                            <a 
                                                href={link.url} 
                                                target="_blank" 
                                                className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                                title="Testar Link"
                                            >
                                                <ExternalLink size={18} />
                                            </a>
                                            <button 
                                                onClick={() => openDeleteModal('link', link.id, link.product_name)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Excluir Link"
                                            >
                                                <Trash2 size={18}/>
                                            </button>
                                       </div>
                                   </div>
                               </div>
                           ))}
                       </div>
                   )}
               </div>
           </div>
        )}

        {activeTab === 'settings' && (
           <div className="animate-fadeIn p-16 bg-white rounded-2xl border border-slate-200 max-w-2xl mx-auto text-center shadow-sm">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Settings size={32} className="text-slate-300"/>
               </div>
               <h2 className="text-2xl font-bold mb-3 text-slate-900">Configurações da Conta</h2>
               <p className="text-slate-500 mb-8 max-w-sm mx-auto">Em breve você poderá gerenciar seu perfil, métodos de recebimento e notificações.</p>
               <button className="bg-slate-100 text-slate-400 px-6 py-2 rounded-full text-sm font-bold cursor-not-allowed">Em Desenvolvimento</button>
           </div>
        )}

      </main>

      {showProductModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-slideUp">
            
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">
                        {editingId ? 'Editar Produto' : 'Novo Produto'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Preencha os dados para começar a vender.</p>
                </div>
                <button onClick={() => setShowProductModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-white">
               <div className="space-y-6">
                   {productFormStep === 1 && (
                       <div className="space-y-6 animate-fadeIn">
                           <div>
                               <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Nome do Produto</label>
                               <input type="text" className="w-full p-4 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all" placeholder="Ex: Curso de Marketing Digital 2.0" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Descrição</label>
                               <div className="relative">
                                   <textarea className="w-full p-4 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all min-h-[120px] resize-y" placeholder="Descreva os benefícios do seu produto..." value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})}></textarea>
                                   <button 
                                     onClick={handleGenerateDescriptionAI} 
                                     disabled={isGeneratingAI}
                                     className="absolute bottom-3 right-3 text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-lg text-xs font-bold flex gap-1 items-center transition-colors disabled:opacity-50"
                                   >
                                       {isGeneratingAI ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                                       {isGeneratingAI ? "Gerando..." : "Gerar com IA"}
                                   </button>
                               </div>
                           </div>
                           <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Imagem de Capa</label>
                                <div className="flex items-start gap-4">
                                    <div className="w-24 h-24 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
                                        {newProduct.image_url ? (
                                            <img src={newProduct.image_url} className="w-full h-full object-cover"/>
                                        ) : (
                                            <UploadCloud className="text-slate-300 w-8 h-8"/>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                         <input type="text" className="w-full p-3 text-xs border border-slate-200 rounded-lg mb-3" placeholder="Ou cole a URL da imagem aqui..." value={newProduct.image_url || ''} onChange={e => setNewProduct({...newProduct, image_url: e.target.value})} />
                                         <div className="flex gap-2">
                                            <button onClick={() => productImageInputRef.current?.click()} className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-2">
                                                <UploadCloud size={14}/> Carregar Arquivo
                                            </button>
                                            <span className="text-xs text-slate-400 self-center">Max 2MB (JPG, PNG)</span>
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
                               <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Preço (MT)</label>
                               <div className="relative">
                                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">MT</span>
                                   <input type="number" className="w-full pl-12 p-4 border border-slate-200 rounded-xl text-xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder-slate-300" placeholder="0.00" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} />
                               </div>
                           </div>
                           
                           <div>
                               <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Link de Entrega (Acesso)</label>
                               <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 focus-within:ring-2 focus-within:ring-brand-500 focus-within:bg-white transition-all">
                                   <LinkIcon size={18} className="text-slate-400"/>
                                   <input type="url" className="w-full p-3 bg-transparent outline-none text-sm" placeholder="Ex: Link do Google Drive, Canal Telegram, Área de Membros..." value={newProduct.redemption_link || ''} onChange={e => setNewProduct({...newProduct, redemption_link: e.target.value})} />
                               </div>
                               <p className="text-[10px] text-slate-400 mt-1 ml-1">O cliente será redirecionado para este link após o pagamento confirmado.</p>
                           </div>

                           <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-5">
                               <div className="flex items-center justify-between">
                                   <div>
                                       <span className="text-sm font-bold text-slate-800 block">Oferta por Tempo Limitado</span>
                                       <span className="text-xs text-slate-500">Adiciona um contador de escassez no checkout.</span>
                                   </div>
                                   <div onClick={() => setNewProduct({...newProduct, is_limited_time: !newProduct.is_limited_time})} className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors ${newProduct.is_limited_time ? 'bg-brand-500' : 'bg-slate-300'}`}>
                                       <div className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform ${newProduct.is_limited_time ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                   </div>
                               </div>
                               <hr className="border-slate-200"/>
                               <div className="flex items-center justify-between">
                                   <div>
                                       <span className="text-sm font-bold text-slate-800 block">Order Bump (Upsell)</span>
                                       <span className="text-xs text-slate-500">Oferta extra na hora do pagamento.</span>
                                   </div>
                                   <div onClick={() => setNewProduct({...newProduct, has_offer: !newProduct.has_offer})} className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors ${newProduct.has_offer ? 'bg-brand-500' : 'bg-slate-300'}`}>
                                       <div className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform ${newProduct.has_offer ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                   </div>
                               </div>
                               {newProduct.has_offer && (
                                    <div className="p-4 bg-white rounded-lg border border-slate-200 grid grid-cols-2 gap-3 animate-slideDown">
                                        <input type="text" placeholder="Título Extra (Ex: Mentoria)" className="p-2 border rounded text-xs" value={newProduct.offer_title} onChange={e => setNewProduct({...newProduct, offer_title: e.target.value})} />
                                        <input type="number" placeholder="Preço Extra" className="p-2 border rounded text-xs" value={newProduct.offer_price || ''} onChange={e => setNewProduct({...newProduct, offer_price: parseFloat(e.target.value)})} />
                                    </div>
                               )}
                           </div>
                       </div>
                   )}
                   {productFormStep === 3 && (
                       <div className="text-center py-10 animate-fadeIn">
                           <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-600 animate-bounce-slow"><Sparkles size={32}/></div>
                           <h3 className="font-bold text-xl text-slate-900 mb-2">Tudo pronto!</h3>
                           <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto leading-relaxed">Seu produto será revisado por nossa IA de segurança em instantes após a publicação.</p>
                           <button onClick={() => saveProduct('active')} disabled={isSavingProduct} className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-brand-200 w-full flex justify-center items-center gap-2 transition-all transform hover:-translate-y-1">
                               {isSavingProduct ? <Loader2 className="animate-spin" size={20} /> : <Save size={20}/>}
                               {isSavingProduct ? 'Salvando...' : 'Publicar Produto'}
                           </button>
                       </div>
                   )}
               </div>
            </div>

            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                {productFormStep > 1 ? (
                    <button onClick={() => setProductFormStep(s => s-1)} className="text-slate-500 text-sm font-bold hover:text-slate-800 transition-colors">Voltar</button>
                ) : (
                    <div/>
                )}
                
                {productFormStep < 3 && (
                    <button onClick={() => setProductFormStep(s => s+1)} className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-md">
                        Continuar
                    </button>
                )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;