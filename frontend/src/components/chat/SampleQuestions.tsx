'use client';

import { Button, Spinner } from '@heroui/react';
import { useMemo } from 'react';
import { Text } from '@/components/ui/Text';
import { Icons } from '@/lib/icons/Icons';
import { cn } from '@/lib/utils';
import { useGetSampleQuestionsQuery } from '@/store/api/onboardingApi';

interface SampleQuestionsProps {
  dbConnectionId: string;
  className?: string;
  onQuestionClick?: (question: string) => void;
}

// Function to get random elements from an array
const getRandomElements = <T,>(array: T[], count: number): T[] => {
  if (!array || array.length <= count) return array || [];

  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export function SampleQuestions({
  dbConnectionId,
  className,
  onQuestionClick,
}: Readonly<SampleQuestionsProps>) {
  const { data, isLoading, isError } = useGetSampleQuestionsQuery(dbConnectionId, {
    skip: !dbConnectionId,
  });

  // Get 5 random questions
  const questions = useMemo(() => {
    return getRandomElements(data?.data || [], 4);
  }, [data?.data]);

  return (
    <section
      className={cn(
        'w-full px-10 pb-4 sm:pb-5 lg:pb-6 overflow-y-visible sm:overflow-y-auto no-scrollbar',
        className
      )}
      aria-label="Sample questions"
    >
      <Text variant="bodyBase" color="muted">
        Sample Questions:
      </Text>

      <div className="flex flex-col gap-2 items-start mt-2 sm:mt-2.5 lg:mt-3">
        {isLoading && (
          <div className="flex items-center gap-2">
            <Spinner size="sm" />
            <Text variant="bodyBase" color="muted">
              Loading sample questions...
            </Text>
          </div>
        )}

        {isError && (
          <Text variant="bodyBase" color="muted">
            Failed to load sample questions.
          </Text>
        )}

        {!isLoading &&
          !isError &&
          questions.map((text, idx) => (
            <Button
              key={`${idx}-${text}`}
              variant="flat"
              radius="md"
              size="md"
              className={cn(
                '!w-auto max-w-full group transition-colors duration-200',
                'h-auto !min-h-10 py-2'
              )}
              endContent={
                <Icons.ChevronRight
                  className="
                    w-4 h-4 flex-shrink-0
                    opacity-0
                    transition-opacity duration-200
                    group-data-[hover=true]:opacity-100
                    group-data-[hover=true]:text-secondary
                  "
                />
              }
              onPress={() => onQuestionClick?.(text)}
            >
              <Text
                as="span"
                variant="bodyBase"
                color="muted"
                className="transition-colors duration-200 group-data-[hover=true]:text-secondary text-left whitespace-normal break-words"
              >
                {text}
              </Text>
            </Button>
          ))}
      </div>
    </section>
  );
}
