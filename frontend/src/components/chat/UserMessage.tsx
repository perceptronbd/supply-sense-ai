'use client';

import { Button, Card, CardBody } from '@heroui/react';
import { Text } from '@/components/ui/Text';
import { Icons } from '@/lib/icons/Icons';
import { cn } from '@/lib/utils';

interface UserMessageProps {
  content: string;
  copied: boolean;
  onCopy: () => void;
}

export function UserMessage({ content, copied, onCopy }: Readonly<UserMessageProps>) {
  return (
    <div className="group relative flex flex-col items-end">
      <Card
        shadow="none"
        className={cn(
          'bg-default-300 text-primary-foreground w-fit max-w-md transition-colors duration-200',
          'group-hover:bg-default-100 group-hover:text-default-700'
        )}
      >
        <CardBody className="overflow-x-clip p-3 min-w-0">
          <Text
            variant="bodySmall"
            color="inverse"
            className={cn(
              'whitespace-pre-wrap transition-colors duration-200',
              'group-hover:text-default-700'
            )}
          >
            {content}
          </Text>
        </CardBody>
      </Card>

      {/* Copy button on hover */}
      <Button
        isIconOnly
        variant="light"
        size="sm"
        aria-label={copied ? 'Copied' : 'Copy message'}
        onPress={onCopy}
        className={cn(
          'opacity-0 mt-1 transition-all duration-200',
          'group-hover:opacity-100 group-hover:text-default-700'
        )}
      >
        {copied ? <Icons.Check /> : <Icons.Copy />}
      </Button>
    </div>
  );
}
