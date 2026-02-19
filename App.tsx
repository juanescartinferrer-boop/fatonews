
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Radio, Menu, Search, Coffee, Keyboard, Send, Zap, AlertCircle } from 'lucide-react';
import { NewsArticle } from './types';
import { generateBreakingNews, generateNewsFromVoice, generateImage } from './services/gemini';
import ArticleCard from './components/ArticleCard';

const App: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [keyboardInput, setKeyboardInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    const initNews = async () => {
      setIsGenerating(true);
      try {
        const breaking = await generateBreakingNews();
        const breakingImg = await generateImage(breaking.imagePrompt);
        setArticles([{ ...breaking, imageUrl: breakingImg }]);
      } catch (e: any) {
        console.error("Error inicializando:", e);
        setErrorMessage(e.message || "Error al conectar con la redacción central.");
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
      alert("Tu navegador no soporta voz. ¡Usa el teclado!");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
      setTranscript('');
      transcriptRef.current = '';
      setErrorMessage(null);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          transcriptRef.current += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(transcriptRef.current + interimTranscript);
    };

    recognition.onend = () => {
      setIsRecording(false);
      const finalText = transcriptRef.current.trim();
      if (finalText) {
        processNewArticle(finalText);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Error de voz:", event.error);
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
    setErrorMessage(null);
    try {
      const article = await generateNewsFromVoice(text);
      const img = await generateImage(article.imagePrompt);
      setArticles(prev => [{ ...article, imageUrl: img }, ...prev]);
    } catch (e: any) {
      console.error("Error al generar noticia:", e);
      setErrorMessage(e.message || "Error al redactar. Los becarios están en huelga.");
    } finally {
      setIsGenerating(false);
      setTranscript('');
      transcriptRef.current = '';
    }
  };

  const tickerItems = [
    "REUNIÓN CONFIRMADA PARA DECIDIR SI EL AGUA DEL GRIFO ES DEMASIADO HÚMEDA",
    "EL EXCEL DE FINANZAS HA DESARROLLADO SENTIMIENTOS Y ESTÁ LLORANDO",
    "SE BUSCA: ALGUIEN QUE SEPA USAR LA FOTOCOPIADORA SIN INVOCAR A UN DEMONIO",
    "NUEVA NORMA: PROHIBIDO DECIR 'PARA AYER' BAJO PENA DE TRABAJAR EL DOMINGO",
    "CONMOCIÓN: PEPE HA TRAÍDO CROQUETAS Y LA PRODUCTIVIDAD HA CAÍDO UN 90%"
  ];

  return (
    <div className="min-h-screen paper-texture pb-20">
      {/* Ticker de noticias */}
      <div className="bg-red-700 text-white py-2 overflow-hidden border-b-2 border-black">
        <div className="animate-ticker">
          {tickerItems.concat(tickerItems).map((item, i) => (
            <span key={i} className="mx-8 font-black text-sm uppercase italic">
              <Zap className="inline mr-2" size={14} /> {item}
            </span>
          ))}
        </div>
      </div>

      {/* Header Newspaper Style */}
      <header className="border-b-8 border-double border-black px-4 py-10 mb-8 bg-white/90">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="w-full flex justify-between items-end border-b border-black pb-2 mb-4 text-xs font-bold uppercase tracking-widest">
            <span>VOL. LXIX ... No. 1337</span>
            <span className="text-3xl hidden md:block">EL DIARIO DE LA OFICINA</span>
            <span>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}</span>
          </div>
          <h1 className="newspaper-font text-8xl md:text-[10rem] font-black tracking-tighter leading-none select-none text-center">
            FATONEWS
          </h1>
          <div className="w-full border-t border-black mt-2 pt-2 text-center">
            <p className="newspaper-font text-2xl font-bold italic text-gray-800">
              "La única fuente de información menos fiable que un cuñado en Navidad"
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4">
        {/* Sección de Redacción */}
        <section className="mb-16 bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-4xl font-black mb-1 flex items-center gap-3">
                <Radio className={isRecording ? 'text-red-600 animate-pulse' : 'text-black'} />
                CENTRO DE BULOS
              </h2>
              <p className="text-gray-500 font-bold uppercase text-sm">Dicta o escribe el drama del día</p>
            </div>
            {errorMessage && (
              <div className="bg-red-50 border-2 border-red-600 p-3 flex items-center gap-2 text-red-600 font-bold animate-bounce">
                <AlertCircle size={20} />
                {errorMessage}
              </div>
            )}
          </div>
          
          <div className="grid gap-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <button 
                onClick={handleVoiceInput}
                disabled={isGenerating}
                className={`flex-1 flex items-center justify-center gap-4 px-8 py-6 border-4 border-black font-black text-2xl transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${
                  isRecording ? 'bg-red-600 text-white' : 'bg-yellow-400 text-black hover:bg-yellow-300'
                } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Mic size={32} />
                {isRecording ? '¡HABLE AHORA!' : isGenerating ? 'REDACTANDO...' : 'CONTAR COTILLEO'}
              </button>

              <form onSubmit={handleKeyboardSubmit} className="flex-[2] flex gap-4">
                <input 
                  type="text"
                  value={keyboardInput}
                  onChange={(e) => setKeyboardInput(e.target.value)}
                  placeholder="O escribe el rumor aquí..."
                  className="flex-1 border-4 border-black px-6 text-xl focus:outline-none focus:bg-yellow-50 font-bold"
                  disabled={isGenerating}
                />
                <button 
                  type="submit"
                  disabled={!keyboardInput.trim() || isGenerating}
                  className="bg-black text-white font-black px-10 py-4 hover:bg-gray-800 transition-all border-4 border-black"
                >
                  <Send size={24} />
                </button>
              </form>
            </div>
            
            {transcript && (
              <div className="bg-gray-100 border-4 border-black border-dashed p-6 italic text-2xl text-gray-800 font-serif">
                "{transcript}..."
              </div>
            )}
          </div>
        </section>

        {/* Estado de carga */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-20 bg-white border-4 border-black border-dashed mb-12">
            <div className="relative">
              <Coffee size={80} className="text-red-600 animate-bounce" />
              <Zap className="absolute -top-4 -right-4 text-yellow-400 animate-pulse" size={40} />
            </div>
            <p className="text-4xl font-black newspaper-font italic mt-8 text-center animate-pulse">
              RECOPILANDO PRUEBAS FALSAS...
            </p>
          </div>
        )}

        {/* Grid de Noticias */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
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
