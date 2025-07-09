import { Card, CardBody } from '@heroui/react';
import { FileText, Phone, Table } from 'lucide-react';

const Data = () => {
  const features = [
    {
      icon: FileText,
      title: 'Logging into multiple systems',
      description: 'Wasting time with different logins and interfaces',
    },
    {
      icon: Phone,
      title: 'Calling someone from IT',
      description: 'Waiting for answers that should be at your fingertips',
    },
    {
      icon: Table,
      title: 'Hunting through spreadsheets',
      description: 'Digging through data instead of acting on insights',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="max-w-2xl pt-20 font-display leading-snug text-3xl md:text-5xl font-bold text-foreground text-center mx-auto">
        You've Got Data. But Getting Answers Is Still a Pain.
      </h1>

      <p className="mt-4 mx-auto text-center text-foreground px-6 mb-16">
        If finding out what's happening in your supply chain means:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="h-full"
            classNames={{
              base: 'w-64 bg-secondary-50 opacity-90',
            }}
          >
            <CardBody className="flex flex-col items-center text-center p-8 space-y-4">
              <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center">
                <feature.icon size={28} />
              </div>

              <h3 className="text-lg font-bold leading-tight text-foreground font-display">
                {feature.title}
              </h3>

              <p className="text-sm text-foreground leading-relaxed font-display">
                {feature.description}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      <p className="mx-auto text-center font-medium text-lg font-display mb-16">
        Then you're already wasting time and missing context.
      </p>
    </div>
  );
};

export default Data;
