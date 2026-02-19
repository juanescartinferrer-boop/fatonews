import { GoogleGenAI, Type } from "@google/genai";
import { NewsArticle } from "../types";

const cleanJsonResponse = (text: string) => {
  // Elimina bloques de código markdown si existen
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'dummy-key') {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

const NEWS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'Titular satírico.' },
    subtitle: { type: Type.STRING, description: 'Subtítulo gracioso.' },
    content: { type: Type.STRING, description: 'Cuerpo de la noticia (2-3 párrafos).' },
    category: { type: Type.STRING, description: 'Categoría absurda.' },
    author: { type: Type.STRING, description: 'Nombre de periodista ficticio.' },
    imagePrompt: { type: Type.STRING, description: 'Prompt para imagen descriptiva.' }
  },
  required: ['title', 'subtitle', 'content', 'category', 'author', 'imagePrompt']
};

export const generateNewsFromVoice = async (transcript: string): Promise<NewsArticle> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Genera una noticia satírica basada en este chisme de oficina: "${transcript}". Debe ser hilarante y usar terminología corporativa absurda.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: NEWS_SCHEMA,
      systemInstruction: "Eres el editor jefe de FatoNews, un diario de humor corporativo. Tu misión es convertir quejas de oficina en noticias de portada épicas."
    }
  });

  const data = JSON.parse(cleanJsonResponse(response.text));
  return {
    ...data,
    id: Math.random().toString(36).substr(2, 9),
    date: new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
  };
};

export const generateBreakingNews = async (): Promise<NewsArticle> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "Genera una noticia de última hora sobre un desastre común en la oficina (ej. se acabó la leche, el ascensor va lento).",
    config: {
      responseMimeType: "application/json",
      responseSchema: NEWS_SCHEMA
    }
  });

  const data = JSON.parse(cleanJsonResponse(response.text));
  return {
    ...data,
    id: 'breaking',
    date: 'EDICIÓN EXTRAORDINARIA'
  };
};

export const generateImage = async (prompt: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Editorial newspaper illustration, funny, high contrast: ${prompt}` }] }
    });
    const imgPart = response.candidates[0].content.parts.find(p => p.inlineData);
    return imgPart ? `data:image/png;base64,${imgPart.inlineData.data}` : `https://picsum.photos/seed/${Math.random()}/800/600`;
  } catch {
    return `https://picsum.photos/seed/${Math.random()}/800/600`;
  }
};
