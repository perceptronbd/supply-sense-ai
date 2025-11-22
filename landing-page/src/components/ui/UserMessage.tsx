'use client';

import { Button } from '@heroui/react';
import { memo } from 'react';
import { Icons } from '../icons/Icons';

interface UserMessageProps {
  content: string;
  onCopy: () => void;
  copied: boolean;
}

function UserMessageComponent({ content, onCopy, copied }: Readonly<UserMessageProps>) {
  return (
    <div className="group relative flex flex-col items-end">
      <div
        className="
            bg-default-300 text-primary-foreground 
            rounded-xl px-4 py-3 max-w-md w-fit 
            transition-colors duration-200 
            group-hover:bg-default-100 group-hover:text-default-700
          "
      >
        <p className="text-sm whitespace-pre-wrap">{content}</p>
      </div>

      {/* copy button on hover */}
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={onCopy}
        className="
            opacity-0 mt-1 transition-all duration-200 
            group-hover:opacity-100
          "
      >
        {copied ? <Icons.Check /> : <Icons.Copy />}
      </Button>
    </div>
  );
}

export const UserMessage = memo(UserMessageComponent);
export default UserMessage;
