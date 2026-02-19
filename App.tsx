import React, { useState, useEffect, useRef } from 'react';
import { Mic, Radio, Send, Zap, AlertCircle, Coffee, RefreshCcw, Quote } from 'lucide-react';
import { NewsArticle } from './types';
import { generateBreakingNews, generateNewsFromVoice, generateImage } from './services/gemini';
import ArticleCard from './components/ArticleCard';

const App: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [keyboardInput, setKeyboardInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    loadBreakingNews();
  }, []);

  const loadBreakingNews = async () => {
    setIsGenerating(true);
    try {
      const art = await generateBreakingNews();
      const img = await generateImage(art.imagePrompt);
      setArticles([{ ...art, imageUrl: img }]);
    } catch (e: any) {
      if (e.message === 'API_KEY_MISSING') {
        setError("Falta la API_KEY. Configúrala en las variables de entorno de Vercel.");
      } else {
        setError("La redacción está saturada. Inténtalo de nuevo.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleVoice = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRec = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRec) {
      alert("Navegador no compatible con voz.");
      return;
    }

    const recognition = new SpeechRec();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
      setTranscript('');
      transcriptRef.current = '';
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let current = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);
      transcriptRef.current = current;
    };

    recognition.onend = () => {
      setIsRecording(false);
      const text = transcriptRef.current.trim();
      if (text.length > 3) {
        handleGenerate(text);
      }
    };

    recognition.onerror = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleGenerate = async (text: string) => {
    if (isGenerating) return;
    setIsGenerating(true);
    setError(null);
    try {
      const article = await generateNewsFromVoice(text);
      const img = await generateImage(article.imagePrompt);
      setArticles(prev => [{ ...article, imageUrl: img }, ...prev]);
      setTranscript('');
      setKeyboardInput('');
    } catch (e) {
      setError("Error al redactar la noticia. ¡Los becarios se han escapado!");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen paper-texture pb-20 selection:bg-yellow-200">
      {/* Ticker Superior */}
      <div className="bg-black text-white py-2 overflow-hidden border-b-4 border-black">
        <div className="animate-ticker">
          {[
            "EL CAFÉ DE LA SEGUNDA PLANTA ES SOSPECHOSO",
            "NUEVA REUNIÓN PARA DECIDIR EL COLOR DE LAS GRAPAS",
            "ALGUIEN HA ROBADO EL TUPPER DE PEPE",
            "EL EXCEL HA COBRADO VIDA Y PIDE VACACIONES",
            "MISTERIO: ¿QUIÉN DEJÓ EL MICROONDAS SUCIO?"
          ].map((text, i) => (
            <span key={i} className="mx-10 font-black text-xs uppercase tracking-widest italic">
              <Zap className="inline mr-2 text-yellow-400" size={14} /> {text}
            </span>
          ))}
        </div>
      </div>

      <header className="max-w-7xl mx-auto px-4 pt-12 pb-8 text-center">
        <div className="border-y-4 border-double border-black py-6">
          <h1 className="newspaper-font text-8xl md:text-[12rem] font-black leading-none tracking-tighter uppercase mb-2">
            FATONEWS
          </h1>
          <p className="newspaper-font text-xl md:text-3xl font-bold italic text-gray-800">
            "La única verdad es que todo es mentira"
          </p>
        </div>
        <div className="flex justify-between border-b-2 border-black py-2 text-xs font-bold uppercase tracking-widest">
          <span>Edición No. 1 - Oficina Central</span>
          <span className="hidden md:block">PRECIO: UN CAFÉ CON LECHE</span>
          <span>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-12">
        {/* Panel de Control */}
        <section className="bg-white neo-border p-8 mb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Quote size={120} />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-4xl font-black mb-6 uppercase tracking-tighter flex items-center gap-3">
              <Radio className={isRecording ? 'text-red-600 animate-pulse' : ''} />
              Centro de Redacción
            </h2>
            
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 flex flex-col gap-4">
                <button 
                  onClick={toggleVoice}
                  disabled={isGenerating}
                  className={`py-6 px-10 neo-border-sm text-2xl font-black transition-all flex items-center justify-center gap-4 ${
                    isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-yellow-400 hover:bg-yellow-300'
                  } ${isGenerating ? 'opacity-50' : ''}`}
                >
                  <Mic size={32} />
                  {isRecording ? '¡TE ESCUCHAMOS!' : 'CONTAR CHISME'}
                </button>
                <p className="text-xs font-bold text-gray-500 uppercase italic">
                  * Pulsa para hablar y vuelve a pulsar para redactar la noticia.
                </p>
              </div>

              <div className="flex-[2] flex flex-col gap-4">
                <div className="flex gap-4">
                  <input 
                    type="text"
                    value={keyboardInput}
                    onChange={(e) => setKeyboardInput(e.target.value)}
                    placeholder="O escribe el drama aquí..."
                    className="flex-1 neo-border-sm px-6 text-xl font-bold focus:outline-none focus:bg-yellow-50"
                  />
                  <button 
                    onClick={() => handleGenerate(keyboardInput)}
                    disabled={!keyboardInput.trim() || isGenerating}
                    className="bg-black text-white px-8 py-4 neo-border-sm font-black hover:bg-gray-800 disabled:opacity-50"
                  >
                    <Send size={24} />
                  </button>
                </div>
              </div>
            </div>

            {transcript && (
              <div className="mt-8 p-6 bg-gray-100 border-l-8 border-black italic text-2xl font-serif">
                "{transcript}..."
              </div>
            )}

            {error && (
              <div className="mt-6 p-4 bg-red-100 border-2 border-red-600 flex items-center gap-3 text-red-600 font-bold">
                <AlertCircle /> {error}
              </div>
            )}
          </div>
        </section>

        {/* Estado de Carga */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-20 bg-white border-4 border-black border-dashed mb-16">
            <RefreshCcw size={64} className="text-red-600 animate-spin mb-6" />
            <h3 className="newspaper-font text-4xl font-black italic animate-pulse">
              REDACTANDO LA PRIMICIA...
            </h3>
          </div>
        )}

        {/* Artículos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
          {articles.map((art, i) => (
            <ArticleCard key={art.id} article={art} isMain={i === 0} />
          ))}
        </div>
      </main>

      <footer className="mt-20 border-t-4 border-black pt-10 text-center text-xs font-black uppercase tracking-[0.2em] text-gray-500">
        <p>© 1924 - 2024 FATONEWS MEDIA GROUP - LA VERDAD ES RELATIVA</p>
      </footer>
    </div>
  );
};

export default App;
