export interface Comment {
  author: string;
  text: string;
  avatarSeed: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  category: string;
  author: string;
  authorId?: string;
  date: string;
  imagePrompt: string;
  imageUrl?: string;
  comments?: Comment[];
}

export interface Redactor {
  id: string;
  name: string;
  alias: string;
  avatarUrl: string;
  bio: string;
  articlesWritten: number;
}

export enum NewsCategory {
  OFFICE = 'Política de Pasillo',
  COFFEE = 'Crisis del Café',
  TECH = 'Tecnología (o algo así)',
  GOSSIP = 'Rumores Infundados',
  SPORTS = 'Deportes de Silla'
}

export type AppView = 'home' | 'article' | 'bulo' | 'legal' | 'contacto' | 'login' | 'profile' | 'archive';
