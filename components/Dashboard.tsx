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
  Monitor,
  Laptop,
  Tablet,
  MapPin,
  Clock,
  Wifi,
  CheckCircle2,
  Image as ImageIcon,
  Zap,
  Link as LinkIcon,
  BarChart3,
  Sparkles,
  Clock3,
  FileText,
  MousePointerClick,
  Eye,
  AlertCircle,
  Edit3
} from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

interface DashboardProps {
  session: Session;
  onLogout: () => void;
}

type Tab = 'overview' | 'products' | 'settings';
type Language = 'pt-MZ' | 'en-US' | 'es';

// Tipos para o Produto
type ProductStatus = 'draft' | 'analyzing' | 'active' | 'rejected';
type ProductCategory = 'ebooks' | 'cursos' | 'mentoria' | 'software' | 'audio' | 'templates' | 'outros';

interface Product {
  id: string; // UUID
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
  pixel_facebook: string;
  pixel_google: string;
  sales_count: number;
  total_revenue: number;
  created_at: string;
  link?: string; // Generated on frontend for display
}

// Interface para Dispositivos
interface DeviceSession {
  id: string;
  user_id: string;
  device_name: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  ip: string;
  location: string;
  last_active: string;
  created_at: string;
  is_current?: boolean;
}

const CATEGORIES: { value: ProductCategory; label: string; subcategories: string[] }[] = [
  { value: 'ebooks', label: 'Ebooks & Documentos', subcategories: ['Romance', 'Técnico', 'Receitas', 'Guia', 'Outro'] },
  { value: 'cursos', label: 'Cursos & Videoaulas', subcategories: ['Marketing', 'Programação', 'Idiomas', 'Beleza', 'Outro'] },
  { value: 'mentoria', label: 'Mentoria & Consultoria', subcategories: ['Carreira', 'Negócios', 'Saúde', 'Relacionamento'] },
  { value: 'templates', label: 'Templates & Arquivos', subcategories: ['Canva', 'Excel', 'Notion', '3D Models', 'Photoshop'] },
  { value: 'software', label: 'Software & Apps', subcategories: ['SaaS', 'Plugin', 'Script', 'Mobile App'] },
  { value: 'audio', label: 'Áudio & Música', subcategories: ['Audiobook', 'Música', 'Efeitos Sonoros', 'Podcast'] },
  { value: 'outros', label: 'Outros', subcategories: ['Ingressos', 'Comunidade', 'Serviços'] },
];

const Dashboard: React.FC<DashboardProps> = ({ session, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productImageInputRef = useRef<HTMLInputElement>(null);

  // User Profile
  const initialMeta = session.user.user_metadata || {};
  const [profile, setProfile] = useState({
    fullName: initialMeta.full_name || '',
    email: session.user.email || '',
    phone: initialMeta.phone_number || '',
    photoUrl: initialMeta.avatar_url || null,
  });

  // Device Management
  const [currentDevice, setCurrentDevice] = useState<DeviceSession | null>(null);
  const [devicesHistory, setDevicesHistory] = useState<DeviceSession[]>([]);

  // Products Logic
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  // Product Creation/Edit Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [productFormStep, setProductFormStep] = useState(1);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New Product Form State
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
    has_offer: false, // Order Bump
    offer_title: '',
    offer_price: 0,
    redemption_link: '',
    pixel_facebook: '',
    pixel_google: '',
  });

  // Fetch Products
  const fetchProducts = async () => {
    setLoadingProducts(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (data) {
      // Add frontend generated link with NEW DOMAIN
      const processed = data.map(p => ({
        ...p,
        link: `https://fastpayzinmoz.vercel.app/p/${p.id}`
      }));
      setProducts(processed);
    } else {
      // Fallback Mock data if table doesn't exist yet for demo
      if (products.length === 0) {
          setProducts([
            { 
              id: '123-abc', user_id: session.user.id, name: 'Curso Marketing Digital', category: 'cursos', subcategory: 'Marketing',
              description: 'Curso completo.', price: 2500, whatsapp: '', status: 'active', is_limited_time: false, image_url: null,
              has_offer: false, offer_title: '', offer_price: 0, redemption_link: '', pixel_facebook: '', pixel_google: '',
              sales_count: 42, total_revenue: 105000, created_at: new Date().toISOString(), link: 'https://fastpayzinmoz.vercel.app/p/123-abc'
            }
          ]);
      }
    }
    setLoadingProducts(false);
  };

  useEffect(() => {
    fetchProducts();
    // Realtime for product analysis updates
    const channel = supabase.channel('product_updates')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `user_id=eq.${session.user.id}` }, 
    () => {
        fetchProducts();
    })
    .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- PRODUCT CREATION & EDIT LOGIC ---

  const handleEditProduct = (product: Product) => {
    setNewProduct({
      name: product.name,
      category: product.category,
      subcategory: product.subcategory,
      description: product.description,
      price: product.price,
      whatsapp: product.whatsapp,
      status: product.status, // Will be reset to 'analyzing' on save if active/rejected
      is_limited_time: product.is_limited_time,
      image_url: product.image_url,
      has_offer: product.has_offer,
      offer_title: product.offer_title,
      offer_price: product.offer_price,
      redemption_link: product.redemption_link,
      pixel_facebook: product.pixel_facebook,
      pixel_google: product.pixel_google
    });
    setEditingId(product.id);
    setProductFormStep(1);
    setShowProductModal(true);
  };

  const handleOpenNewProduct = () => {
    setNewProduct({
        name: '', category: 'ebooks', subcategory: '', description: '', price: 0,
        whatsapp: '', status: 'draft', is_limited_time: false, image_url: null,
        has_offer: false, offer_title: '', offer_price: 0, redemption_link: '', pixel_facebook: '', pixel_google: ''
    });
    setEditingId(null);
    setProductFormStep(1);
    setShowProductModal(true);
  };

  const handleGenerateDescriptionAI = () => {
    if (!newProduct.name) {
      alert("Por favor, digite o nome do produto primeiro.");
      return;
    }
    setIsGeneratingAI(true);
    
    // Simulação de chamada de IA
    setTimeout(() => {
      const descriptions = [
        `Transforme sua vida com o ${newProduct.name}. Este conteúdo exclusivo foi desenhado para quem deseja resultados rápidos e práticos. Com uma metodologia passo a passo, você vai dominar o assunto em tempo recorde.`,
        `Descubra os segredos do ${newProduct.name}. Ideal para iniciantes e avançados, este material traz técnicas comprovadas e estudos de caso reais. Não perca a oportunidade de elevar seu nível.`,
        `O guia definitivo sobre ${newProduct.name}. Tudo o que você precisa saber, organizado de forma didática e acessível. Acesso vitalício e suporte incluso.`
      ];
      const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)];
      setNewProduct(prev => ({ ...prev, description: randomDesc }));
      setIsGeneratingAI(false);
    }, 1500);
  };

  const handleProductImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
        const fileName = `${session.user.id}/prod_${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file);
        if (uploadError && !uploadError.message.includes('security')) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
        setNewProduct(prev => ({ ...prev, image_url: publicUrl }));
    } catch (e) {
        // Fallback for demo
        const reader = new FileReader();
        reader.onload = (e) => {
            setNewProduct(prev => ({ ...prev, image_url: e.target?.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };

  const saveProduct = async (requestedStatus: ProductStatus = 'draft') => {
    if (!newProduct.name || !newProduct.price) {
        alert("Nome e Preço são obrigatórios.");
        return;
    }
    
    setIsSavingProduct(true);

    try {
        // Regra de Negócio: Se for uma EDIÇÃO ou NOVO PRODUTO marcado como 'active', 
        // ele DEVE passar pela IA novamente. Forçamos 'analyzing'.
        let finalStatus = requestedStatus;
        if (requestedStatus === 'active') {
            finalStatus = 'analyzing';
        }

        const payload = {
            user_id: session.user.id,
            ...newProduct,
            status: finalStatus,
            // Keep sales stats if editing, otherwise init 0
            ...(editingId ? {} : { sales_count: 0, total_revenue: 0 })
        };

        let savedProduct: any = null;

        if (editingId) {
            // Update
            const { data, error } = await supabase
                .from('products')
                .update(payload)
                .eq('id', editingId)
                .select();
            if (error) throw error;
            savedProduct = data?.[0];
        } else {
            // Insert
            const { data, error } = await supabase
                .from('products')
                .insert([payload])
                .select();
            
            if (error) {
                 // Fallback for demo if table missing
                 if (error.code === '42P01') {
                    savedProduct = { ...payload, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() };
                    setProducts([savedProduct, ...products]);
                 } else throw error;
            } else {
                savedProduct = data?.[0];
            }
        }

        setShowProductModal(false);
        
        // Trigger AI Analysis Simulation
        if (finalStatus === 'analyzing' && savedProduct) {
             // Otimizado: 3 segundos max para análise
             setTimeout(async () => {
                 // 90% chance of approval
                 const passed = Math.random() > 0.1;
                 const resultStatus = passed ? 'active' : 'rejected';
                 
                 // Update DB with result
                 if (savedProduct.id) {
                     await supabase.from('products').update({ status: resultStatus }).eq('id', savedProduct.id);
                 }
                 
                 // Refresh Local UI
                 fetchProducts();
                 
                 if (resultStatus === 'rejected') {
                     alert(`Atenção: O produto "${payload.name}" foi REJEITADO pela IA por conteúdo impróprio. Edite e tente novamente.`);
                 } else {
                     // Opcional: Notificar sucesso discreto
                     console.log("Produto aprovado pela IA.");
                 }
             }, 3000); // 3 segundos (Rápido)
        }

    } catch (e: any) {
        alert("Erro ao salvar produto: " + e.message);
    } finally {
        setIsSavingProduct(false);
    }
  };

  // --- RENDER HELPERS ---
  const getStatusBadge = (status: ProductStatus) => {
      switch(status) {
          case 'active': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200 flex items-center gap-1"><CheckCircle2 size={12}/> Aprovado</span>;
          case 'analyzing': return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold border border-purple-200 flex items-center gap-1"><Loader2 size={12} className="animate-spin"/> IA Analisando...</span>;
          case 'rejected': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-200 flex items-center gap-1"><AlertCircle size={12}/> Rejeitado</span>;
          default: return <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border border-slate-200">Rascunho</span>;
      }
  };

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
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'overview' ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <LayoutDashboard size={20} /> Visão Geral
          </button>
          <button onClick={() => setActiveTab('products')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'products' ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <ShoppingBag size={20} /> Produtos
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'settings' ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Settings size={20} /> Configurações
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
            <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <LogOut size={16} /> Sair
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 mt-16 lg:mt-0 overflow-y-auto">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Visão Geral</h1>
              <p className="text-slate-500">Bem-vindo de volta, {profile.fullName}.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {/* Stats (Same as before) */}
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                 <div className="text-3xl font-bold text-slate-900">162.500 MT</div>
                 <div className="text-sm text-slate-500">Receita Total</div>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                 <div className="text-3xl font-bold text-slate-900">157</div>
                 <div className="text-sm text-slate-500">Vendas Realizadas</div>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                 <div className="text-3xl font-bold text-slate-900">{products.length}</div>
                 <div className="text-sm text-slate-500">Produtos Criados</div>
               </div>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB - REVAMPED */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Seus Produtos</h1>
                <p className="text-slate-500">Gerencie seus links de pagamento e ofertas.</p>
              </div>
              <button 
                onClick={handleOpenNewProduct}
                className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-200 transition-all"
              >
                <Plus size={20} /> Novo Produto
              </button>
            </div>

            {loadingProducts ? (
                 <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-600" size={40}/></div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-slate-300">
                <ShoppingBag size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">Você ainda não tem produtos</h3>
                <button onClick={handleOpenNewProduct} className="text-brand-600 font-bold hover:underline">Criar meu primeiro produto</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                  {products.map((product) => (
                      <div key={product.id} className={`bg-white rounded-2xl p-6 shadow-sm border flex flex-col md:flex-row items-center gap-6 transition-all ${product.status === 'rejected' ? 'border-red-200 bg-red-50/10' : 'border-slate-100 hover:border-brand-200'}`}>
                          {/* Image */}
                          <div className="w-24 h-24 rounded-xl bg-slate-100 shrink-0 overflow-hidden border border-slate-200 relative">
                              {product.image_url ? (
                                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400"><ImageIcon size={32}/></div>
                              )}
                              {product.status === 'analyzing' && (
                                <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-sm">
                                    <Loader2 className="animate-spin text-brand-600" />
                                </div>
                              )}
                          </div>
                          
                          {/* Info */}
                          <div className="flex-1 w-full text-center md:text-left">
                              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                                  <h3 className="text-lg font-bold text-slate-900">{product.name}</h3>
                                  {getStatusBadge(product.status)}
                              </div>
                              <div className="text-sm text-slate-500 mb-4">
                                  {CATEGORIES.find(c => c.value === product.category)?.label} • {product.subcategory || 'Geral'}
                              </div>
                              <div className="flex items-center justify-center md:justify-start gap-4 text-sm font-medium">
                                  <div className="text-slate-700">{product.price.toLocaleString()} MT</div>
                                  <div className="text-slate-400">|</div>
                                  <div className="text-slate-500">{product.sales_count} vendas</div>
                              </div>
                              {product.status === 'rejected' && (
                                  <p className="text-xs text-red-600 mt-2 font-medium">Produto rejeitado. Edite para solicitar nova análise.</p>
                              )}
                          </div>

                          {/* Actions - Control based on Status */}
                          <div className="flex flex-col gap-2 w-full md:w-auto">
                              {/* Botão de Link: Só aparece se aprovado */}
                              {product.status === 'active' && (
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(product.link || '');
                                        alert("Link copiado: " + product.link);
                                    }}
                                    className="px-4 py-2 bg-brand-50 text-brand-700 rounded-lg font-bold text-sm hover:bg-brand-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <LinkIcon size={16} /> Copiar Link
                                </button>
                              )}

                              <div className="flex gap-2 w-full">
                                  {/* Botão de Editar: Habilitado para ativo/rejeitado/rascunho. Desabilitado em análise */}
                                  <button 
                                    onClick={() => handleEditProduct(product)}
                                    disabled={product.status === 'analyzing'}
                                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium text-sm hover:bg-slate-50 flex items-center justify-center gap-2 disabled:opacity-50"
                                  >
                                    <Edit3 size={16}/> {product.status === 'rejected' ? 'Corrigir' : 'Editar'}
                                  </button>
                                  
                                  <button className="px-3 py-2 border border-slate-200 text-slate-400 rounded-lg hover:text-red-600 hover:bg-red-50"><Trash2 size={16}/></button>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
           <div className="animate-fadeIn p-4 bg-white rounded-2xl border border-slate-100">
               <h2 className="text-xl font-bold mb-4">Configurações</h2>
               <p className="text-slate-500">Funcionalidade mantida da versão anterior.</p>
           </div>
        )}

      </main>

      {/* --- PRODUCT MODAL (CREATE / EDIT) --- */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-slideUp">
            
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        {editingId ? 'Editar Produto' : 'Novo Produto Digital'}
                    </h2>
                    <p className="text-sm text-slate-500">
                        {editingId ? 'Faça alterações e solicite nova análise.' : 'Configure seu produto para venda imediata.'}
                    </p>
                </div>
                <button onClick={() => setShowProductModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                    <X size={24} />
                </button>
            </div>

            {/* Steps Indicator */}
            <div className="px-8 py-4 bg-slate-50 border-b border-slate-100 overflow-x-auto">
                <div className="flex items-center gap-2 min-w-max">
                    <button onClick={() => setProductFormStep(1)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${productFormStep === 1 ? 'bg-brand-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'}`}>
                        <FileText size={16}/> 1. Informações Básicas
                    </button>
                    <div className="w-8 h-0.5 bg-slate-200"></div>
                    <button onClick={() => setProductFormStep(2)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${productFormStep === 2 ? 'bg-brand-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'}`}>
                        <DollarSign size={16}/> 2. Preço & Oferta
                    </button>
                    <div className="w-8 h-0.5 bg-slate-200"></div>
                    <button onClick={() => setProductFormStep(3)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${productFormStep === 3 ? 'bg-brand-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'}`}>
                        <CheckCircle2 size={16}/> 3. Entrega & Rastreamento
                    </button>
                </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                <div className="max-w-3xl mx-auto space-y-8">
                    
                    {/* STEP 1: BASIC INFO */}
                    {productFormStep === 1 && (
                        <div className="space-y-6 animate-fadeIn">
                            {/* Image Upload */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <label className="block text-sm font-bold text-slate-700 mb-4">Imagem do Produto (Capa)</label>
                                <div className="flex items-start gap-6">
                                    <div 
                                        onClick={() => productImageInputRef.current?.click()}
                                        className="w-32 h-32 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-brand-400 transition-all overflow-hidden relative group"
                                    >
                                        {newProduct.image_url ? (
                                            <img src={newProduct.image_url} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center p-2">
                                                <ImageIcon className="mx-auto text-slate-400 mb-1" size={24}/>
                                                <span className="text-[10px] text-slate-500 font-medium">Carregar Imagem</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Upload className="text-white" size={20}/>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-slate-900 text-sm mb-1">Dica de Design</h4>
                                        <p className="text-xs text-slate-500 mb-4">Use uma imagem de alta qualidade (1080x1080px). Produtos com boas capas convertem 3x mais.</p>
                                        <input type="file" ref={productImageInputRef} className="hidden" onChange={handleProductImageUpload} accept="image/*" />
                                        <button type="button" onClick={() => productImageInputRef.current?.click()} className="text-sm font-bold text-brand-600 hover:underline">Escolher arquivo</button>
                                    </div>
                                </div>
                            </div>

                            {/* Main Info */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Nome do Produto</label>
                                    <input 
                                        type="text" 
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                                        placeholder="Ex: Guia Definitivo de Investimentos"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Categoria</label>
                                        <select 
                                            value={newProduct.category}
                                            onChange={(e) => setNewProduct({...newProduct, category: e.target.value as ProductCategory, subcategory: ''})}
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                                        >
                                            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Subcategoria</label>
                                        <select 
                                            value={newProduct.subcategory}
                                            onChange={(e) => setNewProduct({...newProduct, subcategory: e.target.value})}
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                                        >
                                            <option value="">Selecione...</option>
                                            {CATEGORIES.find(c => c.value === newProduct.category)?.subcategories.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-bold text-slate-700">Descrição</label>
                                        <button 
                                            type="button"
                                            onClick={handleGenerateDescriptionAI}
                                            disabled={isGeneratingAI}
                                            className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full hover:bg-purple-100 transition-colors flex items-center gap-1"
                                        >
                                            {isGeneratingAI ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                                            {isGeneratingAI ? 'Gerando...' : 'Melhorar com IA'}
                                        </button>
                                    </div>
                                    <textarea 
                                        rows={5}
                                        value={newProduct.description}
                                        onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none text-sm leading-relaxed"
                                        placeholder="Descreva o que seu cliente irá receber..."
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: PRICE & OFFER */}
                    {productFormStep === 2 && (
                        <div className="space-y-6 animate-fadeIn">
                             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <label className="block text-sm font-bold text-slate-700 mb-4">Preço do Produto</label>
                                <div className="flex items-center gap-4">
                                    <div className="relative flex-1">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">MT</span>
                                        <input 
                                            type="number" 
                                            value={newProduct.price || ''}
                                            onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                                            className="w-full pl-12 p-4 text-2xl font-bold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="w-px h-12 bg-slate-100"></div>
                                    <div className="w-1/3">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">WhatsApp de Suporte</label>
                                        <input 
                                            type="tel" 
                                            value={newProduct.whatsapp}
                                            onChange={(e) => setNewProduct({...newProduct, whatsapp: e.target.value})}
                                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                            placeholder="+258 84..."
                                        />
                                    </div>
                                </div>
                             </div>

                             {/* Scarcity Toggle - IMPROVED VISIBILITY */}
                             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                                 <div>
                                     <h4 className="font-bold text-slate-900 flex items-center gap-2"><Clock3 size={18} className="text-orange-500"/> Oferta por Tempo Limitado</h4>
                                     <p className="text-sm text-slate-500 max-w-sm mt-1">Ao ativar, o checkout mostrará um contador regressivo de 6 minutos para criar urgência.</p>
                                 </div>
                                 <div 
                                    onClick={() => setNewProduct({...newProduct, is_limited_time: !newProduct.is_limited_time})}
                                    className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${newProduct.is_limited_time ? 'bg-brand-600' : 'bg-slate-300'}`}
                                 >
                                    <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${newProduct.is_limited_time ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                 </div>
                             </div>

                             {/* Order Bump - IMPROVED VISIBILITY */}
                             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                 <div className="flex items-center justify-between mb-4">
                                     <div>
                                        <h4 className="font-bold text-slate-900 flex items-center gap-2"><Zap size={18} className="text-yellow-500"/> Order Bump (Oferta Extra)</h4>
                                        <p className="text-sm text-slate-500">Ofereça um produto complementar no checkout.</p>
                                     </div>
                                     <div 
                                        onClick={() => setNewProduct({...newProduct, has_offer: !newProduct.has_offer})}
                                        className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${newProduct.has_offer ? 'bg-brand-600' : 'bg-slate-300'}`}
                                     >
                                        <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${newProduct.has_offer ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                     </div>
                                 </div>
                                 
                                 {newProduct.has_offer && (
                                     <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 animate-fadeIn space-y-3">
                                         <div>
                                            <label className="block text-xs font-bold text-yellow-800 mb-1">Título da Oferta</label>
                                            <input 
                                                type="text" 
                                                value={newProduct.offer_title}
                                                onChange={(e) => setNewProduct({...newProduct, offer_title: e.target.value})}
                                                className="w-full p-2 bg-white border border-yellow-200 rounded-lg text-sm"
                                                placeholder="Ex: Leve também a Planilha de Controle"
                                            />
                                         </div>
                                         <div>
                                            <label className="block text-xs font-bold text-yellow-800 mb-1">Preço da Oferta (MT)</label>
                                            <input 
                                                type="number" 
                                                value={newProduct.offer_price || ''}
                                                onChange={(e) => setNewProduct({...newProduct, offer_price: parseFloat(e.target.value)})}
                                                className="w-full p-2 bg-white border border-yellow-200 rounded-lg text-sm"
                                                placeholder="150.00"
                                            />
                                         </div>
                                     </div>
                                 )}
                             </div>
                        </div>
                    )}

                    {/* STEP 3: DELIVERY & TRACKING */}
                    {productFormStep === 3 && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><LinkIcon size={18}/> Entrega do Produto</h4>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Página de Resgate (Obrigado)</label>
                                    <p className="text-xs text-slate-500 mb-2">Para onde o cliente será redirecionado após o pagamento aprovado? (Link do Drive, Grupo WhatsApp, etc)</p>
                                    <input 
                                        type="url" 
                                        value={newProduct.redemption_link}
                                        onChange={(e) => setNewProduct({...newProduct, redemption_link: e.target.value})}
                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                                        placeholder="https://t.me/seugrupo ou https://drive.google.com/..."
                                    />
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><BarChart3 size={18}/> Rastreamento (Pixels)</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Pixel do Facebook (Meta)</label>
                                        <input 
                                            type="text" 
                                            value={newProduct.pixel_facebook}
                                            onChange={(e) => setNewProduct({...newProduct, pixel_facebook: e.target.value})}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                            placeholder="Ex: 1234567890"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">ID do Google Analytics</label>
                                        <input 
                                            type="text" 
                                            value={newProduct.pixel_google}
                                            onChange={(e) => setNewProduct({...newProduct, pixel_google: e.target.value})}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                            placeholder="Ex: G-XXXXXXXX"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                                <Monitor className="text-blue-600 mt-1" size={20}/>
                                <div>
                                    <h5 className="font-bold text-blue-800 text-sm">Análise de IA Automática</h5>
                                    <p className="text-xs text-blue-600 mt-1">
                                        Para garantir a segurança da plataforma, seu produto passará por uma análise de 3 segundos pela nossa IA. 
                                        <strong>Produtos rejeitados não poderão gerar links de venda até serem corrigidos.</strong>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 border-t border-slate-100 bg-white flex items-center justify-between">
                <div>
                   {productFormStep > 1 && (
                       <button 
                         onClick={() => setProductFormStep(s => s - 1)}
                         className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                       >
                         Voltar
                       </button>
                   )}
                </div>
                <div className="flex gap-4">
                     {productFormStep < 3 ? (
                         <button 
                           onClick={() => setProductFormStep(s => s + 1)}
                           className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2"
                         >
                           Próximo Passo <MousePointerClick size={18}/>
                         </button>
                     ) : (
                         <div className="flex gap-2">
                             <button 
                               onClick={() => saveProduct('draft')}
                               disabled={isSavingProduct}
                               className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                             >
                               Salvar Rascunho
                             </button>
                             <button 
                               onClick={() => saveProduct('active')}
                               disabled={isSavingProduct}
                               className="px-8 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200 flex items-center gap-2"
                             >
                               {isSavingProduct ? <Loader2 className="animate-spin" size={20}/> : (editingId ? <Save size={20} /> : <CheckCircle2 size={20}/>)}
                               {editingId ? 'Salvar e Reanalisar' : 'Criar e Analisar'}
                             </button>
                         </div>
                     )}
                </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;