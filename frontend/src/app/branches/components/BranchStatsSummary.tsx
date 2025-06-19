import { Text } from '@/components/ui/Text';
import type { Branch } from '@/store/api/branchApi';
import { Chip } from '@heroui/react';

interface BranchStatsSummaryProps {
  branches: Branch[];
  totalFromPagination?: number;
}

export function BranchStatsSummary({ branches, totalFromPagination }: BranchStatsSummaryProps) {
  const total = totalFromPagination || branches.length;
  const activeCount = branches.filter((branch) => branch.isActive).length;
  const inactiveCount = branches.filter((branch) => !branch.isActive).length;

  return (
    <div className="flex flex-wrap gap-2 justify-end">
      <Chip
        color="primary"
        variant="flat"
        size="sm"
        startContent={<div className="bg-primary rounded-full w-1.5 h-1.5" />}
      >
        Total: {total}
      </Chip>
      <Chip
        color="success"
        variant="flat"
        size="sm"
        startContent={<div className="bg-success rounded-full w-1.5 h-1.5" />}
      >
        Active: {activeCount}
      </Chip>
      <Chip
        color="default"
        variant="flat"
        size="sm"
        startContent={<div className="bg-default-500 rounded-full w-1.5 h-1.5" />}
      >
        Inactive: {inactiveCount}
      </Chip>
    </div>
  );
}
