
// Credenciais fornecidas
const CLIENT_ID = "a078a4de-0cf0-465d-844d-4e7830bbb13c";
const CLIENT_SECRET = "qPeEczfNYWwxVgs0SGXnVhh9uJgAdZmkxhSDiVOb";
const WALLET_ID = "431550"; // Carteira M-Pesa

const BASE_URL = "https://e2payments.explicador.co.mz";

let cachedToken: string | null = null;
let tokenExpiration: number = 0;

/**
 * Obtém o token de acesso (Bearer Token)
 * Verifica se há um token válido em cache antes de solicitar um novo.
 */
const getAccessToken = async (): Promise<string> => {
  const now = Date.now();

  if (cachedToken && now < tokenExpiration) {
    return cachedToken;
  }

  try {
    const response = await fetch(`${BASE_URL}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Falha na autenticação (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    cachedToken = data.access_token;
    // Define expiração para um pouco antes do tempo real (segurança)
    tokenExpiration = now + (data.expires_in * 1000) - 60000; 

    return cachedToken as string;
  } catch (error) {
    console.error("Erro ao obter token e2Payments:", error);
    throw error;
  }
};

/**
 * Realiza o pagamento C2B via M-Pesa
 * @param phoneNumber Número do cliente (ex: 841234567)
 * @param amount Valor da transação
 * @param reference Referência única para o pagamento
 */
export const initiateMpesaPayment = async (
  phoneNumber: string,
  amount: number,
  reference: string
) => {
  try {
    const token = await getAccessToken();

    // Garante que o telefone tenha apenas números e remova prefixo 258 se existir, mantendo 9 dígitos
    let cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.startsWith('258') && cleanPhone.length > 9) {
        cleanPhone = cleanPhone.substring(3);
    }

    // Sanitiza a referência (apenas alfanuméricos) para evitar rejeição da API
    const cleanRef = reference.replace(/[^a-zA-Z0-9]/g, '');

    const payload = {
      client_id: CLIENT_ID,
      amount: amount.toString(), // API espera string
      phone: cleanPhone,
      reference: cleanRef,
    };

    const response = await fetch(
      `${BASE_URL}/v1/c2b/mpesa-payment/${WALLET_ID}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    // Lê a resposta como texto primeiro para evitar erros de parse se não for JSON
    const responseText = await response.text();
    let result;
    
    try {
        result = JSON.parse(responseText);
    } catch (e) {
        // Se falhar o parse, usa o texto puro como mensagem
        result = { message: responseText };
    }

    if (!response.ok) {
      console.error("Erro detalhado da API:", result);
      // Tenta extrair a mensagem de erro de vários formatos possíveis
      const errorMsg = result.message || result.error || result.description || JSON.stringify(result);
      throw new Error(errorMsg);
    }

    return result;
  } catch (error: any) {
    console.error("Erro no pagamento M-Pesa:", error);
    // Repassa o erro original para o frontend mostrar no alert
    throw new Error(error.message || "Falha na comunicação com o gateway de pagamento.");
  }
};
