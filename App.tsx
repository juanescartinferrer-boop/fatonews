import React, { useState, useEffect, useRef } from 'react';
import { Mic, Radio, Send, Zap, AlertCircle, Coffee, RefreshCcw, Quote, Trash2, ArrowLeft, X, Home, User, LogIn, Camera, Image as ImageIcon, Upload, ShieldCheck, Award, MapPin, Printer, Archive, MessageSquare } from 'lucide-react';
import { NewsArticle, AppView, Redactor } from './types';
import { generateBreakingNews, generateNewsFromVoice, generateImage } from './services/gemini';
import ArticleCard from './components/ArticleCard';

const App: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [keyboardInput, setKeyboardInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [user, setUser] = useState<Redactor | null>(null);
  const [loginForm, setLoginForm] = useState({ name: '', alias: '', bio: '' });
  
  const [view, setView] = useState<AppView>('home');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Cargar artículos guardados al iniciar
  useEffect(() => {
    const savedArticles = localStorage.getItem('fatonews_articles');
    if (savedArticles) {
      setArticles(JSON.parse(savedArticles));
    } else {
      loadInitialContent();
    }

    const savedUser = localStorage.getItem('fatonews_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // Guardar artículos cada vez que cambian
  useEffect(() => {
    if (articles.length > 0) {
      localStorage.setItem('fatonews_articles', JSON.stringify(articles));
    }
  }, [articles]);

  const loadInitialContent = async () => {
    setIsGenerating(true);
    try {
      const art = await generateBreakingNews();
      const img = await generateImage(art.imagePrompt);
      const fullArt = { ...art, imageUrl: img };
      setArticles([fullArt]);
    } catch (e: any) {
      setError("Fallo en la rotativa. ¿Has pagado la suscripción a Gemini?");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.name || !loginForm.alias) return;
    
    const newUser: Redactor = {
      id: Math.random().toString(36).substr(2, 9),
      name: loginForm.name,
      alias: loginForm.alias,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${loginForm.alias}`,
      bio: loginForm.bio || "Redactor de élite especializado en rumores de cafetería.",
      articlesWritten: 0
    };
    
    setUser(newUser);
    localStorage.setItem('fatonews_user', JSON.stringify(newUser));
    setView('home');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('fatonews_user');
    setView('home');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'article' | 'avatar') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (target === 'article') {
          setPendingImage(base64);
        } else if (user) {
          const updatedUser = { ...user, avatarUrl: base64 };
          setUser(updatedUser);
          localStorage.setItem('fatonews_user', JSON.stringify(updatedUser));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startVoice = () => {
    const SpeechRec = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRec) {
      alert("Navegador obsoleto detectado. Por favor, escriba como un humano civilizado.");
      return;
    }
    const recognition = new SpeechRec();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onstart = () => { setIsRecording(true); setError(null); };
    recognition.onresult = (event: any) => {
      let current = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) current += event.results[i][0].transcript;
      setTranscript(current);
    };
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleGenerate = async (text: string) => {
    if (isGenerating || !text.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const article = await generateNewsFromVoice(text);
      const finalImg = pendingImage || await generateImage(article.imagePrompt);
      
      const newArticle = { 
        ...article, 
        imageUrl: finalImg, 
        author: user?.alias || article.author,
        authorId: user?.id 
      };
      
      setArticles(prev => [newArticle, ...prev]);
      setTranscript('');
      setKeyboardInput('');
      setPendingImage(null);
      
      if (user) {
        const updatedUser = { ...user, articlesWritten: user.articlesWritten + 1 };
        setUser(updatedUser);
        localStorage.setItem('fatonews_user', JSON.stringify(updatedUser));
      }
      
      setView('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      setError("El redactor jefe ha censurado esta noticia. Prueba otra vez.");
    } finally {
      setIsGenerating(false);
    }
  };

  const openArticle = (article: NewsArticle) => {
    setSelectedArticle(article);
    setView('article');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const PageLayout = ({ title, subtitle, children }: { title: string, subtitle?: string, children: React.ReactNode }) => (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fadeIn no-print">
      <button onClick={() => setView('home')} className="flex items-center gap-2 font-black uppercase text-xs hover:text-red-700 mb-8 group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> VOLVER A LA REDACCIÓN
      </button>
      <h1 className="newspaper-font text-6xl md:text-8xl font-black mb-4 uppercase leading-none border-b-8 border-black pb-6 tracking-tighter">{title}</h1>
      {subtitle && <p className="text-xl md:text-2xl italic font-bold text-gray-500 mb-12 leading-tight">{subtitle}</p>}
      <div className="prose prose-xl max-w-none text-gray-800 font-serif leading-relaxed">
        {children}
      </div>
    </div>
  );

  const renderView = () => {
    switch (view) {
      case 'login':
        return (
          <PageLayout title="Pase de Prensa" subtitle="Identifícate para acceder a los archivos clasificados.">
            <div className="press-card max-w-sm mx-auto p-1 py-8 neo-border">
              <div className="bg-white p-8">
                <div className="w-32 h-32 mx-auto mb-6 bg-gray-100 neo-border-sm flex items-center justify-center overflow-hidden">
                  <User size={64} className="text-gray-300" />
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                  <input 
                    type="text" 
                    required 
                    placeholder="Tu nombre real" 
                    className="w-full border-2 border-black p-3 text-sm font-bold uppercase focus:bg-yellow-50 outline-none"
                    value={loginForm.name}
                    onChange={e => setLoginForm({...loginForm, name: e.target.value})}
                  />
                  <input 
                    type="text" 
                    required 
                    placeholder="Tu Pseudónimo" 
                    className="w-full border-2 border-black p-3 text-sm font-bold uppercase focus:bg-yellow-50 outline-none"
                    value={loginForm.alias}
                    onChange={e => setLoginForm({...loginForm, alias: e.target.value})}
                  />
                  <textarea 
                    placeholder="Tu biografía satírica..." 
                    className="w-full border-2 border-black p-3 text-sm font-bold focus:bg-yellow-50 outline-none h-24"
                    value={loginForm.bio}
                    onChange={e => setLoginForm({...loginForm, bio: e.target.value})}
                  />
                  <button type="submit" className="w-full bg-black text-white p-4 font-black uppercase text-sm neo-border-sm hover:translate-y-1 transition-all">
                    OBTENER CREDENCIAL
                  </button>
                </form>
              </div>
            </div>
          </PageLayout>
        );

      case 'profile':
        if (!user) return null;
        return (
          <PageLayout title="Tu Perfil" subtitle={`Estatus: ${user.articlesWritten > 10 ? 'EDITOR JEFE' : 'BECARIO'}`}>
            <div className="grid md:grid-cols-3 gap-12 items-start">
              <div className="space-y-6">
                <div className="relative group neo-border aspect-square overflow-hidden bg-yellow-400">
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  <button onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-all">
                    <Camera size={40} />
                    <span className="font-black text-xs uppercase mt-2">CAMBIAR</span>
                  </button>
                  <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'avatar')} />
                </div>
              </div>
              <div className="md:col-span-2 space-y-8">
                <h2 className="text-5xl font-black uppercase tracking-tighter border-b-4 border-black pb-2">{user.name}</h2>
                <p className="text-xl italic font-bold text-red-600">"{user.alias}"</p>
                <div className="bg-white p-8 neo-border-sm italic font-serif text-xl leading-relaxed">"{user.bio}"</div>
                <button onClick={handleLogout} className="text-red-600 font-black uppercase text-sm hover:underline">DIMITIR</button>
              </div>
            </div>
          </PageLayout>
        );

      case 'archive':
        return (
          <PageLayout title="Hemeroteca" subtitle="El cementerio de noticias que ayer eran primicias.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {articles.slice(1).map(art => (
                <div key={art.id} onClick={() => openArticle(art)} className="cursor-pointer group">
                  <div className="aspect-video mb-4 overflow-hidden border-2 border-black grayscale hover:grayscale-0 transition-all">
                    <img src={art.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <h3 className="newspaper-font text-2xl font-black uppercase leading-tight group-hover:text-red-600">{art.title}</h3>
                  <p className="text-xs text-gray-500 font-bold mt-2 uppercase">{art.date} • {art.category}</p>
                </div>
              ))}
              {articles.length <= 1 && <p className="col-span-full text-center py-20 italic font-serif">No hay noticias antiguas. Aún eres demasiado joven para la nostalgia.</p>}
            </div>
          </PageLayout>
        );

      case 'article':
        if (!selectedArticle) return null;
        return (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="no-print mb-8 flex justify-between items-center">
              <button onClick={() => setView('home')} className="flex items-center gap-2 font-black uppercase text-xs hover:text-red-700 group">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> VOLVER
              </button>
              <button onClick={() => window.print()} className="flex items-center gap-2 bg-black text-white px-4 py-2 neo-border-sm text-xs font-black uppercase hover:bg-red-600 transition-colors">
                <Printer size={16} /> IMPRIMIR PARA EL TABLÓN
              </button>
            </div>

            <article className="print-content">
              <h1 className="newspaper-font text-6xl md:text-8xl font-black mb-4 uppercase leading-none border-b-8 border-black pb-6 tracking-tighter">
                {selectedArticle.title}
              </h1>
              <p className="text-xl md:text-2xl italic font-bold text-gray-500 mb-12 leading-tight">
                {selectedArticle.subtitle}
              </p>

              <div className="mb-12 neo-border">
                <img src={selectedArticle.imageUrl} alt={selectedArticle.title} className="w-full h-auto object-cover" />
                <div className="p-4 bg-black text-white text-[10px] italic uppercase tracking-widest flex justify-between">
                  <span>FOTO EXCLUSIVA | © {selectedArticle.author.toUpperCase()}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-12 py-4 border-y-4 border-double border-black font-black uppercase text-sm italic">
                <span>{selectedArticle.category}</span>
                <span className="text-red-700">POR {selectedArticle.author}</span>
                <span>{selectedArticle.date}</span>
              </div>

              <div className="font-serif text-2xl leading-relaxed space-y-6 first-letter:text-9xl first-letter:font-black first-letter:float-left first-letter:mr-4 first-letter:mt-2 first-letter:leading-none mb-20">
                {selectedArticle.content.split('\n').map((p, i) => <p key={i}>{p}</p>)}
              </div>

              {/* Sección de Comentarios */}
              {selectedArticle.comments && selectedArticle.comments.length > 0 && (
                <section className="no-print mt-20 border-t-2 border-black pt-10">
                  <h3 className="font-black uppercase text-2xl mb-8 flex items-center gap-3">
                    <MessageSquare className="text-red-600" /> Rumores en los comentarios
                  </h3>
                  <div className="space-y-6">
                    {selectedArticle.comments.map((comment, i) => (
                      <div key={i} className="flex gap-4 items-start p-4 bg-white border border-gray-100 neo-border-sm">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 border border-black flex-shrink-0">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.avatarSeed}`} alt="User" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase text-red-600 mb-1">{comment.author}</p>
                          <p className="font-serif italic text-lg leading-snug">"{comment.text}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </article>
          </div>
        );

      case 'bulo':
      case 'legal':
      case 'contacto':
        return <PageLayout title={view.toUpperCase()} subtitle="Mantenimiento en curso."><p className="py-20 text-center font-black">VISTA EN CONSTRUCCIÓN POR EL BECARIO.</p></PageLayout>;

      default:
        return (
          <>
            {/* Mesa de Redacción */}
            <section className="bg-white neo-border p-8 mb-20">
              <div className="flex flex-col lg:flex-row gap-10">
                <div className="lg:w-1/3">
                  <div className={`relative aspect-[4/3] neo-border-sm overflow-hidden bg-gray-50 flex items-center justify-center group ${pendingImage ? 'border-green-600' : 'border-black'}`}>
                    {pendingImage ? (
                      <>
                        <img src={pendingImage} className="w-full h-full object-cover" />
                        <button onClick={() => setPendingImage(null)} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full"><X size={16}/></button>
                      </>
                    ) : (
                      <div className="text-center p-6">
                        <ImageIcon size={64} className="mx-auto mb-4 text-gray-200" />
                        <p className="text-xs font-black uppercase text-gray-400">EVIDENCIA FOTOGRÁFICA</p>
                      </div>
                    )}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-4 left-4 right-4 bg-white border-2 border-black p-3 font-black text-xs uppercase hover:bg-yellow-400 transition-all flex items-center justify-center gap-2"
                    >
                      <Upload size={16}/> {pendingImage ? 'CAMBIAR PRUEBA' : 'SUBIR FOTO REAL'}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'article')} />
                  </div>
                </div>
                
                <div className="lg:w-2/3 space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Radio size={24} className={isRecording ? 'text-red-600 animate-pulse' : 'text-gray-400'} />
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Mesa de Redacción</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <input 
                        type="text"
                        value={keyboardInput}
                        onChange={e => setKeyboardInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleGenerate(keyboardInput)}
                        placeholder="El titular del escándalo..."
                        className="flex-1 neo-border-sm px-6 py-4 text-xl font-bold focus:bg-yellow-50 outline-none placeholder:text-gray-300"
                      />
                      <button 
                        onClick={() => handleGenerate(keyboardInput)}
                        disabled={isGenerating || (!keyboardInput.trim() && !transcript)}
                        className="bg-black text-white px-10 neo-border-sm font-black uppercase hover:bg-gray-800 disabled:opacity-30 flex items-center gap-2"
                      >
                        <Send size={20} /> PUBLICAR
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <button onClick={startVoice} disabled={isGenerating || isRecording} className={`py-5 px-6 neo-border-sm flex items-center justify-center gap-3 font-black uppercase text-sm transition-all ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-yellow-400 hover:bg-yellow-300'}`}>
                        <Mic /> {isRecording ? 'CAPTURANDO...' : 'DICTAR PRIMICIA'}
                      </button>
                      <button onClick={() => setView('archive')} className="py-5 px-6 neo-border-sm bg-white hover:bg-black hover:text-white flex items-center justify-center gap-3 font-black uppercase text-sm transition-all">
                        <Archive /> IR A LA HEMEROTECA
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {isGenerating && (
                <div className="absolute inset-0 bg-white/95 z-[60] flex flex-col items-center justify-center">
                  <RefreshCcw size={40} className="animate-spin text-black mb-4" />
                  <h3 className="newspaper-font text-4xl font-black italic">IMPRIMIENDO...</h3>
                </div>
              )}
            </section>

            {/* Artículos de hoy */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
              {articles.slice(0, 10).map((art, i) => (
                <ArticleCard key={art.id} article={art} isMain={i === 0} onOpen={openArticle} />
              ))}
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen pb-20 selection:bg-yellow-300">
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-black text-white px-6 py-3 flex justify-between items-center no-print">
        <button onClick={() => setView('home')} className="flex items-center gap-2 font-black text-[10px] uppercase hover:text-yellow-400">
          <Home size={14} /> PORTADA
        </button>
        <div className="flex items-center gap-4">
          {user ? (
            <button onClick={() => setView('profile')} className="flex items-center gap-3 bg-white text-black pl-1 pr-4 py-1 neo-border-sm hover:bg-yellow-400 transition-all">
              <div className="w-8 h-8 rounded-full border border-black overflow-hidden bg-gray-200">
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] font-black uppercase">{user.alias}</span>
            </button>
          ) : (
            <button onClick={() => setView('login')} className="bg-yellow-400 text-black px-5 py-2 neo-border-sm font-black text-[10px] uppercase hover:bg-white transition-all">
              ACCESO REDACCIÓN
            </button>
          )}
        </div>
      </nav>

      <div className="bg-red-700 text-white py-3 overflow-hidden border-b-4 border-black mt-14 no-print">
        <div className="animate-ticker flex items-center">
          {["DESPIDEN AL BECARIO POR PONER MÚSICA EN EL ASCENSOR", "LA CAFETERA PIDE UN AUMENTO DE SUELDO", "NUEVA NORMA: PROHIBIDO MIRAR POR LA VENTANA MÁS DE 2 SEGUNDOS"].map((text, i) => (
            <span key={i} className="mx-12 font-black text-sm uppercase italic flex items-center gap-3 whitespace-nowrap">
              <Zap className="text-yellow-300" size={18} /> {text}
            </span>
          ))}
        </div>
      </div>

      <header className="max-w-7xl mx-auto px-4 pt-16 pb-12 text-center no-print">
        <div className="border-y-8 border-double border-black py-10 mb-6 cursor-pointer hover:bg-black/5 transition-all group" onClick={() => setView('home')}>
          <h1 className="newspaper-font text-[12vw] font-black leading-none tracking-tighter uppercase group-hover:scale-[1.02]">FATONEWS</h1>
          <p className="newspaper-font text-2xl md:text-5xl font-bold italic text-gray-800 mt-4 tracking-tighter">"Donde el rumor es sagrado"</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-12 min-h-[60vh]">
        {renderView()}
      </main>

      <footer className="mt-40 border-t-8 border-double border-black pt-20 pb-12 text-center bg-white/50 relative no-print">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#fdfcf8] px-10">
           <Quote size={50} className="text-black rotate-12" />
        </div>
        <h2 className="newspaper-font text-5xl font-black uppercase mb-8 tracking-tighter italic">FATONEWS GROUP</h2>
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 text-[11px] font-black uppercase tracking-widest text-gray-500 mb-16">
          <button onClick={() => setView('bulo')} className="hover:text-red-700 hover:underline">Política de Bulo</button>
          <button onClick={() => setView('legal')} className="hover:text-red-700 hover:underline">Aviso Legalmente Mentira</button>
          <button onClick={() => setView('contacto')} className="hover:text-red-700 hover:underline">Contacto</button>
        </div>
        <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.8em]">© {new Date().getFullYear()} FATONEWS INC.</p>
      </footer>
    </div>
  );
};

export default App;
