import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, MoreVertical, Edit2, Trash2, Tag, Box, Sparkles, X, Loader2, AlertTriangle, CheckCircle, Ban, Upload, MessageCircle, BarChart, Info, Link as LinkIcon, Crop, Image as ImageIcon, RefreshCw, Database, ServerOff } from 'lucide-react';
import { Product, Notification, User } from '../types';
import { generateProductDescription, analyzeContentSafety } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';

const CATEGORIES = [
  "Eletrônicos", "Moda", "Acessórios", "Games", "Beleza", "Saúde", 
  "Casa e Decoração", "Brinquedos", "Automotivo", "Livros", "Pet Shop", 
  "Ferramentas", "Jardim", "Escritório", "Alimentos", "Serviços", "Outros"
];

const MOCK_PRODUCTS: Product[] = [
    { id: '1', name: 'Fone Bluetooth Pro', category: 'Eletrônicos', price: 1500, stock: 10, description: 'Fone com cancelamento de ruído.', status: 'approved', salesCount: 5, user_id: 'mock', created_at: new Date().toISOString() } as any,
    { id: '2', name: 'Smartwatch Series 5', category: 'Acessórios', price: 2500, stock: 5, description: 'Relógio inteligente à prova d\'água.', status: 'approved', salesCount: 2, user_id: 'mock', created_at: new Date().toISOString() } as any,
];

interface ProductsProps {
    user: User;
}

const Products: React.FC<ProductsProps> = ({ user }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [processingImage, setProcessingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCorsError, setIsCorsError] = useState(false);
  const [showSqlHelp, setShowSqlHelp] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Image Cropping State
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);

  // Form State
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    category: '',
    price: 0,
    stock: 0,
    description: '',
    imageUrl: '',
    whatsapp: '',
    pixelId: '',
    analyticsId: '',
    redirectUrl: ''
  });

  // Fetch Products from Supabase
  useEffect(() => {
    if (user) {
        fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsCorsError(false);
      setShowSqlHelp(false);
      
      const { data, error: dbError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id) 
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;
      
      if (data) {
          setProducts(data);
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      
      let msg = "Falha ao conectar com o banco de dados.";
      
      // Detectar erro de CORS/Fetch (Ambiente de Preview)
      if (err.message?.includes('fetch') || err.message?.includes('network')) {
          msg = "Conexão bloqueada pelo navegador (CORS).";
          setIsCorsError(true);
      } 
      // Detectar falta de tabela
      else if (err.code === '42P01' || err.code === '400') {
          msg = "Tabela 'products' não encontrada no Supabase.";
          setShowSqlHelp(true);
      } else {
          msg = err.message || "Erro desconhecido.";
      }

      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockData = () => {
      setProducts(MOCK_PRODUCTS);
      setError(null);
      setIsCorsError(false);
      setNotification({ type: 'success', text: 'Modo de Demonstração ativado com dados locais.' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProcessingImage(true);
    const file = e.target.files?.[0];
    if (!file) {
        setProcessingImage(false);
        return;
    }

    if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        setProcessingImage(false);
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        if (event.target?.result) {
            setTempImage(event.target.result as string);
            setShowCropModal(true);
        }
        setProcessingImage(false);
    };
    reader.onerror = () => {
        setProcessingImage(false);
        alert("Erro ao ler o arquivo.");
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const confirmCrop = () => {
      if (!tempImage) return;
      setProcessingImage(true);
      const img = new Image();
      img.src = tempImage;
      img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = 1080; 
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) { setProcessingImage(false); return; }

          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;

          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
          const finalDataUrl = canvas.toDataURL('image/jpeg', 0.90);
          
          setNewProduct(prev => ({ ...prev, imageUrl: finalDataUrl }));
          setShowCropModal(false);
          setTempImage(null);
          setProcessingImage(false);
      };
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length > 0 && !val.startsWith('258')) {
          val = '258' + val;
      }
      setNewProduct(prev => ({ ...prev, whatsapp: '+' + val }));
  };

  const handleGenerateDescription = async () => {
    if (!newProduct.name || !newProduct.category) {
      alert("Por favor, preencha o nome e a categoria antes de gerar a descrição.");
      return;
    }
    setIsGenerating(true);
    const desc = await generateProductDescription(newProduct.name, newProduct.category);
    setNewProduct(prev => ({ ...prev, description: desc }));
    setIsGenerating(false);
  };

  const triggerVerificationProcess = async (product: Product) => {
      if (isCorsError) return; // Skip if in demo mode

      setTimeout(async () => {
          try {
              const analysis = await analyzeContentSafety(product.name, product.category, product.imageUrl);
              
              const newStatus = analysis.safe ? 'approved' : 'rejected';
              const reason = analysis.reason;

              const { error } = await supabase
                .from('products')
                .update({ status: newStatus, rejectionReason: reason })
                .eq('id', product.id);

              if (!error) {
                  setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus, rejectionReason: reason } : p));
                  
                  const notif: Notification = {
                      id: Date.now().toString(),
                      title: analysis.safe ? 'Produto Aprovado!' : 'Produto Reprovado',
                      message: analysis.safe 
                        ? `O produto "${product.name}" foi verificado e aprovado para vendas.` 
                        : `O produto "${product.name}" foi reprovado. Motivo: ${reason}`,
                      type: analysis.safe ? 'success' : 'error',
                      read: false,
                      created_at: new Date().toLocaleTimeString()
                  };
                  
                  const event = new CustomEvent('payeasy-notification', { detail: notif });
                  window.dispatchEvent(event);
              }
          } catch (e) {
              console.error("Falha na verificação automática", e);
          }
      }, 5000); 
  };

  const handleOpenModal = (product?: Product) => {
      if (product) {
          setEditingId(product.id);
          setNewProduct({ ...product });
      } else {
          setEditingId(null);
          setNewProduct({ name: '', category: '', price: 0, stock: 0, description: '', imageUrl: '', whatsapp: '', pixelId: '', analyticsId: '', redirectUrl: '' });
      }
      setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotification(null);
    setIsGenerating(true); 
    
    // DEMO MODE HANDLER
    if (isCorsError) {
        const fakeProduct = {
            ...newProduct,
            id: editingId || Date.now().toString(),
            user_id: user.id,
            status: 'approved',
            salesCount: 0,
            price: Number(newProduct.price),
            stock: Number(newProduct.stock)
        } as Product;

        if (editingId) {
            setProducts(products.map(p => p.id === editingId ? fakeProduct : p));
        } else {
            setProducts([fakeProduct, ...products]);
        }
        setNotification({ type: 'success', text: 'Produto salvo (Modo Demo).' });
        setIsModalOpen(false);
        setIsGenerating(false);
        return;
    }
    
    try {
        const productData = {
            name: newProduct.name!,
            category: newProduct.category!,
            price: Number(newProduct.price),
            stock: Number(newProduct.stock),
            description: newProduct.description!,
            imageUrl: newProduct.imageUrl,
            whatsapp: newProduct.whatsapp,
            pixelId: newProduct.pixelId,
            analyticsId: newProduct.analyticsId,
            redirectUrl: newProduct.redirectUrl,
            user_id: user.id,
            status: 'pending' as const, 
            salesCount: 0
        };

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.user) throw new Error("Sessão expirada. Faça login novamente.");

        let savedProduct: Product | null = null;

        if (editingId) {
             const { data, error } = await supabase.from('products').update(productData).eq('id', editingId).select();
             if (error) throw error;
             if (data) {
                savedProduct = data[0] as Product;
                setProducts(products.map(p => p.id === editingId ? savedProduct! : p));
             }
             setNotification({ type: 'success', text: 'Produto atualizado com sucesso.' });
        } else {
            const { data, error } = await supabase.from('products').insert([productData]).select();
            if (error) throw error;
            if (data) {
                savedProduct = data[0] as Product;
                setProducts([savedProduct, ...products]);
            }
            setNotification({ type: 'success', text: 'Produto criado com sucesso.' });
        }

        if (savedProduct) {
            triggerVerificationProcess(savedProduct);
        }
        
        setIsModalOpen(false);
        setNewProduct({ name: '', category: '', price: 0, stock: 0, description: '', imageUrl: '', whatsapp: '', pixelId: '', analyticsId: '', redirectUrl: '' });

    } catch (err: any) {
        console.error("Error saving product:", err);
        
        let msg = err.message || 'Verifique sua conexão';
        if (err.message?.includes('fetch')) {
             msg = "Não foi possível salvar (Bloqueio do Navegador/CORS).";
        }
        setError(msg);

        if (err.code === '42P01' || err.code === '400' || err.message?.includes('fetch')) {
             if (err.message?.includes('fetch')) setIsCorsError(true);
             else setShowSqlHelp(true);
        }
    } finally {
        setIsGenerating(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
      if(!window.confirm("Tem certeza que deseja excluir este produto?")) return;

      if (isCorsError) {
          setProducts(products.filter(p => p.id !== id));
          return;
      }

      try {
          const { error } = await supabase.from('products').delete().eq('id', id);
          if (error) throw error;
          setProducts(products.filter(p => p.id !== id));
      } catch (err: any) {
          console.error("Error deleting product", err);
          alert(`Erro ao excluir: ${err.message}`);
      }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
      return (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p>Carregando produtos...</p>
          </div>
      )
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meus Produtos</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie seu catálogo e estoque.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={20} className="mr-2" />
          Novo Produto
        </button>
      </div>

      {notification && (
        <div className={`border px-4 py-4 rounded-lg text-sm flex items-center justify-between animate-fade-in ${
            notification.type === 'success' 
            ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
            : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
            <div className="flex items-center gap-2">
                <Info size={20} />
                <span className="font-medium">{notification.text}</span>
            </div>
            <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100"><X size={18} /></button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-lg text-sm break-words flex flex-col gap-4">
            <div className="flex items-start gap-3">
                 <ServerOff size={24} className="mt-0.5 shrink-0 text-red-600" />
                 <div>
                    <h3 className="font-bold text-red-800 mb-1">Problema de Conexão</h3>
                    <p>{error}</p>
                 </div>
            </div>

             {/* CORS Error Special Handling */}
             {isCorsError && (
                 <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm mt-2">
                     <p className="text-gray-600 dark:text-gray-400 text-xs mb-3">
                         Você está executando este projeto em um ambiente de pré-visualização (Blob URL) que não permite conexão com bancos externos por segurança.
                     </p>
                     <p className="text-gray-600 dark:text-gray-400 text-xs mb-4 font-bold">
                         Opção 1 (Recomendada): Baixe o código e rode localmente ou na Vercel.<br/>
                         Opção 2 (Imediata): Use o modo de demonstração para testar o design agora.
                     </p>
                     <button 
                        onClick={loadMockData}
                        className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
                     >
                        Ativar Modo Demonstração (Dados Fictícios)
                     </button>
                 </div>
             )}
             
             {showSqlHelp && (
                 <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm mt-2">
                     <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                         <Database size={16} /> Configuração Pendente
                     </h4>
                     <p className="text-gray-600 dark:text-gray-400 text-xs mb-3">
                         A tabela <code>products</code> não existe. Execute o SQL abaixo no painel do Supabase.
                     </p>
                     {/* ... (SQL Preview omitted for brevity as it is in Settings) ... */}
                     <p className="text-xs text-indigo-600 cursor-pointer" onClick={() => setShowSqlHelp(false)}>Ocultar ajuda</p>
                 </div>
             )}

             {!isCorsError && (
                <button 
                    onClick={fetchProducts}
                    className="self-start px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mt-2"
                >
                    <RefreshCw size={16} /> Tentar Novamente
                </button>
             )}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou categoria..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Product List */}
      {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Box size={48} className="mx-auto mb-4 opacity-20" />
              <p>{error ? "Não foi possível carregar os produtos." : "Nenhum produto encontrado."}</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow group relative flex flex-col h-full">
                {/* Status Overlay */}
                {product.status !== 'approved' && (
                    <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-4 backdrop-blur-[1px] ${
                        product.status === 'rejected' ? 'bg-red-900/10' : 'bg-gray-900/10'
                    }`}>
                        <div className={`bg-white dark:bg-gray-900 p-3 rounded-full mb-2 shadow-sm ${
                             product.status === 'rejected' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                            {product.status === 'rejected' ? <Ban size={24} /> : <Loader2 size={24} className="animate-spin" />}
                        </div>
                        <span className={`font-bold ${product.status === 'rejected' ? 'text-red-700 dark:text-red-400' : 'text-blue-700 dark:text-blue-400'}`}>
                            {product.status === 'rejected' ? 'Produto Proibido' : 'Em Análise'}
                        </span>
                        {product.status === 'rejected' && (
                            <div className="flex gap-2 mt-2">
                                <p className="text-xs text-red-600 dark:text-red-300 bg-white/80 dark:bg-black/50 px-2 py-1 rounded">
                                    {product.rejectionReason || "Violação de termos"}
                                </p>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id); }} className="bg-red-600 text-white p-1 rounded hover:bg-red-700"><Trash2 size={16} /></button>
                            </div>
                        )}
                    </div>
                )}
                
                <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
                {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400"><Box size={32}/></div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                    <button 
                        onClick={() => handleOpenModal(product)}
                        className="p-1.5 bg-white/90 rounded-full text-gray-600 hover:text-indigo-600 hover:bg-white transition-all shadow-sm z-20"
                        title="Editar"
                    >
                        <Edit2 size={16} />
                    </button>
                </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 truncate max-w-[120px]">
                        {product.category}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${product.stock > 10 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20'}`}>
                        {product.stock} un
                        </span>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1 truncate">{product.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{product.description}</p>
                    
                    <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{product.price.toFixed(2)} MZN</span>
                        <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors z-20"
                            title="Excluir"
                        >
                        <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            </div>
            ))}
        </div>
      )}

      {/* Image Cropper Modal and Add Product Modal remain same structure */}
      {showCropModal && (
          <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                      <h3 className="font-bold text-gray-900 dark:text-white">Ajustar Imagem</h3>
                      <button onClick={() => { setShowCropModal(false); setTempImage(null); }} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full"><X size={20} /></button>
                  </div>
                  <div className="p-6 flex flex-col items-center">
                      {processingImage ? (
                          <div className="py-12 flex flex-col items-center">
                               <Loader2 className="animate-spin text-indigo-600 mb-2" size={32} />
                               <p className="text-sm text-gray-500">Processando...</p>
                          </div>
                      ) : (
                          <>
                            <div className="w-full max-w-[280px] aspect-square bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden relative mb-6 border-2 border-indigo-500 shadow-inner">
                                {tempImage && (
                                    <img src={tempImage} alt="Crop" className="w-full h-full object-cover" />
                                )}
                            </div>
                            <button 
                                onClick={confirmCrop}
                                className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                            >
                                <Crop size={18} /> Confirmar Corte
                            </button>
                          </>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingId ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="p-6 space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                  {/* Image Upload */}
                  <div className="w-full md:w-1/3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Imagem do Produto</label>
                      <label 
                        className={`relative block w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-colors cursor-pointer ${
                            processingImage 
                            ? 'bg-gray-50 border-gray-300 cursor-wait' 
                            : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-gray-600'
                        }`}
                      >
                          <input 
                            type="file" 
                            accept="image/png, image/jpeg, image/jpg, image/webp" 
                            onChange={handleFileChange} 
                            className="sr-only" 
                            disabled={processingImage}
                          />
                          {processingImage ? (
                               <div className="flex flex-col items-center justify-center text-indigo-600 p-4 text-center">
                                   <Loader2 className="animate-spin mb-2" size={24} />
                                   <span className="text-xs font-medium">Carregando imagem...</span>
                               </div>
                          ) : newProduct.imageUrl ? (
                              <>
                                <img src={newProduct.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                    <span className="text-white text-xs font-bold flex items-center gap-1">
                                        <Edit2 size={12} /> Trocar
                                    </span>
                                </div>
                              </>
                          ) : (
                              <div className="text-center p-4">
                                  <ImageIcon className="mx-auto text-gray-400 mb-2" size={32} />
                                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Toque para adicionar</p>
                              </div>
                          )}
                      </label>
                  </div>

                  {/* Basic Info */}
                  <div className="w-full md:w-2/3 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Produto</label>
                            <input 
                                type="text" 
                                required
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={newProduct.name}
                                onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preço (MZN)</label>
                                <input 
                                    type="number" 
                                    required
                                    step="0.01"
                                    min="0"
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={newProduct.price}
                                    onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estoque</label>
                                <input 
                                    type="number" 
                                    required
                                    min="0"
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={newProduct.stock}
                                    onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                            <select 
                                required
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={newProduct.category}
                                onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                            >
                                <option value="">Selecione uma categoria...</option>
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                  </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                  <button 
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={isGenerating}
                    className="text-xs flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium disabled:opacity-50"
                  >
                    <Sparkles size={14} className="mr-1" />
                    {isGenerating ? 'Gerando...' : 'Gerar com IA'}
                  </button>
                </div>
                <textarea 
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                  placeholder="Descreva seu produto..."
                  value={newProduct.description}
                  onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                ></textarea>
              </div>

              {/* Extra Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                          <MessageCircle size={16} className="text-green-500" /> WhatsApp (+258)
                      </label>
                      <input 
                        type="tel" 
                        placeholder="+258 84 123 4567"
                        required
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={newProduct.whatsapp}
                        onChange={handleWhatsappChange}
                      />
                  </div>
                  <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                          <LinkIcon size={16} className="text-blue-500" /> Link de Entrega/Retorno
                      </label>
                      <input 
                        type="url" 
                        placeholder="https://link.deentrega.com/..."
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        value={newProduct.redirectUrl}
                        onChange={e => setNewProduct({...newProduct, redirectUrl: e.target.value})}
                      />
                  </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isGenerating}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-md disabled:opacity-70"
                >
                  {isGenerating ? 'Analisando...' : (editingId ? 'Salvar Alterações' : 'Salvar Produto')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;