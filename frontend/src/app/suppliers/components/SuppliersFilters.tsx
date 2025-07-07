import { SearchIcon } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import { Checkbox, Chip, Input } from '@heroui/react';

interface SuppliersFiltersProps {
  searchTerm: string;
  includeInactive: boolean;
  onSearchChange: (value: string) => void;
  onIncludeInactiveChange: (checked: boolean) => void;
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
}

export function SuppliersFilters({
  searchTerm,
  includeInactive,
  onSearchChange,
  onIncludeInactiveChange,
  totalCount,
  activeCount,
  inactiveCount,
}: SuppliersFiltersProps) {
  return (
    <>
      <div className="flex items-center justify-between w-full">
        <Text variant="titleSmall" weight="semiBold" as="h2">
          All Suppliers
        </Text>
        {/* Status Summary Chips */}
        <div className="flex flex-wrap justify-end gap-2">
          <Chip
            color="primary"
            variant="flat"
            size="sm"
            startContent={<div className="bg-primary rounded-full w-1.5 h-1.5" />}
          >
            Total: {totalCount}
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
      </div>
      {/* Search and Filters */}
      <div className="flex flex-col justify-start w-full gap-4 sm:flex-row">
        <Input
          placeholder="Search suppliers by name, code, or contact person..."
          value={searchTerm}
          onValueChange={onSearchChange}
          startContent={<SearchIcon className="w-4 h-4 text-default-400" />}
          className="w-full sm:w-96"
          variant="bordered"
        />
        <div className="flex items-center gap-4">
          <Checkbox isSelected={includeInactive} onValueChange={onIncludeInactiveChange} size="sm">
            Include inactive
          </Checkbox>
        </div>
      </div>
    </>
  );
}
