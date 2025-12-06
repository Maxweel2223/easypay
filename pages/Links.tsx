import React, { useState, useEffect } from 'react';
import { Copy, Share2, QrCode, ExternalLink, Check, Loader2, AlertCircle, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { supabase } from '../services/supabaseClient';

const Links: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
        setLoading(true);
        setError(null);
        const { data: { user } } = await supabase.auth.getUser();
        if(!user) return;

        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'approved'); 

        if (error) throw error;
        if (data) setProducts(data);
    } catch (err: any) {
        console.error("Error loading products for links:", err);
        if (err?.code === '42P01' || err?.code === 'PGRST205') {
             setError("Tabela 'products' não encontrada. Verifique a aba 'Produtos' para instruções.");
        } else {
             setError("Não foi possível carregar seus produtos.");
        }
    } finally {
        setLoading(false);
    }
  };

  const handleGenerate = () => {
    if(!selectedProduct) return;
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    // Use Hash router format (/#/checkout/...)
    setGeneratedLink(`https://fastpayzinmoz.vercel.app/#/checkout/${product.id}`);
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
                         <div className="flex items-center text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                             <AlertCircle size={16} className="mr-2" />
                             {error}
                         </div>
                    ) : loading ? (
                        <div className="flex items-center text-sm text-gray-500"><Loader2 className="animate-spin mr-2" size={16}/> Carregando produtos...</div>
                    ) : (
                        <select 
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            value={selectedProduct}
                            onChange={(e) => {
                                setSelectedProduct(e.target.value);
                                setGeneratedLink(null);
                            }}
                        >
                            <option value="">Selecione...</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} - {p.price.toFixed(2)} MZN</option>
                            ))}
                        </select>
                    )}
                    {products.length === 0 && !loading && !error && (
                        <p className="text-xs text-amber-600 mt-2">Você não possui produtos aprovados. Vá em "Produtos" e cadastre um novo item.</p>
                    )}
                </div>

                <button 
                    onClick={handleGenerate}
                    disabled={!selectedProduct}
                    className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    Gerar Link de Pagamento
                </button>

                {generatedLink && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-4 animate-fade-in">
                        <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300 mb-2">Link gerado com sucesso!</p>
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
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Seus Links Ativos</h2>
          
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                          <th className="pb-3 pl-2 min-w-[200px]">Produto</th>
                          <th className="pb-3 min-w-[100px]">Preço</th>
                          <th className="pb-3 min-w-[200px]">Link Direto</th>
                          <th className="pb-3 text-right pr-2 min-w-[100px]">Ação</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {products.map(product => {
                          const link = getLinkForProduct(product.id);
                          return (
                            <tr key={product.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="py-4 pl-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                                            {product.imageUrl ? (
                                                <img src={product.imageUrl} alt="" className="w-full h-full object-cover"/>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400"><ShoppingBag size={16}/></div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white text-sm">{product.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">ID: {product.id.slice(0,8)}...</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 text-sm text-gray-600 dark:text-gray-300">{product.price.toFixed(2)} MZN</td>
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
              {products.length === 0 && !loading && (
                  <p className="text-center text-gray-500 py-8 text-sm">Nenhum produto ativo encontrado.</p>
              )}
          </div>
      </div>
    </div>
  );
};

export default Links;