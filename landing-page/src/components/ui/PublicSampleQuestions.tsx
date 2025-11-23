'use client';

import { Button, Spinner } from '@heroui/react';
import { useEffect, useState } from 'react';
import { fetchPublicSampleQuestions } from '@/lib/api/publicSampleQuestions';
import { Icons } from '../icons/Icons';

interface PublicSampleQuestionsProps {
  onQuestionClick: (q: string) => void;
}

// Function to get random elements from an array
const getRandomElements = <T,>(array: T[], count: number): T[] => {
  if (!array || array.length <= count) return array || [];

  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export function PublicSampleQuestions({ onQuestionClick }: Readonly<PublicSampleQuestionsProps>) {
  const [questions, setQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    async function loadQuestions() {
      setIsLoading(true);
      setIsError(false);

      const res = await fetchPublicSampleQuestions();

      if (res.length === 0) {
        setQuestions([]);
      } else {
        // Get 4 random questions
        const randomQs = getRandomElements(res, 4);
        setQuestions(randomQs);
      }

      setIsLoading(false);
    }

    loadQuestions();
  }, []);

  if (isLoading) {
    return (
      <div className="px-4 pb-4 flex items-center gap-2">
        <Spinner size="sm" />
        <p className="text-base font-montserrat text-default-500">Loading sample questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <p className="px-4 pb-4 text-sm font-montserrat text-default-500">
        No sample questions available
      </p>
    );
  }

  if (isError) {
    return (
      <p className="px-4 pb-4 text-sm font-montserrat leading-medium text-danger">
        Failed to load sample questions
      </p>
    );
  }

  return (
    <div className="px-4 pb-4 backdrop-blur-none">
      <p className="text-base font-montserrat text-default-500">Sample Questions:</p>

      <div className="flex flex-col gap-2 mt-2">
        {questions.map((q) => (
          <Button
            key={q}
            variant="flat"
            radius="md"
            size="md"
            className="
              group
              h-auto py-3
              flex justify-between items-center
              !whitespace-normal !text-wrap !leading-relaxed
            "
            onPress={() => onQuestionClick(q)}
            endContent={
              <Icons.ChevronRight
                className="
                  w-4 h-4 flex-shrink-0
                  self-center
                  opacity-0
                  transition-opacity duration-200
                  group-data-[hover=true]:opacity-100
                  group-data-[hover=true]:text-secondary
                "
              />
            }
          >
            <span
              className="
                text-base font-montserrat text-default-500 text-left
                whitespace-normal leading-relaxed
                transition-colors duration-200
                group-data-[hover=true]:text-secondary
              "
            >
              {q}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
