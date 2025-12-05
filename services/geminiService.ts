import { GoogleGenAI } from "@google/genai";

// Helper to get the AI instance safely
const getAIClient = (): GoogleGenAI | null => {
  const apiKey = "AIzaSyAUhh6UslR-eiIoo2iqHIjbN1OesrXWA8o";
  if (!apiKey) {
    console.warn("API Key not found. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateProductDescription = async (productName: string, category: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "Descrição gerada automaticamente não disponível (Chave de API ausente).";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Escreva uma descrição de produto curta, atraente e orientada para vendas (máximo de 30 palavras) para um produto chamado "${productName}" na categoria "${category}". Em Português de Moçambique.`,
    });
    return response.text || "Não foi possível gerar a descrição.";
  } catch (error) {
    console.error("Erro ao gerar descrição:", error);
    return "Erro ao comunicar com o assistente de IA.";
  }
};

export const generateSupportResponse = async (userQuery: string, context: string = ''): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "Desculpe, nosso assistente inteligente está offline no momento.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Você é um assistente de suporte da plataforma PayEasy (Moçambique). 
      Contexto anterior da conversa: ${context}
      
      Responda de forma curta, educada e prestativa à seguinte pergunta do usuário: "${userQuery}".`,
    });
    return response.text || "Não entendi sua pergunta.";
  } catch (error) {
    console.error("Erro no chat:", error);
    return "Erro temporário no serviço de chat.";
  }
};

export const analyzeContentSafety = async (name: string, category: string, base64Image?: string): Promise<{ safe: boolean; reason?: string }> => {
  const ai = getAIClient();
  // If no AI, default to safe to not block users in dev mode without keys
  if (!ai) return { safe: true };

  try {
    const parts: any[] = [];
    
    // Add image if exists
    if (base64Image) {
        // Strip prefix if present (e.g. "data:image/png;base64,")
        const cleanBase64 = base64Image.split(',')[1] || base64Image;
        parts.push({
            inlineData: {
                data: cleanBase64,
                mimeType: 'image/jpeg' // Assuming jpeg/png for simplicity
            }
        });
    }

    const prompt = `Analise se o seguinte produto é apropriado para uma plataforma de e-commerce geral (sem itens ilegais, armas, drogas, conteúdo adulto explícito).
    Nome: "${name}"
    Categoria: "${category}"
    
    Responda APENAS com um JSON neste formato:
    { "safe": boolean, "reason": "motivo se não for seguro, ou null se for seguro" }`;

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      safe: result.safe ?? true,
      reason: result.reason
    };
  } catch (error) {
    console.error("Safety check failed:", error);
    // Fail safe -> allow but log, or fail block? Let's allow but warn.
    return { safe: true }; 
  }
};
