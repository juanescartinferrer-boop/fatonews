import React, { useState, useEffect, useRef } from 'react';
import { Mic, Radio, Menu, Search, Coffee, Keyboard, Send, Zap, AlertTriangle } from 'lucide-react';
import { NewsArticle } from './types';
import { generateBreakingNews, generateNewsFromVoice, generateImage } from './services/gemini';
import ArticleCard from './components/ArticleCard';

const App: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [keyboardInput, setKeyboardInput] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef(''); // Ref para evitar cierres obsoletos

  useEffect(() => {
    const initNews = async () => {
      setIsGenerating(true);
      try {
        const breaking = await generateBreakingNews();
        const breakingImg = await generateImage(breaking.imagePrompt);
        setArticles([{ ...breaking, imageUrl: breakingImg }]);
      } catch (e) {
        console.error("Error inicializando:", e);
      } finally {
        setIsGenerating(false);
      }
    };
    initNews();
  }, []);

  const handleVoiceInput = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta voz. ¡Usa tus dedos de reportero!");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
      setTranscript('');
      transcriptRef.current = '';
    };

    recognition.onresult = (event: any) => {
      const current = event.results[0][0].transcript;
      setTranscript(current);
      transcriptRef.current = current; // Actualizamos la ref en tiempo real
    };

    recognition.onend = async () => {
      setIsRecording(false);
      const finalText = transcriptRef.current.trim();
      if (finalText) {
        console.log("Enviando a redacción:", finalText);
        processNewArticle(finalText);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Error de reconocimiento:", event.error);
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleKeyboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyboardInput.trim() && !isGenerating) {
      processNewArticle(keyboardInput);
      setKeyboardInput('');
    }
  };

  const processNewArticle = async (text: string) => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const article = await generateNewsFromVoice(text);
      const img = await generateImage(article.imagePrompt);
      setArticles(prev => [{ ...article, imageUrl: img }, ...prev]);
    } catch (e) {
      console.error("Error al generar noticia:", e);
      alert("Los becarios están en huelga (error de API). Revisa tu API_KEY en Vercel.");
    } finally {
      setIsGenerating(false);
      setTranscript('');
      transcriptRef.current = '';
    }
  };

  const tickerItems = [
    "EL CAFÉ DE LA SEGUNDA PLANTA ES SOSPECHOSAMENTE PARECIDO A CHAPAPOTE",
    "REUNIÓN DE 3 HORAS CONFIRMADA PARA DECIDIR EL COLOR DE LOS POST-ITS",
    "ALGUIEN HA PUESTO PESCADO EN EL MICROONDAS: EVACUACIÓN INMINENTE",
    "EL EXCEL DEL JEFE HA DESARROLLADO CONSCIENCIA Y PIDE VACACIONES",
    "MISTERIO: EL GRAPADOR DE PEPE HA DESAPARECIDO POR TERCERA VEZ ESTA SEMANA",
    "NUEVA POLÍTICA: SE PROHÍBE RESPIRAR FUERTE LOS LUNES POR LA MAÑANA"
  ];

  return (
    <div className="min-h-screen paper-texture pb-20">
      <div className="bg-red-600 text-white py-2 overflow-hidden border-b-2 border-black">
        <div className="animate-ticker">
          {tickerItems.concat(tickerItems).map((item, i) => (
            <span key={i} className="mx-8 font-black text-sm tracking-tighter italic">
              <Zap className="inline mr-2" size={14} /> {item}
            </span>
          ))}
        </div>
      </div>

      <header className="border-b-4 border-black px-4 py-8 mb-8 bg-white/90 backdrop-blur sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="newspaper-font text-7xl md:text-9xl font-black tracking-tighter leading-none select-none">
            FATONEWS
          </h1>
          <p className="newspaper-font text-xl md:text-2xl font-bold italic text-gray-500 uppercase tracking-widest mt-4">
            "Donde la verdad es una sugerencia"
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4">
        <section className="mb-16 bg-black text-white p-8 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <div className="mb-8">
            <h2 className="text-4xl font-black mb-2 flex items-center gap-3 italic">
              <Mic className={`${isRecording ? 'text-red-500 animate-pulse' : 'text-white'}`} /> 
              SALA DE REDACCIÓN
            </h2>
            <p className="text-gray-400 font-bold">Cuéntanos el último cotilleo o drama del equipo.</p>
          </div>
          
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-stretch gap-4">
              <button 
                onClick={handleVoiceInput}
                disabled={isGenerating}
                className={`flex items-center justify-center gap-4 px-10 py-5 rounded-sm font-black text-2xl transition-all shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)] ${
                  isRecording ? 'bg-red-600 animate-pulse' : 'bg-white text-black hover:bg-red-50'
                } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isRecording ? <div className="w-4 h-4 bg-white rounded-full animate-ping"></div> : <Mic size={28} />}
                {isRecording ? '¡TE ESCUCHO!' : isGenerating ? 'REDACTANDO...' : 'DICTAR NOTICIA'}
              </button>

              <form onSubmit={handleKeyboardSubmit} className="flex-1 flex gap-4">
                <input 
                  type="text"
                  value={keyboardInput}
                  onChange={(e) => setKeyboardInput(e.target.value)}
                  placeholder="Escribe el drama aquí y pulsa enter..."
                  className="flex-1 bg-white/10 border-2 border-white/20 px-6 text-xl focus:outline-none focus:border-red-500 font-bold"
                  disabled={isGenerating}
                />
                <button 
                  type="submit"
                  disabled={!keyboardInput.trim() || isGenerating}
                  className="bg-red-600 hover:bg-red-700 text-white font-black px-8 py-4 transition-all"
                >
                  <Send size={24} />
                </button>
              </form>
            </div>
            
            {transcript && (
              <div className="bg-white/5 border-l-4 border-red-500 p-6 italic text-2xl text-gray-200 font-serif">
                "{transcript}..."
              </div>
            )}
          </div>
        </section>

        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-16 bg-white border-2 border-black border-dashed rounded-lg mb-12">
            <Coffee size={64} className="mb-6 text-red-600 animate-bounce" />
            <p className="text-3xl font-black newspaper-font italic text-gray-800 text-center">
              Escribiendo la primicia...
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-20">
          {articles.map((article, index) => (
            <ArticleCard 
              key={article.id} 
              article={article} 
              isMain={index === 0}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;
