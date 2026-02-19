
import React from 'react';
import { NewsArticle } from '../types';

interface ArticleCardProps {
  article: NewsArticle;
  isMain?: boolean;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, isMain = false }) => {
  return (
    <div className={`group flex flex-col ${isMain ? 'md:col-span-2 lg:col-span-3 border-b-4 border-black pb-8' : 'border-b border-gray-200 pb-6'}`}>
      <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-widest text-red-600">
        <span className="bg-red-600 text-white px-2 py-0.5 rounded-sm">{article.category}</span>
        <span className="text-gray-400">•</span>
        <span>{article.date}</span>
      </div>
      
      {isMain ? (
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="newspaper-font text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-4 hover:text-red-700 transition-colors cursor-pointer">
              {article.title}
            </h2>
            <p className="text-xl text-gray-600 font-medium mb-4 italic">
              {article.subtitle}
            </p>
            <div className="prose prose-slate max-w-none text-gray-800 leading-relaxed text-lg">
              {article.content.split('\n').map((p, i) => <p key={i} className="mb-4">{p}</p>)}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-500">POR {article.author.toUpperCase()}</span>
              <button className="text-sm font-bold text-red-600 hover:underline">LEER MÁS →</button>
            </div>
          </div>
          <div className="relative overflow-hidden bg-gray-100 aspect-[4/3] rounded-sm shadow-xl">
             <img 
               src={article.imageUrl || `https://picsum.photos/seed/${article.id}/800/600`} 
               alt={article.title}
               className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
             />
             <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent text-white text-xs italic">
               Imagen exclusiva de FatoNews: "{article.imagePrompt}"
             </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="relative mb-4 bg-gray-100 aspect-video rounded-sm overflow-hidden">
            <img 
              src={article.imageUrl || `https://picsum.photos/seed/${article.id}/400/300`} 
              alt={article.title}
              className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <h3 className="newspaper-font text-2xl font-bold mb-2 leading-tight group-hover:text-red-700 transition-colors cursor-pointer">
            {article.title}
          </h3>
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
            {article.content}
          </p>
          <div className="mt-auto flex items-center justify-between text-xs font-bold text-gray-400">
            <span>{article.author}</span>
            <button className="text-red-600 hover:underline">MÁS</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleCard;
