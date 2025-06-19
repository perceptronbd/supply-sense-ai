import { Text } from '@/components/ui/Text';
import { Button } from '@heroui/react';

interface BranchesHeaderProps {
  onCreateBranch: () => void;
}

export function BranchesHeader({ onCreateBranch }: BranchesHeaderProps) {
  return (
    <header className="flex justify-between items-center mb-6">
      <div>
        <Text variant="headerSmall" weight="bold" color="default" as="h1">
          Branches
        </Text>
        <Text variant="bodyBase" color="muted" className="mt-2" as="p">
          Manage company branches and locations
        </Text>
      </div>
      <Button
        color="primary"
        onPress={onCreateBranch}
        startContent={
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        }
      >
        Add Branch
      </Button>
    </header>
  );
}
