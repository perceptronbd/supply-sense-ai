import { CheckCircle, LucideMessageSquareText, Search } from 'lucide-react';
import SectionWrapper from '../ui/SectionWrapper';

const SupplySense = () => {
  const messages = [
    {
      icon: LucideMessageSquareText,
      title: 'Ask in Plain English',
      description: 'No jargon, no special syntax.',
    },
    {
      icon: Search,
      title: 'We Scan Your System’s Data',
      description: 'Real-time from databases, docs, ERPs.',
    },
    {
      icon: CheckCircle,
      title: 'You Get a Direct Answer',
      description: 'Clear, instant, and actionable.',
    },
  ];

  return (
    <SectionWrapper size="large">
      <h1 className="max-w-2xl pt-12 font-brand leading-snug text-3xl md:text-4xl font-bold text-content1-foreground text-center mx-auto">
        Supply Sense Makes It Simple
      </h1>

      <p className="mt-6 mx-auto text-center text-content1-foreground px-6 mb-16 font-medium text-lg">
        Get the operational insights you need without the complexity.
      </p>

      <div className="flex flex-wrap gap-10 justify-around items-center">
        {messages.map((message) => (
          <div key={message.title} className="max-w-80">
            <div className="flex flex-col items-center gap-4 mb-4">
              <message.icon size={60} className=" text-primary" />
              <h2 className="text-lg font-bold text-content1-foreground">{message.title}</h2>
            </div>
            <p className="text-content2-foreground">{message.description}</p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
};

export default SupplySense;
