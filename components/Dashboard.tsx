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
  Edit3,
  ExternalLink,
  History,
  ArrowRight
} from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

interface DashboardProps {
  session: Session;
  onLogout: () => void;
}

type Tab = 'overview' | 'products' | 'links' | 'settings';

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
}

// Interface para Histórico de Links
interface PaymentLink {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  url: string;
  clicks: number;
  created_at: string;
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
  const productImageInputRef = useRef<HTMLInputElement>(null);

  // User Profile
  const initialMeta = session.user.user_metadata || {};
  const [profile, setProfile] = useState({
    fullName: initialMeta.full_name || '',
  });

  // Products Logic
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  // Link History Logic
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [selectedProductIdForLink, setSelectedProductIdForLink] = useState('');
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [loadingLinks, setLoadingLinks] = useState(false);
  
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
      setProducts(data);
    } 
    setLoadingProducts(false);
  };

  // Fetch Links
  const fetchLinks = async () => {
      setLoadingLinks(true);
      const { data, error } = await supabase
        .from('payment_links')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (data) {
          setPaymentLinks(data);
      }
      setLoadingLinks(false);
  };

  useEffect(() => {
    if (activeTab === 'products' || activeTab === 'overview') fetchProducts();
    if (activeTab === 'links') {
        fetchProducts(); // Need products to create links
        fetchLinks();
    }
    
    // Realtime listener
    const channel = supabase.channel('dashboard_updates')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `user_id=eq.${session.user.id}` }, () => fetchProducts())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_links', filter: `user_id=eq.${session.user.id}` }, () => fetchLinks())
    .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeTab]);

  // --- LINK GENERATION LOGIC ---
  const generateLink = async () => {
    if (!selectedProductIdForLink) return;
    
    setIsCreatingLink(true);

    try {
        const product = products.find(p => p.id === selectedProductIdForLink);
        if (!product) throw new Error("Produto não encontrado");

        // Simular um "processamento" para UX (não ser instantâneo demais)
        await new Promise(resolve => setTimeout(resolve, 1500));

        const linkUrl = `https://fastpayzinmoz.vercel.app/p/${product.id}`;

        const { data, error } = await supabase.from('payment_links').insert([{
            user_id: session.user.id,
            product_id: product.id,
            product_name: product.name,
            url: linkUrl,
            clicks: 0
        }]).select();

        if (error) throw error;

        // Limpar seleção
        setSelectedProductIdForLink('');
        // Feedback visual será a atualização da tabela via realtime ou fetchLinks
        
    } catch (e: any) {
        alert("Erro ao criar link: " + e.message);
    } finally {
        setIsCreatingLink(false);
    }
  };

  // --- PRODUCT FORM LOGIC (Edit/Create) ---
  const handleEditProduct = (product: Product) => {
    setNewProduct({ ...product });
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
    setTimeout(() => {
      const descriptions = [
        `Transforme sua vida com o ${newProduct.name}. Metodologia passo a passo.`,
        `O guia definitivo sobre ${newProduct.name}. Tudo o que você precisa saber.`
      ];
      const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)];
      setNewProduct(prev => ({ ...prev, description: randomDesc }));
      setIsGeneratingAI(false);
    }, 1500);
  };

  const handleProductImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Fallback Mock upload
    const reader = new FileReader();
    reader.onload = (e) => {
        setNewProduct(prev => ({ ...prev, image_url: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const saveProduct = async (requestedStatus: ProductStatus = 'draft') => {
    if (!newProduct.name || !newProduct.price) {
        alert("Nome e Preço são obrigatórios.");
        return;
    }
    
    setIsSavingProduct(true);

    try {
        let finalStatus = requestedStatus;
        if (requestedStatus === 'active') finalStatus = 'analyzing';

        const payload = {
            user_id: session.user.id,
            ...newProduct,
            status: finalStatus,
            ...(editingId ? {} : { sales_count: 0, total_revenue: 0 })
        };

        if (editingId) {
             await supabase.from('products').update(payload).eq('id', editingId);
        } else {
             await supabase.from('products').insert([payload]);
        }

        setShowProductModal(false);
        
        // AI Analysis Simulation
        if (finalStatus === 'analyzing') {
             setTimeout(async () => {
                 const passed = Math.random() > 0.1; 
                 const resultStatus = passed ? 'active' : 'rejected';
                 
                 // Busca o produto mais recente (ou pelo ID se fosse edição real)
                 // Aqui simplificamos pois é demo, mas em prod usaria o ID retornado do insert
                 const { data } = await supabase.from('products').select('id').eq('name', payload.name).order('created_at', {ascending: false}).limit(1);
                 
                 if (data && data[0]) {
                    await supabase.from('products').update({ status: resultStatus }).eq('id', data[0].id);
                 }

                 if (resultStatus === 'rejected') alert(`O produto ${payload.name} foi rejeitado pela IA.`);
             }, 3000);
        }

    } catch (e: any) {
        alert("Erro: " + e.message);
    } finally {
        setIsSavingProduct(false);
    }
  };

  const getStatusBadge = (status: ProductStatus) => {
      switch(status) {
          case 'active': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200 flex items-center gap-1"><CheckCircle2 size={12}/> Aprovado</span>;
          case 'analyzing': return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold border border-purple-200 flex items-center gap-1"><Loader2 size={12} className="animate-spin"/> IA Analisando</span>;
          case 'rejected': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-200 flex items-center gap-1"><AlertCircle size={12}/> Rejeitado</span>;
          default: return <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border border-slate-200">Rascunho</span>;
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      
      {/* Mobile Header (Visible only on small screens) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-20">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
              <Wallet size={18} />
            </div>
            <span className="text-xl font-bold text-slate-900">Pay<span className="text-brand-500">Easy</span></span>
         </div>
         <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600">
             {mobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
         </button>
      </div>

      {/* Sidebar - Desktop & Mobile Overlay */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col z-30 transition-transform duration-300 lg:transform-none ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-100 hidden lg:block">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
              <Wallet size={18} />
            </div>
            <span className="text-xl font-bold text-slate-900">Pay<span className="text-brand-500">Easy</span></span>
          </div>
        </div>
        
        {/* Mobile Header inside sidebar to close it */}
        <div className="lg:hidden p-4 border-b border-slate-100 flex justify-between items-center">
             <span className="font-bold text-slate-500">Menu</span>
             <button onClick={() => setMobileMenuOpen(false)}><X size={20}/></button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'overview' ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <LayoutDashboard size={20} /> Visão Geral
          </button>
          <button onClick={() => { setActiveTab('products'); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'products' ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <ShoppingBag size={20} /> Produtos
          </button>
          <button onClick={() => { setActiveTab('links'); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'links' ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <LinkIcon size={20} /> Links de Pagamento
          </button>
          <button onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'settings' ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Settings size={20} /> Configurações
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
            <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <LogOut size={16} /> Sair
            </button>
        </div>
      </aside>
      
      {/* Overlay Backdrop for Mobile */}
      {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/20 z-20 lg:hidden" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 mt-16 lg:mt-0 overflow-y-auto">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Visão Geral</h1>
              <p className="text-slate-500">Bem-vindo de volta, {profile.fullName}.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Gestão de Produtos</h1>
                <p className="text-slate-500">Crie ou edite seus produtos digitais.</p>
              </div>
              <button 
                onClick={handleOpenNewProduct}
                className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-200 transition-all"
              >
                <Plus size={20} /> Novo Produto
              </button>
            </div>

            {loadingProducts ? (
                 <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-600" size={40}/></div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-slate-300">
                <ShoppingBag size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">Sem produtos</h3>
                <button onClick={handleOpenNewProduct} className="text-brand-600 font-bold hover:underline">Criar agora</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                  {products.map((product) => (
                      <div key={product.id} className={`bg-white rounded-2xl p-6 shadow-sm border flex flex-col md:flex-row items-center gap-6 ${product.status === 'rejected' ? 'border-red-200 bg-red-50/10' : 'border-slate-100 hover:border-brand-200'}`}>
                          <div className="w-20 h-20 rounded-xl bg-slate-100 shrink-0 overflow-hidden border border-slate-200 relative">
                              {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />}
                              {product.status === 'analyzing' && (
                                <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-sm">
                                    <Loader2 className="animate-spin text-brand-600" />
                                </div>
                              )}
                          </div>
                          
                          <div className="flex-1 w-full text-center md:text-left">
                              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                                  <h3 className="text-lg font-bold text-slate-900">{product.name}</h3>
                                  {getStatusBadge(product.status)}
                              </div>
                              <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                                  <div>{product.price.toLocaleString()} MT</div>
                                  <div>{product.category}</div>
                              </div>
                              {product.status === 'rejected' && (
                                  <p className="text-xs text-red-600 mt-1 font-medium">Motivo: Conteúdo inadequado. Edite para reenviar.</p>
                              )}
                          </div>

                          <div>
                              <button 
                                onClick={() => handleEditProduct(product)}
                                disabled={product.status === 'analyzing'}
                                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium text-sm hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50"
                              >
                                <Edit3 size={16}/> {product.status === 'rejected' ? 'Corrigir' : 'Editar'}
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* PAYMENT LINKS TAB */}
        {activeTab === 'links' && (
           <div className="space-y-8 animate-fadeIn">
               
               {/* Header */}
               <div>
                  <h1 className="text-2xl font-bold text-slate-900">Links de Pagamento</h1>
                  <p className="text-slate-500">Crie links para seus produtos aprovados e acompanhe o histórico.</p>
               </div>

               {/* Creator Section */}
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                   <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Plus size={20} className="text-brand-600"/> Criar Novo Link</h3>
                   <div className="flex flex-col md:flex-row gap-4 items-end">
                       <div className="flex-1 w-full">
                           <label className="block text-sm font-semibold text-slate-600 mb-2">Selecionar Produto Aprovado</label>
                           <select 
                             value={selectedProductIdForLink}
                             onChange={(e) => setSelectedProductIdForLink(e.target.value)}
                             className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
                           >
                               <option value="">Selecione um produto...</option>
                               {products.filter(p => p.status === 'active').map(p => (
                                   <option key={p.id} value={p.id}>{p.name} - {p.price} MT</option>
                               ))}
                           </select>
                           {products.filter(p => p.status === 'active').length === 0 && (
                               <p className="text-xs text-red-500 mt-1">Você não tem produtos aprovados para criar links.</p>
                           )}
                       </div>
                       <button 
                         onClick={generateLink}
                         disabled={!selectedProductIdForLink || isCreatingLink}
                         className="w-full md:w-auto px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[180px] justify-center"
                       >
                         {isCreatingLink ? (
                             <>
                                <Loader2 size={18} className="animate-spin" /> Processando...
                             </>
                         ) : (
                             'Gerar Link Único'
                         )}
                       </button>
                   </div>
               </div>

               {/* Links History */}
               <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                   <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                       <h3 className="font-bold text-slate-800 flex items-center gap-2"><History size={20} className="text-slate-400"/> Histórico de Links</h3>
                       {loadingLinks && <Loader2 size={18} className="animate-spin text-brand-600" />}
                   </div>
                   
                   {paymentLinks.length === 0 && !loadingLinks ? (
                       <div className="p-12 text-center text-slate-400">
                           <LinkIcon size={48} className="mx-auto mb-4 opacity-20"/>
                           <p>Nenhum link gerado ainda.</p>
                       </div>
                   ) : (
                       <div className="overflow-x-auto">
                           <table className="w-full text-left">
                               <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                                   <tr>
                                       <th className="p-4">Data</th>
                                       <th className="p-4">Produto</th>
                                       <th className="p-4">Link (Clique para copiar)</th>
                                       <th className="p-4 text-center">Cliques</th>
                                       <th className="p-4 text-center">Ação</th>
                                   </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100 text-sm">
                                   {paymentLinks.map(link => (
                                       <tr key={link.id} className="hover:bg-slate-50">
                                           <td className="p-4 text-slate-500">{new Date(link.created_at).toLocaleDateString()}</td>
                                           <td className="p-4 font-medium text-slate-800">{link.product_name}</td>
                                           <td className="p-4">
                                               <div 
                                                 onClick={() => {navigator.clipboard.writeText(link.url); alert("Copiado!");}}
                                                 className="flex items-center gap-2 text-brand-600 cursor-pointer hover:underline max-w-[200px] truncate font-mono bg-slate-100 px-2 py-1 rounded"
                                               >
                                                   <Copy size={14}/> {link.url}
                                               </div>
                                           </td>
                                           <td className="p-4 text-center text-slate-500">{link.clicks}</td>
                                           <td className="p-4 text-center">
                                               <a href={link.url} target="_blank" className="text-slate-400 hover:text-slate-600">
                                                   <ExternalLink size={16} />
                                               </a>
                                           </td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                       </div>
                   )}
               </div>
           </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
           <div className="animate-fadeIn p-4 bg-white rounded-2xl border border-slate-100">
               <h2 className="text-xl font-bold mb-4">Configurações</h2>
               <p className="text-slate-500">Dados da conta e preferências.</p>
           </div>
        )}

      </main>

      {/* --- PRODUCT MODAL (CREATE / EDIT) --- */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-slideUp">
            
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        {editingId ? 'Editar Produto' : 'Novo Produto Digital'}
                    </h2>
                    <p className="text-sm text-slate-500">
                        {editingId ? 'Faça alterações e solicite nova análise.' : 'O produto precisará ser aprovado antes de gerar links.'}
                    </p>
                </div>
                <button onClick={() => setShowProductModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                    <X size={24} />
                </button>
            </div>

            {/* Form Body - Reusing logic, simplified visually for brevity */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
               <div className="max-w-3xl mx-auto space-y-6">
                   {productFormStep === 1 && (
                       <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                           <h4 className="font-bold text-slate-800">Detalhes Básicos</h4>
                           <input type="text" placeholder="Nome do Produto" className="w-full p-3 border rounded-xl" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                           <textarea placeholder="Descrição" className="w-full p-3 border rounded-xl" rows={4} value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})}></textarea>
                           <div className="flex justify-end">
                               <button onClick={handleGenerateDescriptionAI} className="text-purple-600 text-sm font-bold flex gap-1 items-center"><Sparkles size={14}/> Gerar com IA</button>
                           </div>
                           <div className="mt-4">
                                <p className="text-sm font-bold text-slate-700 mb-2">Imagem URL (Demo)</p>
                                <div className="flex gap-2">
                                     <input type="text" className="w-full p-2 text-sm border rounded" placeholder="URL da imagem..." value={newProduct.image_url || ''} onChange={e => setNewProduct({...newProduct, image_url: e.target.value})} />
                                     <input type="file" className="hidden" ref={productImageInputRef} onChange={handleProductImageUpload} />
                                     <button onClick={() => productImageInputRef.current?.click()} className="px-3 py-1 bg-slate-200 text-xs font-bold rounded">Upload</button>
                                </div>
                                {newProduct.image_url && <img src={newProduct.image_url} className="w-20 h-20 object-cover mt-2 rounded border" />}
                           </div>
                       </div>
                   )}
                   {productFormStep === 2 && (
                       <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                           <h4 className="font-bold text-slate-800">Preço e Oferta</h4>
                           <input type="number" placeholder="Preço (MT)" className="w-full p-3 border rounded-xl font-bold text-lg" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} />
                           
                           {/* Switches */}
                           <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                               <span className="font-bold text-slate-700">Tempo Limitado (Escassez)</span>
                               <div 
                                    onClick={() => setNewProduct({...newProduct, is_limited_time: !newProduct.is_limited_time})}
                                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${newProduct.is_limited_time ? 'bg-orange-500' : 'bg-slate-300'}`}
                               >
                                   <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${newProduct.is_limited_time ? 'translate-x-6' : 'translate-x-0'}`}></div>
                               </div>
                           </div>
                           
                           <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                               <span className="font-bold text-slate-700">Order Bump (Oferta Extra)</span>
                               <div 
                                    onClick={() => setNewProduct({...newProduct, has_offer: !newProduct.has_offer})}
                                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${newProduct.has_offer ? 'bg-yellow-500' : 'bg-slate-300'}`}
                               >
                                   <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${newProduct.has_offer ? 'translate-x-6' : 'translate-x-0'}`}></div>
                               </div>
                           </div>
                           {newProduct.has_offer && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2">
                                    <input type="text" placeholder="Título da oferta extra" className="w-full p-2 border rounded text-sm" value={newProduct.offer_title} onChange={e => setNewProduct({...newProduct, offer_title: e.target.value})} />
                                    <input type="number" placeholder="Preço da oferta extra" className="w-full p-2 border rounded text-sm" value={newProduct.offer_price || ''} onChange={e => setNewProduct({...newProduct, offer_price: parseFloat(e.target.value)})} />
                                </div>
                           )}
                       </div>
                   )}
                   {productFormStep === 3 && (
                       <div className="text-center p-8">
                           <p className="text-slate-600 mb-4">Seu produto passará por uma análise de 3 segundos da IA.</p>
                           <button onClick={() => saveProduct('active')} disabled={isSavingProduct} className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-brand-200 w-full flex justify-center items-center gap-2">
                               {isSavingProduct && <Loader2 className="animate-spin" size={20} />}
                               {isSavingProduct ? 'Salvando...' : 'Salvar e Solicitar Análise'}
                           </button>
                       </div>
                   )}
               </div>
            </div>

            <div className="px-8 py-6 border-t border-slate-100 bg-white flex justify-between">
                {productFormStep > 1 ? <button onClick={() => setProductFormStep(s => s-1)} className="font-bold text-slate-500">Voltar</button> : <div></div>}
                {productFormStep < 3 && <button onClick={() => setProductFormStep(s => s+1)} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold">Próximo</button>}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;