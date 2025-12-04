import type { Feature } from './types';

export const features: Feature[] = [
  {
    id: '1',
    title: 'Built for Clarity — Not Complexity',
    subtitle: 'Finally, your PostgreSQL database makes sense to everyone',
    quote:
      '"We turn cryptic tables and columns into natural conversations. No SQL, no dashboards, no technical barriers. Just ask questions like you\'re talking to a colleague, and get answers that actually make sense."',
    image:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
    icon: 'CheckCircle',
  },
  {
    id: '2',
    title: 'Ask Like You Think, Not Like a Machine',
    subtitle: 'Natural language that understands your business logic',
    quote:
      '"Say \'Show me declining products\' instead of juggling through dashboard. Our AI maps your unique business rules (not generic algorithms) so answers reflect how you actually operate. Follow-up questions work like real dialogue."',
    image:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop',
    icon: 'Message',
  },
  {
    id: '3',
    title: 'Answers You Can Trust, Immediately',
    subtitle: 'No more guessing if the data is right',
    quote:
      '"Every answer shows its source tables and confidence score. See exactly how we arrived at insights – no black boxes. Confirm schema relationships before going live so your team never doubts the data again."',
    image:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop',
    icon: 'Search',
  },
  {
    id: '4',
    title: 'Your Data, Your Rules, Always',
    subtitle: 'No storage, no training, no leaks',
    quote:
      '"We never store your data or queries. Every connection is ephemeral – your PostgreSQL URL is encrypted, queries execute in real-time, then vanish. You see exactly what\'s accessed and when."',
    image:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop',
    icon: 'Document',
  },
];
