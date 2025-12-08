import React, { useState, useEffect } from 'react';
import { Copy, Share2, QrCode, ExternalLink, Check, Loader2, AlertCircle, ShoppingBag, History, RefreshCw, Database, ServerOff } from 'lucide-react';
import { Product, User } from '../types';
import { supabase } from '../services/supabaseClient';

const MOCK_PRODUCTS: Product[] = [
    { id: '1', name: 'Fone Bluetooth Pro', category: 'Eletrônicos', price: 1500, stock: 10, description: 'Fone com cancelamento de ruído.', status: 'approved', salesCount: 5, user_id: 'mock', created_at: new Date().toISOString() } as any,
    { id: '2', name: 'Smartwatch Series 5', category: 'Acessórios', price: 2500, stock: 5, description: 'Relógio inteligente à prova d\'água.', status: 'approved', salesCount: 2, user_id: 'mock', created_at: new Date().toISOString() } as any,
];

interface GeneratedLink {
    id: string;
    product_id: string;
    product_name: string;
    product_image: string;
    price: number;
    created_at: string;
}

interface LinksProps {
    user: User;
}

const Links: React.FC<LinksProps> = ({ user }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [generatedLinksHistory, setGeneratedLinksHistory] = useState<GeneratedLink[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCorsError, setIsCorsError] = useState(false);
  const [showSqlHelp, setShowSqlHelp] = useState(false);

  useEffect(() => {
    if (user) {
        fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
        setLoading(true);
        setError(null);
        setShowSqlHelp(false);
        setIsCorsError(false);
        
        // Fetch Products
        const { data: prodData, error: prodError } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'approved'); 

        if (prodError) throw prodError;
        if (prodData) setProducts(prodData);

        // Fetch Generated Links History
        const { data: linkData, error: linkError } = await supabase
            .from('payment_links')
            .select(`
                id,
                created_at,
                product_id,
                products (name, imageUrl, price)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (linkError) throw linkError;

        if (linkData) {
            const mappedLinks: GeneratedLink[] = linkData.map((item: any) => ({
                id: item.id,
                product_id: item.product_id,
                product_name: item.products?.name || 'Produto Removido',
                product_image: item.products?.imageUrl || '',
                price: item.products?.price || 0,
                created_at: new Date(item.created_at).toLocaleDateString()
            }));
            setGeneratedLinksHistory(mappedLinks);
        }

    } catch (err: any) {
        console.error("Error loading data:", err);
        let msg = "Erro ao carregar dados.";
        
        if (err.message?.includes('fetch') || err.message?.includes('network')) {
            msg = "Conexão bloqueada pelo navegador (CORS/Blob).";
            setIsCorsError(true);
        }
        else if (err.code === '42P01' || err.code === '400') {
            msg = "Falha ao acessar tabelas. Verifique o banco de dados.";
            setShowSqlHelp(true);
        } else {
            msg = err.message || "Erro desconhecido";
        }
        
        setError(msg);
    } finally {
        setLoading(false);
    }
  };

  const loadMockData = () => {
      setProducts(MOCK_PRODUCTS);
      setGeneratedLinksHistory([
          { id: '101', product_id: '1', product_name: 'Fone Bluetooth Pro', product_image: '', price: 1500, created_at: new Date().toLocaleDateString() }
      ]);
      setError(null);
      setIsCorsError(false);
  };

  const handleGenerate = async () => {
    if(!selectedProduct) return;
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    
    // DEMO MODE
    if (isCorsError || product.user_id === 'mock') {
         setGeneratedLinksHistory(prev => [{
            id: Date.now().toString(), 
            product_id: product.id,
            product_name: product.name,
            product_image: product.imageUrl || '',
            price: product.price,
            created_at: new Date().toLocaleDateString()
        }, ...prev]);
        setGeneratedLink(`https://fastpayzinmoz.vercel.app/#/checkout/${product.id}`);
        return;
    }

    try {
        setLoading(true);

        const { error } = await supabase.from('payment_links').insert([{
            user_id: user.id,
            product_id: product.id
        }]);

        if (error) throw error;

        setGeneratedLinksHistory(prev => [{
            id: Date.now().toString(), 
            product_id: product.id,
            product_name: product.name,
            product_image: product.imageUrl || '',
            price: product.price,
            created_at: new Date().toLocaleDateString()
        }, ...prev]);

        setGeneratedLink(`https://fastpayzinmoz.vercel.app/#/checkout/${product.id}`);
    } catch (err: any) {
        console.error("Error generating link", err);
        alert(`Erro ao gerar link: ${err.message || 'Falha de conexão'}`);
        if (err.code === '42P01') {
            setShowSqlHelp(true);
            setError("Tabela 'payment_links' não existe.");
        }
    } finally {
        setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!generatedLink) return;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Link de Pagamento PayEasy',
                text: 'Aqui está seu link de pagamento seguro:',
                url: generatedLink,
            });
        } catch (err) {
            console.log('Error sharing:', err);
        }
    } else {
        copyToClipboard(generatedLink);
        alert('Link copiado para a área de transferência!');
    }
  };

  const getLinkForProduct = (id: string) => `https://fastpayzinmoz.vercel.app/#/checkout/${id}`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Links de Pagamento</h1>
        <p className="text-gray-500 dark:text-gray-400">Crie links seguros para seus clientes pagarem via M-Pesa, eMola ou Cartão.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Generator Form */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Gerar Novo Link</h2>
            
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selecione o Produto (Aprovado)</label>
                    
                    {error ? (
                         <div className="flex flex-col gap-4 text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-100 w-full">
                             <div className="flex items-center">
                                <AlertCircle size={16} className="mr-2 shrink-0" />
                                <div>
                                    <span className="font-semibold">Erro:</span> {error}
                                </div>
                             </div>

                             {isCorsError && (
                                 <div className="mt-1">
                                    <button 
                                        onClick={loadMockData}
                                        className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1.5 rounded font-bold transition-colors"
                                    >
                                        Usar Modo Demonstração
                                    </button>
                                 </div>
                             )}

                             {showSqlHelp && (
                                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2 text-xs">
                                        <Database size={14} /> Tabela Faltando
                                    </h4>
                                    <p className="text-gray-500 text-xs mb-2">Rode este SQL no Supabase:</p>
                                    <pre className="bg-gray-900 text-gray-300 p-2 rounded text-[10px] overflow-x-auto whitespace-pre-wrap font-mono mb-2">
{`create table if not exists public.payment_links (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null,
  product_id uuid references public.products not null
);
alter table public.payment_links enable row level security;
create policy "Users can view their own links" on public.payment_links for select using (auth.uid() = user_id);
create policy "Users can insert their own links" on public.payment_links for insert with check (auth.uid() = user_id);`}
                                    </pre>
                                    <button 
                                        onClick={() => {
                                            const sql = `create table if not exists public.payment_links ( id uuid default gen_random_uuid() primary key, created_at timestamp with time zone default timezone('utc'::text, now()) not null, user_id uuid references auth.users not null, product_id uuid references public.products not null ); alter table public.payment_links enable row level security; create policy "Users can view their own links" on public.payment_links for select using (auth.uid() = user_id); create policy "Users can insert their own links" on public.payment_links for insert with check (auth.uid() = user_id);`;
                                            navigator.clipboard.writeText(sql);
                                            alert("SQL copiado!");
                                        }}
                                        className="w-full bg-indigo-100 text-indigo-700 px-2 py-1.5 rounded text-xs font-bold hover:bg-indigo-200"
                                    >
                                        Copiar SQL
                                    </button>
                                </div>
                             )}

                             {!isCorsError && (
                                <button onClick={fetchData} className="self-start px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-xs font-medium flex items-center gap-1">
                                    <RefreshCw size={12} /> Tentar Novamente
                                </button>
                             )}
                         </div>
                    ) : products.length === 0 && !loading ? (
                         <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">Você não possui produtos aprovados para gerar links.</p>
                    ) : (
                        <select 
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            value={selectedProduct}
                            onChange={(e) => {
                                setSelectedProduct(e.target.value);
                                setGeneratedLink(null);
                            }}
                            disabled={loading}
                        >
                            <option value="">Selecione...</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} - {p.price.toFixed(2)} MZN</option>
                            ))}
                        </select>
                    )}
                </div>

                <button 
                    onClick={handleGenerate}
                    disabled={!selectedProduct || loading}
                    className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                >
                    {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                    Gerar Link de Pagamento
                </button>

                {generatedLink && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-4 animate-fade-in">
                        <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300 mb-2">Link gerado e salvo no histórico!</p>
                        <div className="flex items-center gap-2">
                            <input 
                                type="text" 
                                readOnly 
                                value={generatedLink} 
                                className="flex-1 p-2 bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-700 rounded text-sm text-gray-600 dark:text-gray-300 outline-none"
                            />
                            <button 
                                onClick={() => copyToClipboard(generatedLink)}
                                className="p-2 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors"
                                title="Copiar"
                            >
                                {copied ? <Check size={20} /> : <Copy size={20} />}
                            </button>
                            <a 
                                href={generatedLink}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <ExternalLink size={20} />
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* QR Code Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center">
             <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">QR Code</h2>
             {generatedLink ? (
                 <div className="space-y-4 w-full flex flex-col items-center">
                     <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-inner inline-block">
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(generatedLink)}&margin=10`} 
                            alt="QR Code" 
                            className="w-48 h-48 object-contain"
                        />
                     </div>
                     <p className="text-sm text-gray-500 dark:text-gray-400">Envie esta imagem para seu cliente</p>
                     <button 
                        onClick={handleShare}
                        className="flex items-center justify-center w-full py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                     >
                        <Share2 size={16} className="mr-2" />
                        Compartilhar Link
                     </button>
                 </div>
             ) : (
                 <div className="flex flex-col items-center text-gray-400 py-10">
                     <QrCode size={48} className="mb-3 opacity-20" />
                     <p className="text-sm">Gere um link para visualizar o QR Code</p>
                 </div>
             )}
        </div>
      </div>

      {/* Link History Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 overflow-hidden">
          <div className="flex items-center gap-2 mb-6">
              <History className="text-indigo-600 dark:text-indigo-400" size={24} />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Histórico de Links Gerados</h2>
          </div>
          
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                          <th className="pb-3 pl-2 min-w-[200px]">Produto</th>
                          <th className="pb-3 min-w-[100px]">Data</th>
                          <th className="pb-3 min-w-[200px]">Link Ativo</th>
                          <th className="pb-3 text-right pr-2 min-w-[100px]">Ação</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {generatedLinksHistory.map(item => {
                          const link = getLinkForProduct(item.product_id);
                          return (
                            <tr key={item.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="py-4 pl-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                                            {item.product_image ? (
                                                <img src={item.product_image} alt="" className="w-full h-full object-cover"/>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400"><ShoppingBag size={16}/></div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white text-sm">{item.product_name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.price.toFixed(2)} MZN</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 text-sm text-gray-600 dark:text-gray-300">{item.created_at}</td>
                                <td className="py-4">
                                    <div className="flex items-center gap-2 max-w-[200px]">
                                        <p className="text-xs text-gray-500 truncate bg-gray-50 dark:bg-gray-900 p-1.5 rounded border border-gray-100 dark:border-gray-700 select-all">
                                            {link}
                                        </p>
                                    </div>
                                </td>
                                <td className="py-4 text-right pr-2">
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => copyToClipboard(link)}
                                            className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                                            title="Copiar Link"
                                        >
                                            <Copy size={16} />
                                        </button>
                                        <a 
                                            href={link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                                            title="Abrir"
                                        >
                                            <ExternalLink size={16} />
                                        </a>
                                    </div>
                                </td>
                            </tr>
                          );
                      })}
                  </tbody>
              </table>
              {generatedLinksHistory.length === 0 && !loading && (
                  <p className="text-center text-gray-500 py-8 text-sm bg-gray-50 dark:bg-gray-900/50 rounded-lg mt-4">
                      Nenhum link gerado ainda. Gere um link acima para vê-lo aqui.
                  </p>
              )}
          </div>
      </div>
    </div>
  );
};

export default Links;