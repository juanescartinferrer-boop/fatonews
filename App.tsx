
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Radio, TrendingUp, Menu, Search, Coffee, Keyboard, Send } from 'lucide-react';
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

  // Inicializar noticias de ejemplo y una breaking news
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
      alert("Tu navegador no soporta reconocimiento de voz. Usa el teclado para redactar.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
      setTranscript('');
    };

    recognition.onresult = (event: any) => {
      const current = event.results[0][0].transcript;
      setTranscript(current);
    };

    recognition.onend = async () => {
      setIsRecording(false);
      if (transcript.trim()) {
        processNewArticle(transcript);
      }
    };

    recognition.onerror = () => setIsRecording(false);

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
    setIsGenerating(true);
    try {
      const article = await generateNewsFromVoice(text);
      const img = await generateImage(article.imagePrompt);
      setArticles(prev => [{ ...article, imageUrl: img }, ...prev]);
    } catch (e) {
      console.error("Error al generar noticia:", e);
    } finally {
      setIsGenerating(false);
      setTranscript('');
    }
  };

  return (
    <div className="min-h-screen paper-texture pb-20">
      {/* Header Estilo New York Times / Moderno */}
      <header className="border-b-2 border-black px-4 py-6 mb-8 bg-white/80 backdrop-blur sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4 text-sm font-bold uppercase tracking-widest border-b border-gray-100 pb-2">
            <div className="flex gap-4">
              <span>EDICIÓN ESPAÑA</span>
              <span className="text-red-600 animate-pulse flex items-center gap-1">
                <Radio size={14} /> EN VIVO
              </span>
            </div>
            <div className="hidden md:block">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
            </div>
            <div className="flex gap-4">
              <Search size={18} className="cursor-pointer hover:text-red-600" />
              <Menu size={18} className="cursor-pointer hover:text-red-600" />
            </div>
          </div>
          
          <div className="text-center relative py-4">
            <h1 className="newspaper-font text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none select-none">
              FATONEWS
            </h1>
            <p className="newspaper-font text-lg md:text-xl mt-2 font-medium italic text-gray-500 uppercase tracking-[0.2em]">
              "Donde la verdad es una sugerencia"
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4">
        {/* Sección de Control de Voz y Teclado / Reportero */}
        <section className="mb-12 bg-black text-white p-8 rounded-sm shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
             <TrendingUp size={120} />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-black mb-4 flex items-center gap-2">
              <Mic className="text-red-500" /> 
              SALA DE REDACCIÓN VIRTUAL
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl text-lg font-medium leading-relaxed">
              ¿Ha pasado algo indignante? ¿Un drama en el office? 
              <span className="text-white"> Cuéntanoslo con tu voz o escríbelo abajo</span>. 
              FatoNews convertirá tu chisme en periodismo de "alto nivel".
            </p>
            
            <div className="flex flex-col gap-6">
              {/* Opción de Voz */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button 
                  onClick={handleVoiceInput}
                  disabled={isGenerating}
                  className={`flex items-center gap-3 px-8 py-4 rounded-full font-black text-xl transition-all shadow-lg active:scale-95 ${
                    isRecording 
                    ? 'bg-red-600 animate-pulse hover:bg-red-700' 
                    : 'bg-white text-black hover:bg-gray-100'
                  } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isRecording ? <div className="w-4 h-4 bg-white rounded-full"></div> : <Mic size={24} />}
                  {isRecording ? 'ESCUCHANDO...' : isGenerating ? 'REDACTANDO...' : 'USAR MICRÓFONO'}
                </button>
                
                {transcript && (
                  <div className="flex-1 bg-white/10 p-4 rounded-lg italic text-gray-300 border border-white/20 animate-in fade-in slide-in-from-left-4">
                    "{transcript}"
                  </div>
                )}
              </div>

              {/* Opción de Teclado */}
              <form onSubmit={handleKeyboardSubmit} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1 group">
                  <Keyboard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-500 transition-colors" size={20} />
                  <input 
                    type="text"
                    value={keyboardInput}
                    onChange={(e) => setKeyboardInput(e.target.value)}
                    placeholder="Escribe aquí el chisme de oficina (ej: Alguien robó mi yogur de soja...)"
                    className="w-full bg-white/10 border border-white/20 rounded-full py-4 pl-12 pr-6 text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500 focus:bg-white/20 transition-all text-lg"
                    disabled={isGenerating}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={!keyboardInput.trim() || isGenerating}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-500 text-white font-black px-8 py-4 rounded-full flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl"
                >
                  <Send size={20} />
                  REDACTAR
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Loading State */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-10 animate-pulse bg-white/40 rounded-lg mb-8 border-2 border-dashed border-gray-300">
            <Coffee size={48} className="mb-4 text-red-600 animate-bounce" />
            <p className="text-xl font-black newspaper-font italic text-gray-600">Nuestros becarios están escribiendo a toda máquina...</p>
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
          
          {/* Tarjetas de Relleno cómico */}
          {articles.length > 0 && (
            <>
              <div className="bg-yellow-50 p-6 border-2 border-dashed border-yellow-200 rounded-sm">
                <h4 className="font-black text-xs uppercase mb-4 text-yellow-800 tracking-widest">PUBLICIDAD ENGAÑOSA</h4>
                <div className="newspaper-font text-2xl font-bold mb-4">"Aprende Excel en 5 segundos usando solo la mente"</div>
                <p className="text-sm text-yellow-700 italic">Un curso impartido por un monje tibetano que nunca ha visto un ordenador.</p>
                <button className="mt-4 w-full bg-yellow-800 text-white py-2 font-bold text-sm">ME INTERESA (NO)</button>
              </div>
              
              <div className="bg-red-50 p-6 border-l-4 border-red-600">
                <h4 className="font-black text-xs uppercase mb-4 text-red-800 tracking-widest">EL RINCÓN DEL VAGO</h4>
                <div className="newspaper-font text-2xl font-bold mb-4">Horóscopo de hoy: Acuario</div>
                <p className="text-sm text-red-700 italic">Hoy tu jefe te va a pedir "un minutito". Ese minuto durará 3 horas y media. Evita el contacto visual.</p>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t-4 border-black pt-12 pb-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h2 className="newspaper-font text-4xl font-black mb-4">FATONEWS</h2>
            <p className="text-gray-600 max-w-sm">
              FatoNews es una publicación satírica generada por IA. Cualquier parecido con la realidad es puramente gracioso o resultado de un bug en el sistema. No nos hacemos responsables de las risas en horario laboral.
            </p>
          </div>
          <div>
            <h4 className="font-black mb-4 uppercase text-sm tracking-widest">SECCIONES</h4>
            <ul className="text-sm space-y-2 font-bold text-gray-500">
              <li className="hover:text-red-600 cursor-pointer">POLÍTICA DE PASILLO</li>
              <li className="hover:text-red-600 cursor-pointer">SINDICALISMO DE CAFÉ</li>
              <li className="hover:text-red-600 cursor-pointer">TECNOLOGÍA OBSOLETA</li>
              <li className="hover:text-red-600 cursor-pointer">ESQUIVAR REUNIONES</li>
            </ul>
          </div>
          <div>
            <h4 className="font-black mb-4 uppercase text-sm tracking-widest">CONTACTO</h4>
            <p className="text-sm text-gray-500 font-bold italic">No nos escribas, estamos en una reunión de "brainstorming" (mirando a la nada).</p>
          </div>
        </div>
        <div className="text-center mt-12 pt-8 border-t border-gray-100 text-xs font-bold text-gray-400">
          © {new Date().getFullYear()} FATONEWS MEDIA GROUP - LA VERDAD ES RELATIVA
        </div>
      </footer>
    </div>
  );
};

export default App;
