import { GoogleGenAI, Type } from "@google/genai";
import { NewsArticle } from "../types";

const cleanJsonResponse = (text: string) => {
  // Maneja casos donde la IA devuelve bloques de código o texto antes del JSON
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
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
    title: { type: Type.STRING, description: 'Un titular corto y muy impactante.' },
    subtitle: { type: Type.STRING, description: 'Subtítulo que resuma la locura.' },
    content: { type: Type.STRING, description: 'Cuerpo de la noticia con humor ácido.' },
    category: { type: Type.STRING, description: 'Categoría divertida.' },
    author: { type: Type.STRING, description: 'Periodista ficticio.' },
    imagePrompt: { type: Type.STRING, description: 'Prompt visual para la imagen.' }
  },
  required: ['title', 'subtitle', 'content', 'category', 'author', 'imagePrompt']
};

export const generateNewsFromVoice = async (transcript: string): Promise<NewsArticle> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Convierte este chisme en una noticia de portada satírica para el diario corporativo FatoNews: "${transcript}". Usa juegos de palabras, exagera los hechos y mantén un tono periodístico serio pero absurdo.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: NEWS_SCHEMA,
      systemInstruction: "Eres el Editor Jefe de FatoNews, un diario de sátira laboral. Escribe siempre en castellano de España con jerga de oficina moderna."
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
    contents: "Genera una noticia de última hora sobre un desastre gracioso en la oficina (cafetería, ascensor, reuniones interminables).",
    config: {
      responseMimeType: "application/json",
      responseSchema: NEWS_SCHEMA
    }
  });

  const data = JSON.parse(cleanJsonResponse(response.text));
  return {
    ...data,
    id: 'breaking-' + Date.now(),
    date: 'EDICIÓN ESPECIAL'
  };
};

export const generateImage = async (prompt: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { 
        parts: [{ text: `A professional, funny, cinematic editorial illustration for a satire newspaper: ${prompt}` }] 
      }
    });
    const imgPart = response.candidates[0].content.parts.find(p => p.inlineData);
    return imgPart ? `data:image/png;base64,${imgPart.inlineData.data}` : `https://picsum.photos/seed/${Math.random()}/800/600`;
  } catch (err) {
    console.error("Error imagen:", err);
    return `https://picsum.photos/seed/${Math.random()}/800/600`;
  }
};
