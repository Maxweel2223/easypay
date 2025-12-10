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
  History,
  MoreHorizontal,
  Search,
  Filter,
  Image as ImageIcon,
  Link as LinkIcon,
  Save
} from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

interface DashboardProps {
  session: Session;
  onLogout: () => void;
}

type Tab = 'overview' | 'products' | 'links' | 'settings';

type ProductStatus = 'draft' | 'analyzing' | 'active' | 'rejected';
type ProductCategory = 'ebooks' | 'cursos' | 'mentoria' | 'software' | 'audio' | 'templates' | 'outros';

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
  created_at: string;
}

interface PaymentLink {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  url: string;
  clicks: number;
  created_at: string;
}

const Dashboard: React.FC<DashboardProps> = ({ session, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
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
  const [loading, setLoading] = useState(true);
  
  // Create Link State
  const [selectedProductIdForLink, setSelectedProductIdForLink] = useState('');
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  
  // Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [productFormStep, setProductFormStep] = useState(1);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
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

  const fetchData = async () => {
    setLoading(true);
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (productsData) setProducts(productsData);

    if (activeTab === 'links') {
        const { data: linksData } = await supabase
        .from('payment_links')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
        if (linksData) setPaymentLinks(linksData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    
    const channel = supabase.channel('dashboard_updates')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `user_id=eq.${session.user.id}` }, () => fetchData())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_links', filter: `user_id=eq.${session.user.id}` }, () => fetchData())
    .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeTab]);

  // --- ACTIONS ---

  const generateLink = async () => {
    if (!selectedProductIdForLink) return;
    setIsCreatingLink(true);
    try {
        const product = products.find(p => p.id === selectedProductIdForLink);
        if (!product) throw new Error("Produto não encontrado");

        await new Promise(resolve => setTimeout(resolve, 1000)); // UX delay

        const linkUrl = `https://fastpayzinmoz.vercel.app/p/${product.id}`;
        const { error } = await supabase.from('payment_links').insert([{
            user_id: session.user.id,
            product_id: product.id,
            product_name: product.name,
            url: linkUrl,
            clicks: 0
        }]);

        if (error) throw error;
        setSelectedProductIdForLink('');
        alert("Link gerado com sucesso!");
    } catch (e: any) {
        alert("Erro: " + e.message);
    } finally {
        setIsCreatingLink(false);
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

  const handleGenerateDescriptionAI = () => {
    if (!newProduct.name) return alert("Digite o nome primeiro.");
    const descriptions = [
        `Domine ${newProduct.name} com este guia completo e prático.`,
        `A solução definitiva para quem busca resultados em ${newProduct.name}.`
    ];
    setNewProduct(p => ({ ...p, description: descriptions[Math.floor(Math.random() * descriptions.length)] }));
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

        let savedId = editingId;
        if (editingId) {
             await supabase.from('products').update(payload).eq('id', editingId);
        } else {
             const { data } = await supabase.from('products').insert([payload]).select().single();
             if (data) savedId = data.id;
        }

        setShowProductModal(false);
        
        if (finalStatus === 'analyzing' && savedId) {
             setTimeout(async () => {
                 await supabase.from('products').update({ status: 'active' }).eq('id', savedId);
             }, 3000);
        }
    } catch (e: any) {
        alert("Erro: " + e.message);
    } finally {
        setIsSavingProduct(false);
    }
  };

  // --- RENDER HELPERS ---

  const getStatusBadge = (status: ProductStatus) => {
      const styles = {
          active: "bg-green-100 text-green-700 border-green-200",
          analyzing: "bg-purple-100 text-purple-700 border-purple-200",
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
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 w-fit ${styles[status]}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status === 'analyzing' ? 'animate-pulse bg-current' : 'bg-current'}`}></span>
              {labels[status]}
          </span>
      );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
              <Wallet size={18} />
            </div>
            <span className="text-lg font-bold">Pay<span className="text-brand-600">Easy</span></span>
         </div>
         <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600 bg-slate-50 rounded-lg">
             {mobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
         </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col z-50 transition-transform duration-300 lg:transform-none ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-100 hidden lg:block">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
              <Wallet size={18} />
            </div>
            <span className="text-xl font-bold">Pay<span className="text-brand-600">Easy</span></span>
          </div>
        </div>
        
        <div className="lg:hidden p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
             <span className="font-bold text-slate-500">Menu Principal</span>
             <button onClick={() => setMobileMenuOpen(false)}><X size={20}/></button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Visão Geral' },
            { id: 'products', icon: ShoppingBag, label: 'Meus Produtos' },
            { id: 'links', icon: ExternalLink, label: 'Links de Pagamento' },
            { id: 'settings', icon: Settings, label: 'Configurações' },
          ].map((item) => (
            <button 
                key={item.id}
                onClick={() => { setActiveTab(item.id as Tab); setMobileMenuOpen(false); }} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm ${activeTab === item.id ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
            >
                <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                    {profile.fullName.charAt(0)}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-bold text-slate-900 truncate">{profile.fullName}</p>
                    <p className="text-xs text-slate-500 truncate">Plano Grátis</p>
                </div>
            </div>
            <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium">
                <LogOut size={16} /> Sair da conta
            </button>
        </div>
      </aside>
      
      {/* Overlay */}
      {mobileMenuOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>}

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-10 mt-16 lg:mt-0 overflow-y-auto w-full">
        
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Visão Geral</h1>
                <p className="text-slate-500">Resumo do seu negócio digital.</p>
              </div>
              <div className="flex gap-2">
                 <button className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">Últimos 30 dias</button>
                 <button onClick={() => setActiveTab('products')} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-700 shadow-lg shadow-brand-200">Novo Produto</button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-brand-200 transition-colors">
                 <div className="flex items-center gap-3 mb-4">
                     <div className="p-2 bg-green-100 text-green-600 rounded-lg"><Wallet size={20}/></div>
                     <span className="text-sm font-medium text-slate-500">Receita Total</span>
                 </div>
                 <div className="text-3xl font-bold text-slate-900 tracking-tight">0 MT</div>
               </div>
               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-brand-200 transition-colors">
                 <div className="flex items-center gap-3 mb-4">
                     <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><ShoppingBag size={20}/></div>
                     <span className="text-sm font-medium text-slate-500">Vendas</span>
                 </div>
                 <div className="text-3xl font-bold text-slate-900 tracking-tight">0</div>
               </div>
               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-brand-200 transition-colors">
                 <div className="flex items-center gap-3 mb-4">
                     <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><LayoutDashboard size={20}/></div>
                     <span className="text-sm font-medium text-slate-500">Produtos Ativos</span>
                 </div>
                 <div className="text-3xl font-bold text-slate-900 tracking-tight">{products.filter(p => p.status === 'active').length}</div>
               </div>
            </div>
          </div>
        )}

        {/* PRODUCTS MANAGEMENT - REFACTORED */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Meus Produtos</h1>
                <p className="text-slate-500">Gerencie seu catálogo de produtos digitais.</p>
              </div>
              <button 
                onClick={handleOpenNewProduct}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all text-sm w-fit"
              >
                <Plus size={18} /> Criar Produto
              </button>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 w-fit">
                <button className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-800 rounded-md">Todos</button>
                <button className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-md">Ativos</button>
                <button className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-md">Rascunhos</button>
            </div>

            {loading ? (
                 <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-600" size={32}/></div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-xl p-16 text-center border-2 border-dashed border-slate-200 flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400"><ShoppingBag size={24}/></div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhum produto encontrado</h3>
                <p className="text-slate-500 mb-6 max-w-xs mx-auto">Você ainda não criou nenhum produto digital. Comece agora e venda em minutos.</p>
                <button onClick={handleOpenNewProduct} className="text-brand-600 font-bold hover:underline">Criar primeiro produto</button>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  {/* Desktop Table Header */}
                  <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <div className="col-span-5">Produto</div>
                      <div className="col-span-2">Preço</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2">Vendas</div>
                      <div className="col-span-1 text-right">Ações</div>
                  </div>

                  <div className="divide-y divide-slate-100">
                      {products.map((product) => (
                          <div key={product.id} className="group hover:bg-slate-50 transition-colors">
                              {/* Desktop Row */}
                              <div className="hidden md:grid grid-cols-12 gap-4 p-4 items-center">
                                  <div className="col-span-5 flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                                          {product.image_url ? (
                                              <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                                          ) : (
                                              <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={16}/></div>
                                          )}
                                      </div>
                                      <div>
                                          <h3 className="font-bold text-slate-900 text-sm">{product.name}</h3>
                                          <p className="text-xs text-slate-500 capitalize">{product.category}</p>
                                      </div>
                                  </div>
                                  <div className="col-span-2 text-sm font-medium text-slate-900">{product.price.toLocaleString()} MT</div>
                                  <div className="col-span-2">{getStatusBadge(product.status)}</div>
                                  <div className="col-span-2 text-sm text-slate-500">{product.sales_count} vendas</div>
                                  <div className="col-span-1 flex justify-end">
                                      <button 
                                        onClick={() => handleEditProduct(product)}
                                        className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                      >
                                          <Edit3 size={16}/>
                                      </button>
                                  </div>
                              </div>

                              {/* Mobile Card */}
                              <div className="md:hidden p-4 flex items-start gap-4">
                                  <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                                      {product.image_url ? (
                                          <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                          <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={20}/></div>
                                      )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-start mb-1">
                                          <h3 className="font-bold text-slate-900 text-sm truncate pr-2">{product.name}</h3>
                                          <button onClick={() => handleEditProduct(product)} className="text-slate-400 hover:text-brand-600"><Edit3 size={16}/></button>
                                      </div>
                                      <div className="mb-2">{getStatusBadge(product.status)}</div>
                                      <div className="flex items-center justify-between text-sm">
                                          <span className="font-bold text-slate-800">{product.price.toLocaleString()} MT</span>
                                          <span className="text-slate-500 text-xs">{product.sales_count} vendas</span>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
            )}
          </div>
        )}

        {/* PAYMENT LINKS */}
        {activeTab === 'links' && (
           <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">Links de Pagamento</h1>
                    <p className="text-slate-500">Gerencie seus links de checkout.</p>
                  </div>
               </div>

               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                   <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">Gerar Novo Link</h3>
                   <div className="flex flex-col md:flex-row gap-3 items-end">
                       <div className="flex-1 w-full">
                           <label className="block text-xs font-bold text-slate-500 mb-2">Selecione o Produto</label>
                           <div className="relative">
                               <select 
                                 value={selectedProductIdForLink}
                                 onChange={(e) => setSelectedProductIdForLink(e.target.value)}
                                 className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 appearance-none text-sm font-medium"
                               >
                                   <option value="">Selecione um produto aprovado...</option>
                                   {products.filter(p => p.status === 'active').map(p => (
                                       <option key={p.id} value={p.id}>{p.name} - {p.price} MT</option>
                                   ))}
                               </select>
                               <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><Search size={16}/></div>
                           </div>
                       </div>
                       <button 
                         onClick={generateLink}
                         disabled={!selectedProductIdForLink || isCreatingLink}
                         className="w-full md:w-auto px-6 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                       >
                         {isCreatingLink ? <Loader2 size={16} className="animate-spin" /> : <LinkIcon size={16} />}
                         Gerar Link
                       </button>
                   </div>
               </div>

               <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                   {paymentLinks.length === 0 ? (
                       <div className="p-12 text-center text-slate-400">
                           <LinkIcon size={32} className="mx-auto mb-3 opacity-20"/>
                           <p className="text-sm">Nenhum link gerado.</p>
                       </div>
                   ) : (
                       <div className="overflow-x-auto">
                           <table className="w-full text-left">
                               <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                                   <tr>
                                       <th className="p-4 w-32">Data</th>
                                       <th className="p-4">Produto</th>
                                       <th className="p-4">Link</th>
                                       <th className="p-4 text-center w-24">Cliques</th>
                                       <th className="p-4 text-right w-24">Ação</th>
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
                                                 className="inline-flex items-center gap-2 text-brand-600 cursor-pointer hover:bg-brand-50 px-2 py-1 rounded transition-colors max-w-[200px] truncate"
                                               >
                                                   <Copy size={12}/> <span className="truncate">{link.url}</span>
                                               </div>
                                           </td>
                                           <td className="p-4 text-center text-slate-500">{link.clicks}</td>
                                           <td className="p-4 text-right">
                                               <a href={link.url} target="_blank" className="text-slate-400 hover:text-brand-600 inline-block p-1">
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
           <div className="animate-fadeIn p-8 bg-white rounded-xl border border-slate-200 max-w-2xl mx-auto text-center">
               <Settings size={48} className="mx-auto text-slate-200 mb-4"/>
               <h2 className="text-xl font-bold mb-2">Configurações</h2>
               <p className="text-slate-500">Em breve você poderá gerenciar seu perfil e preferências aqui.</p>
           </div>
        )}

      </main>

      {/* --- PRODUCT MODAL --- */}
      {showProductModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-slideUp">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                <h2 className="text-lg font-bold text-slate-900">
                    {editingId ? 'Editar Produto' : 'Novo Produto'}
                </h2>
                <button onClick={() => setShowProductModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white">
               <div className="space-y-6">
                   {productFormStep === 1 && (
                       <div className="space-y-4">
                           <div>
                               <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Nome do Produto</label>
                               <input type="text" className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Ex: Curso de Marketing" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Descrição</label>
                               <textarea className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" rows={3} placeholder="Descreva seu produto..." value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})}></textarea>
                               <button onClick={handleGenerateDescriptionAI} className="mt-2 text-purple-600 text-xs font-bold flex gap-1 items-center hover:underline"><Sparkles size={12}/> Gerar com IA</button>
                           </div>
                           <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Imagem de Capa</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden">
                                        {newProduct.image_url ? <img src={newProduct.image_url} className="w-full h-full object-cover"/> : <ImageIcon className="text-slate-300"/>}
                                    </div>
                                    <div className="flex-1">
                                         <input type="text" className="w-full p-2 text-xs border border-slate-200 rounded mb-2" placeholder="Cole uma URL de imagem..." value={newProduct.image_url || ''} onChange={e => setNewProduct({...newProduct, image_url: e.target.value})} />
                                         <div className="flex gap-2">
                                            <button onClick={() => productImageInputRef.current?.click()} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded">Upload do PC</button>
                                            <input type="file" className="hidden" ref={productImageInputRef} onChange={handleProductImageUpload} accept="image/*" />
                                         </div>
                                    </div>
                                </div>
                           </div>
                       </div>
                   )}
                   {productFormStep === 2 && (
                       <div className="space-y-4">
                           <div>
                               <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Preço (MT)</label>
                               <input type="number" className="w-full p-3 border border-slate-200 rounded-lg text-lg font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none" placeholder="0.00" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} />
                           </div>
                           
                           <div>
                               <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Link de Entrega (Após Pagamento)</label>
                               <input type="url" className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Ex: Link do Google Drive, Canal do Telegram..." value={newProduct.redemption_link || ''} onChange={e => setNewProduct({...newProduct, redemption_link: e.target.value})} />
                           </div>

                           <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                               <div className="flex items-center justify-between">
                                   <span className="text-sm font-bold text-slate-700">Oferta por Tempo Limitado</span>
                                   <div onClick={() => setNewProduct({...newProduct, is_limited_time: !newProduct.is_limited_time})} className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${newProduct.is_limited_time ? 'bg-brand-500' : 'bg-slate-300'}`}>
                                       <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${newProduct.is_limited_time ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                   </div>
                               </div>
                               <div className="flex items-center justify-between">
                                   <span className="text-sm font-bold text-slate-700">Order Bump (Oferta Extra)</span>
                                   <div onClick={() => setNewProduct({...newProduct, has_offer: !newProduct.has_offer})} className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${newProduct.has_offer ? 'bg-brand-500' : 'bg-slate-300'}`}>
                                       <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${newProduct.has_offer ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                   </div>
                               </div>
                               {newProduct.has_offer && (
                                    <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 animate-fadeIn">
                                        <input type="text" placeholder="Título Extra" className="p-2 border rounded text-xs" value={newProduct.offer_title} onChange={e => setNewProduct({...newProduct, offer_title: e.target.value})} />
                                        <input type="number" placeholder="Preço Extra" className="p-2 border rounded text-xs" value={newProduct.offer_price || ''} onChange={e => setNewProduct({...newProduct, offer_price: parseFloat(e.target.value)})} />
                                    </div>
                               )}
                           </div>
                       </div>
                   )}
                   {productFormStep === 3 && (
                       <div className="text-center py-8">
                           <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-600"><Sparkles size={24}/></div>
                           <h3 className="font-bold text-lg mb-2">Quase lá!</h3>
                           <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">Ao salvar, seu produto passará por uma análise rápida de segurança (IA) antes de ser liberado.</p>
                           <button onClick={() => saveProduct('active')} disabled={isSavingProduct} className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-brand-200 w-full flex justify-center items-center gap-2">
                               {isSavingProduct ? <Loader2 className="animate-spin" size={20} /> : <Save size={20}/>}
                               {isSavingProduct ? 'Salvando...' : 'Publicar Produto'}
                           </button>
                       </div>
                   )}
               </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                {productFormStep > 1 ? (
                    <button onClick={() => setProductFormStep(s => s-1)} className="text-slate-500 text-sm font-bold hover:text-slate-800">Voltar</button>
                ) : (
                    <div/>
                )}
                
                {productFormStep < 3 && (
                    <button onClick={() => setProductFormStep(s => s+1)} className="bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-slate-800">
                        Próximo
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