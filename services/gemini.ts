import { GoogleGenAI, Type } from "@google/genai";
import { ScannedReceiptData } from "../types";

// Standardize the response schema
const RECEIPT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    total: { type: Type.NUMBER },
    merchant: { type: Type.STRING },
    category: { type: Type.STRING, enum: ['food', 'transport', 'rent', 'groceries', 'shopping'] },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          price: { type: Type.NUMBER }
        }
      }
    }
  }
};

/**
 * Analyzes a base64 encoded image using the Gemini 2.5 Flash model.
 * 
 * SECURITY NOTE: 
 * This function utilizes `process.env.API_KEY` which is injected at runtime in this client-side environment.
 * In a production web application, API keys should typically be protected by a backend proxy 
 * to prevent exposure to end-users.
 */
export const analyzeReceipt = async (base64Image: string): Promise<ScannedReceiptData> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: "Analyze this receipt image. Extract the Merchant Name, the Total Amount, the Category (food, transport, rent, groceries, shopping), and a list of all purchased Items with their prices."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: RECEIPT_SCHEMA
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    return {
      amount: result.total,
      description: result.merchant,
      category: result.category,
      items: result.items
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze receipt.");
  }
};
