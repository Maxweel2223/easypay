import React, { useState, useEffect } from 'react';
import { Copy, Share2, QrCode, ExternalLink, Check, Loader2, AlertCircle } from 'lucide-react';
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
            .eq('status', 'approved'); // Only show approved products for links

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

    // Updated to use Hash router format (/#/checkout/...)
    // This ensures it works on Vercel without complex server redirects failing
    setGeneratedLink(`https://fastpayzinmoz.vercel.app/#/checkout/${product.id}`);
  };

  const copyToClipboard = () => {
    if(generatedLink) {
        navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
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
                                onClick={copyToClipboard}
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
                 <div className="space-y-4">
                     <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-inner">
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(generatedLink)}`} 
                            alt="QR Code" 
                            className="w-40 h-40"
                        />
                     </div>
                     <p className="text-sm text-gray-500 dark:text-gray-400">Envie esta imagem para seu cliente</p>
                     <button className="flex items-center justify-center w-full py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                        <Share2 size={16} className="mr-2" />
                        Compartilhar
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
    </div>
  );
};

export default Links;