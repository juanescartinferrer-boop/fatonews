
export interface NewsArticle {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  category: string;
  author: string;
  date: string;
  imagePrompt: string;
  imageUrl?: string;
}

export enum NewsCategory {
  OFFICE = 'Política de Pasillo',
  COFFEE = 'Crisis del Café',
  TECH = 'Tecnología (o algo así)',
  GOSSIP = 'Rumores Infundados',
  SPORTS = 'Deportes de Silla'
}
