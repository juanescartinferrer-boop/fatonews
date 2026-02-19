import React, { useState, useEffect, useRef } from 'react';
import { Mic, Radio, Send, Zap, AlertCircle, Coffee, RefreshCcw, Quote, Trash2 } from 'lucide-react';
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
    loadInitialContent();
  }, []);

  const loadInitialContent = async () => {
    setIsGenerating(true);
    try {
      const art = await generateBreakingNews();
      const img = await generateImage(art.imagePrompt);
      setArticles([{ ...art, imageUrl: img }]);
    } catch (e: any) {
      console.error("Error inicial:", e);
      setError("La redacción central no responde. ¿Has pagado la cuota de la API?");
    } finally {
      setIsGenerating(false);
    }
  };

  const startVoice = () => {
    const SpeechRec = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRec) {
      alert("Tu navegador es del siglo pasado y no soporta voz.");
      return;
    }

    const recognition = new SpeechRec();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
      setError(null);
      transcriptRef.current = '';
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
    };

    recognition.onerror = (e: any) => {
      console.error("Error voz:", e.error);
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceAndGenerate = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    const finalSelection = transcriptRef.current.trim();
    if (finalSelection.length > 3) {
      handleGenerate(finalSelection);
    }
  };

  const handleGenerate = async (text: string) => {
    if (isGenerating || !text.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const article = await generateNewsFromVoice(text);
      const img = await generateImage(article.imagePrompt);
      setArticles(prev => [{ ...article, imageUrl: img }, ...prev]);
      setTranscript('');
      transcriptRef.current = '';
      setKeyboardInput('');
    } catch (e: any) {
      console.error("Error redactando:", e);
      setError("¡Escándalo! El becario ha perdido la noticia. Inténtalo de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  };

  const resetTranscript = () => {
    setTranscript('');
    transcriptRef.current = '';
    if (isRecording) recognitionRef.current?.stop();
  };

  return (
    <div className="min-h-screen paper-texture pb-20 selection:bg-yellow-200">
      {/* Ticker de Noticias */}
      <div className="bg-red-700 text-white py-2 overflow-hidden border-b-4 border-black">
        <div className="animate-ticker flex items-center">
          {[
            "EL JEFE SE HA PUESTO CALCETINES DESPAREJADOS",
            "NUEVA APP DE LA EMPRESA: AHORA TE MIDE LA PRESIÓN AL MIRAR EL EXCEL",
            "SOSPECHAS: ¿ES EL NUEVO BECARIO UN ROBOT DE GEMINI?",
            "CIENTÍFICOS AFIRMAN QUE EL LUNES DEBERÍA DURAR 4 HORAS",
            "ALERTA: LA MÁQUINA DE CAFÉ HA EMPEZADO A HABLAR EN LATÍN"
          ].map((text, i) => (
            <span key={i} className="mx-10 font-black text-sm uppercase tracking-widest italic flex items-center gap-2">
              <Zap className="text-yellow-300" size={16} /> {text}
            </span>
          ))}
        </div>
      </div>

      <header className="max-w-7xl mx-auto px-4 pt-12 pb-10 text-center">
        <div className="border-y-8 border-double border-black py-8 mb-4">
          <h1 className="newspaper-font text-8xl md:text-[13rem] font-black leading-none tracking-tighter uppercase select-none">
            FATONEWS
          </h1>
          <p className="newspaper-font text-2xl md:text-4xl font-bold italic text-gray-800 mt-2">
            "Donde el rumor es sagrado y el dato es opcional"
          </p>
        </div>
        <div className="flex flex-col md:flex-row justify-between border-b-2 border-black py-2 text-xs font-black uppercase tracking-widest gap-2">
          <span>SECCIÓN: COTILLEOS DE PASILLO</span>
          <span className="hidden md:block">★ ★ ★ ★ ★</span>
          <span>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-12">
        {/* Mesa de Redacción */}
        <section className="bg-white neo-border p-8 mb-20 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 opacity-5 rotate-12">
            <Quote size={300} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className={`p-4 rounded-full ${isRecording ? 'bg-red-100' : 'bg-gray-100'}`}>
                <Radio className={isRecording ? 'text-red-600 animate-pulse' : 'text-gray-400'} size={32} />
              </div>
              <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter">Mesa de Redacción</h2>
                <p className="font-bold text-gray-500 uppercase text-xs italic tracking-widest">Informa sobre el drama de hoy</p>
              </div>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 flex flex-col gap-4">
                {!isRecording ? (
                  <button 
                    onClick={startVoice}
                    disabled={isGenerating}
                    className="group relative py-8 px-10 neo-border-sm bg-yellow-400 hover:bg-yellow-300 transition-all text-2xl font-black disabled:opacity-50"
                  >
                    <div className="flex items-center justify-center gap-4">
                      <Mic size={32} />
                      <span>DICTAR CHISME</span>
                    </div>
                  </button>
                ) : (
                  <button 
                    onClick={stopVoiceAndGenerate}
                    className="py-8 px-10 neo-border-sm bg-red-600 text-white animate-pulse text-2xl font-black"
                  >
                    <div className="flex items-center justify-center gap-4">
                      <RefreshCcw className="animate-spin" size={32} />
                      <span>¡REDACTAR YA!</span>
                    </div>
                  </button>
                )}
                
                <p className="text-[10px] font-bold text-gray-400 uppercase leading-tight">
                  * Al pulsar se activará el micrófono de la redacción. Cuéntalo todo sin miedo a las represalias.
                </p>
              </div>

              <div className="lg:col-span-2">
                <div className="flex flex-col h-full gap-4">
                  <div className="flex gap-4">
                    <input 
                      type="text"
                      value={keyboardInput}
                      onChange={(e) => setKeyboardInput(e.target.value)}
                      placeholder="Escribe el titular o drama manualmente..."
                      className="flex-1 neo-border-sm px-6 py-4 text-xl font-bold focus:outline-none focus:bg-yellow-50 placeholder:text-gray-300"
                    />
                    <button 
                      onClick={() => handleGenerate(keyboardInput)}
                      disabled={!keyboardInput.trim() || isGenerating}
                      className="bg-black text-white px-10 py-4 neo-border-sm font-black hover:bg-gray-800 disabled:opacity-30 transition-all"
                    >
                      <Send size={24} />
                    </button>
                  </div>

                  {transcript && (
                    <div className="relative group bg-gray-50 border-2 border-black border-dashed p-6 italic text-2xl font-serif text-gray-700 min-h-[100px]">
                      <button 
                        onClick={resetTranscript}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={16} />
                      </button>
                      "{transcript}..."
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-8 p-4 bg-red-50 border-2 border-red-600 flex items-center gap-4 text-red-600 font-bold animate-shake">
                <AlertCircle />
                <span className="uppercase tracking-tight">{error}</span>
              </div>
            )}
          </div>
        </section>

        {/* Estado de Carga Cinematográfico */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-24 mb-16 bg-white border-4 border-black border-dashed">
            <div className="relative">
              <Coffee size={80} className="text-red-600 animate-bounce" />
              <Zap className="absolute -top-6 -right-6 text-yellow-400 animate-pulse" size={40} />
            </div>
            <h3 className="newspaper-font text-5xl font-black italic mt-10 text-center animate-pulse">
              REDACTANDO LA PRIMICIA...
            </h3>
            <p className="text-gray-400 font-bold uppercase text-xs mt-4 tracking-widest">Consultando a fuentes no fiables</p>
          </div>
        )}

        {/* Feed de Artículos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
          {articles.map((art, i) => (
            <ArticleCard key={art.id} article={art} isMain={i === 0} />
          ))}
        </div>
      </main>

      <footer className="mt-32 border-t-8 border-double border-black pt-16 pb-10 text-center">
        <h2 className="newspaper-font text-4xl font-black uppercase mb-4 tracking-tighter">FATONEWS GROUP</h2>
        <div className="flex justify-center gap-8 text-xs font-black uppercase tracking-widest text-gray-500 mb-8">
          <span>Política de Bulo</span>
          <span>Aviso Legalmente Mentira</span>
          <span>Contacto de Prensa</span>
        </div>
        <p className="text-[10px] font-bold text-gray-400 uppercase">
          © {new Date().getFullYear()} - TODA LA REDACCIÓN ESTÁ DE VACACIONES PERMANENTES
        </p>
      </footer>
    </div>
  );
};

export default App;
