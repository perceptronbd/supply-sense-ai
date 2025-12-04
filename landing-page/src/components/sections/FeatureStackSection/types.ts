export interface Feature {
  id: string;
  title: string;
  subtitle: string;
  quote: string;
  image: string;
  icon: 'CheckCircle' | 'Message' | 'Search' | 'Document';
}
