import { Button } from '@heroui/react';
import { Text } from '@/components/ui/Text';
import { Icons } from '@/lib/icons/Icons';
import { cn } from '@/lib/utils';

interface SampleQuestion {
  id: string;
  text: string;
}

interface SampleQuestionsProps {
  questions?: SampleQuestion[];
  className?: string;
}

const defaultQuestions: SampleQuestion[] = [
  {
    id: '1',
    text: 'What are the items waiting to be received that are high in demand and low in stock?',
  },
  {
    id: '2',
    text: 'What are the items waiting to be received that are high in demand and low in stock?',
  },
  {
    id: '3',
    text: 'List low stock item with high risk.',
  },
  {
    id: '4',
    text: 'List out all the suppliers with low performance and poor delivery.',
  },
];

export function SampleQuestions({
  questions = defaultQuestions,
  className,
}: Readonly<SampleQuestionsProps>) {
  return (
    <section className={cn('w-full px-10 pb-6', className)} aria-label="Sample questions">
      <Text variant="bodyBase" color="muted">
        Sample Questions:
      </Text>

      <div className="flex flex-col gap-2 items-start mt-3">
        {questions.map((question) => (
          <Button
            key={question.id}
            variant="flat"
            radius="md"
            size="md"
            className={cn('!w-auto max-w-full group transition-colors duration-200')}
            endContent={
              <Icons.ChevronRight
                className="
                w-4 h-4
                opacity-0
                transition-opacity duration-200
                group-data-[hover=true]:opacity-100
                group-data-[hover=true]:text-secondary
              "
              />
            }
          >
            <Text
              as="span"
              variant="bodyBase"
              color="muted"
              className="transition-colors duration-200 group-data-[hover=true]:text-secondary"
            >
              {question.text}
            </Text>
          </Button>
        ))}
      </div>
    </section>
  );
}
