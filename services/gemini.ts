
import { GoogleGenAI, Type } from "@google/genai";
import { NewsArticle } from "../types";

// Función para limpiar el JSON que a veces Gemini rodea con ```json ... ```
const cleanJsonResponse = (text: string) => {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'dummy-key') {
    throw new Error("FALTA API KEY: Configura API_KEY en las variables de entorno de Vercel.");
  }
  return new GoogleGenAI({ apiKey });
};

const NEWS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'Un titular llamativo, exagerado y gracioso.' },
    subtitle: { type: Type.STRING, description: 'Un subtítulo que aporte más contexto cómico.' },
    content: { type: Type.STRING, description: 'Cuerpo de la noticia, al menos dos párrafos con mucho humor.' },
    category: { type: Type.STRING, description: 'Una categoría inventada para la noticia.' },
    author: { type: Type.STRING, description: 'Un nombre de periodista ficticio y divertido.' },
    imagePrompt: { type: Type.STRING, description: 'Un prompt visual para generar una imagen absurda relacionada.' }
  },
  required: ['title', 'subtitle', 'content', 'category', 'author', 'imagePrompt']
};

export const generateNewsFromVoice = async (transcript: string): Promise<NewsArticle> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Convierte este comentario o transcripción de voz en una noticia satírica para el diario "FatoNews". El comentario es: "${transcript}". La noticia debe ser desternillante, usar juegos de palabras corporativos y sonar como un periódico serio pero con contenido absurdo.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: NEWS_SCHEMA,
      systemInstruction: "Eres el editor jefe de FatoNews, un periódico satírico famoso por sus noticias absurdas sobre el mundo laboral y de oficina. Tu tono es sarcástico, ingenioso y extremadamente divertido. Habla siempre en castellano de España con jerga de oficina."
    }
  });

  const rawText = response.text || '{}';
  const data = JSON.parse(cleanJsonResponse(rawText));
  
  return {
    ...data,
    id: Math.random().toString(36).substr(2, 9),
    date: new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  };
};

export const generateBreakingNews = async (): Promise<NewsArticle> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "Genera una noticia de 'Última Hora' completamente aleatoria sobre un drama común de oficina (ej. se acabó el café, alguien robó un tupper, el Excel ha cobrado vida).",
    config: {
      responseMimeType: "application/json",
      responseSchema: NEWS_SCHEMA,
      systemInstruction: "Editor jefe de FatoNews. Genera contenido satírico original sobre el mundo laboral."
    }
  });

  const rawText = response.text || '{}';
  const data = JSON.parse(cleanJsonResponse(rawText));
  
  return {
    ...data,
    id: 'breaking-news',
    date: 'EDICIÓN ESPECIAL'
  };
};

export const generateImage = async (prompt: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A humorous, cinematic and funny illustration for a news article with high detail: ${prompt}` }]
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return `https://picsum.photos/seed/${Math.random()}/800/600`;
  } catch (error) {
    console.error("Error generating image:", error);
    return `https://picsum.photos/seed/${Math.random()}/800/600`;
  }
};
