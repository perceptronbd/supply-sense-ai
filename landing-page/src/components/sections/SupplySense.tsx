import { Avatar, Card, CardBody } from '@heroui/react';
import { CheckCircle, Database, LucideMessageSquareText, User } from 'lucide-react';
import Image from 'next/image';
import fullLogo from '../../../public/assets/full-logo.svg';
import logo from '../../../public/assets/logo.svg';
import SectionWrapper from '../ui/SectionWrapper';

const SupplySense = () => {
  const messages = [
    {
      icon: LucideMessageSquareText,
      title: 'Ask your question in plain English',
      description:
        'No need for complex queries or technical language. Ask as you would to a colleague.',
    },
    {
      icon: Database,
      title: "We scan your system's live data and internal documents",
      description:
        'Supply Sense connects to your existing systems and documents to find relevant information.',
    },
    {
      icon: CheckCircle,
      title: 'You get a direct, accurate answer — no digging, no delay',
      description:
        'Clear, actionable information delivered instantly to help you make better decisions.',
    },
  ];

  return (
    <SectionWrapper>
      <h1 className="max-w-2xl pt-12 font-display leading-snug text-xl md:text-2xl font-bold text-foreground text-center mx-auto">
        You've Got Data. But Getting Answers Is Still a Pain.
      </h1>

      <p className="mt-6 mx-auto text-center text-foreground px-6 mb-16 font-medium text-lg ">
        How it works:
      </p>

      <div className="grid grid-cols-1 gap-9 mb-12">
        {messages.map((message, index: number) => (
          <div
            key={message.title}
            className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
          >
            <Card
              className="h-full border-2 rounded-lg max-w-xl px-3 border-secondary/20 shadow-lg shadow-secondary/10 bg-background/50 backdrop-blur-sm"
              shadow="lg"
              radius="lg"
              classNames={{
                base: 'bg-inherit',
              }}
            >
              <CardBody className="p-6 space-y-4">
                <div className="flex items-start justify-start gap-3">
                  <Avatar
                    className="w-16 h-12 bg-default-800 bg-opacity-60"
                    fallback={<message.icon size={28} className="" />}
                  />
                  <div>
                    <h3 className="text-foreground text-lg font-bold mb-4">{message.title}</h3>

                    <p className="text-foreground text-sm">{message.description}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        ))}
      </div>

      {/* chat box */}
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-gradient-to-r from-primary-50 to-secondary-200 p-0.5 rounded-2xl">
          <div className="bg-background rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <Image src={fullLogo} width={40} height={20} alt="fullLogo" className="w-36" />
              <button type="button" className="px-4 py-2 rounded-lg text-secondary">
                Clear Chat
              </button>
            </div>

            {/* Chat Messages */}
            <div className="space-y-4">
              {/* User Message */}
              <div className="flex justify-end items-start gap-3">
                <div className="bg-secondary-50 max-w-lg rounded-xl p-4">
                  <p className="text-foreground text-sm">
                    "What items were requested in the last hour from Branch A?"
                  </p>
                </div>
                <div className="bg-secondary-100 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5" />
                </div>
              </div>

              {/* Bot Response */}
              <div className="flex items-start gap-3">
                <div className="bg-secondary-100 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Image src={logo} width={40} height={40} alt="Logo" className="w-6" />
                </div>
                <div className="bg-secondary-50 max-w-2xl rounded-xl p-4">
                  <p className="text-foreground text-sm">
                    » "Item #412 (steel rods) x 50, requested by Anwar Hossain at 2:43 PM."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default SupplySense;
