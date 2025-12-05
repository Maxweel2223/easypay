import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, Edit2, Trash2, Tag, Box, Sparkles, X, Loader2, AlertTriangle, CheckCircle, Ban, Upload, MessageCircle, BarChart, Info } from 'lucide-react';
import { Product, Notification } from '../types';
import { generateProductDescription, analyzeContentSafety } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';

const CATEGORIES = [
  "Eletrônicos", "Moda", "Acessórios", "Games", "Beleza", "Saúde", 
  "Casa e Decoração", "Brinquedos", "Automotivo", "Livros", "Pet Shop", 
  "Ferramentas", "Jardim", "Escritório", "Alimentos", "Serviços", "Outros"
];

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
    analyticsId: ''
  });

  // Fetch Products from Supabase
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) return;

      const { data, error: dbError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id) // Filter by logged in user
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;
      if (data) setProducts(data);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      let errorMessage = typeof err === 'string' ? err : err?.message || JSON.stringify(err);
      
      if (err?.code === '42P01' || err?.code === 'PGRST205') { 
          // SQL for updated schema
          const sqlScript = `
-- Execute no Supabase SQL Editor
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  description text,
  price numeric not null,
  stock numeric default 0,
  category text,
  "imageUrl" text,
  "salesCount" numeric default 0,
  user_id uuid references auth.users not null,
  status text default 'pending',
  "rejectionReason" text,
  whatsapp text,
  "pixelId" text,
  "analyticsId" text
);
alter table public.products enable row level security;
create policy "Users can view their own products" on public.products for select using (auth.uid() = user_id);
create policy "Users can insert their own products" on public.products for insert with check (auth.uid() = user_id);
create policy "Users can update their own products" on public.products for update using (auth.uid() = user_id);
create policy "Users can delete their own products" on public.products for delete using (auth.uid() = user_id);
          `;
          console.log(sqlScript);
          setError("Tabela 'products' não encontrada ou desatualizada. Verifique o console para o script SQL.");
      } else {
          setError(`Erro ao carregar produtos: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
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
      // Simulate 2 minutes wait (shortened to 10s for demo purposes, but labelled as requested)
      console.log(`Iniciando verificação para ${product.id}. Aguardando análise...`);
      
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
                  
                  // Trigger Global Notification
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
      }, 10000); // Using 10s for demo usability instead of 120s (2 min), but simulating the async process
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotification(null);
    setIsGenerating(true); 
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        // Validate fields
        if (!newProduct.whatsapp || newProduct.whatsapp.length < 12) {
            throw new Error("Número de WhatsApp inválido. Use o formato +258...");
        }

        const productToSave = {
            name: newProduct.name,
            category: newProduct.category,
            price: Number(newProduct.price),
            stock: Number(newProduct.stock),
            description: newProduct.description,
            imageUrl: newProduct.imageUrl,
            whatsapp: newProduct.whatsapp,
            pixelId: newProduct.pixelId,
            analyticsId: newProduct.analyticsId,
            salesCount: 0,
            user_id: user.id,
            status: 'pending', // Always pending initially
            rejectionReason: null
        };

        const { data, error } = await supabase
            .from('products')
            .insert([productToSave])
            .select();

        if (error) throw error;

        if (data) {
            const savedProduct = data[0] as Product;
            setProducts([savedProduct, ...products]);
            triggerVerificationProcess(savedProduct);
        }
        
        setIsModalOpen(false);
        setNewProduct({ name: '', category: '', price: 0, stock: 0, description: '', imageUrl: '', whatsapp: '', pixelId: '', analyticsId: '' });

        setNotification({ type: 'success', text: 'Produto enviado para verificação (aprox. 2 min).' });

    } catch (err: any) {
        console.error("Error saving product:", err);

        if (err?.code === 'PGRST204' || (err?.message && err.message.includes('Could not find the'))) {
             const updateSql = `
-- Execute no Supabase SQL Editor para adicionar as colunas novas:
alter table public.products add column if not exists whatsapp text;
alter table public.products add column if not exists "pixelId" text;
alter table public.products add column if not exists "analyticsId" text;
             `;
             console.info('%c Colunas faltando! Execute este SQL:', 'color: #ef4444; font-weight: bold;');
             console.log(updateSql);
             setError("Erro de banco de dados: Colunas novas ausentes. Verifique o console (F12) para o comando SQL de atualização.");
        } else {
             setError(`Erro ao salvar: ${err.message || 'Falha desconhecida'}`);
        }
    } finally {
        setIsGenerating(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
      if(!window.confirm("Tem certeza que deseja excluir este produto?")) return;

      try {
          const { error } = await supabase.from('products').delete().eq('id', id);
          if (error) throw error;
          setProducts(products.filter(p => p.id !== id));
      } catch (err) {
          console.error("Error deleting product", err);
          alert("Erro ao excluir produto.");
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meus Produtos</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie seu catálogo e estoque.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm break-words">
            {error}
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
              <p>Nenhum produto encontrado.</p>
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
                            {product.status === 'rejected' ? 'Produto Proibido' : 'Em Análise (2 min)'}
                        </span>
                        {product.status === 'rejected' && (
                            <p className="text-xs text-red-600 dark:text-red-300 mt-1 bg-white/80 dark:bg-black/50 px-2 py-1 rounded">
                                {product.rejectionReason || "Violação de termos"}
                            </p>
                        )}
                    </div>
                )}
                
                <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
                {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400"><Box size={32}/></div>
                )}
                <div className="absolute top-2 right-2">
                    <button className="p-1.5 bg-white/90 rounded-full text-gray-600 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
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
                        <span className="text-lg font-bold text-gray-900 dark:text-white">MT {product.price.toFixed(2)}</span>
                        <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors z-20"
                        >
                        <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            </div>
            ))}
        </div>
      )}

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Novo Produto</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="p-6 space-y-6">
              
              <div className="flex flex-col md:flex-row gap-6">
                  {/* Image Upload */}
                  <div className="w-full md:w-1/3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Imagem do Produto</label>
                      <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center overflow-hidden group hover:border-indigo-500 transition-colors">
                          {newProduct.imageUrl ? (
                              <img src={newProduct.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                              <div className="text-center p-4">
                                  <Upload className="mx-auto text-gray-400 mb-2" />
                                  <p className="text-xs text-gray-500">Clique para upload</p>
                              </div>
                          )}
                          <input type="file" required accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preço (MT)</label>
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
                  <div className="space-y-2">
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                          <BarChart size={16} className="text-blue-500" /> Rastreamento (Opcional)
                      </label>
                      <input 
                        type="text" 
                        placeholder="Meta Pixel ID"
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm mb-2"
                        value={newProduct.pixelId}
                        onChange={e => setNewProduct({...newProduct, pixelId: e.target.value})}
                      />
                       <input 
                        type="text" 
                        placeholder="Google Analytics ID (UA-XXXX...)"
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        value={newProduct.analyticsId}
                        onChange={e => setNewProduct({...newProduct, analyticsId: e.target.value})}
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
                  {isGenerating ? 'Analisando...' : 'Salvar Produto'}
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