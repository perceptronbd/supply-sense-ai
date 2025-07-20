import { Button } from '@/components/ui/Button';
import LogoSupplySense from '@/components/ui/LogoSupplySense';
import { Text } from '@/components/ui/Text';
import { Icons } from '@/lib/icons/Icons';
import { Select, SelectItem } from '@heroui/react';

export const animals = [
  { key: 'branch', label: 'Branch' },
  { key: 'category', label: 'Category' },
  { key: 'customer', label: 'Customer' },
];

const TableDiscoverySelection = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 flex-grow">
      {/* left side info  */}
      <div className="mt-[13%]">
        <LogoSupplySense />
        <Text variant="headerMedium" color="secondary" weight={'bold'} className="mt-[8%] xl:mt-12">
          Select The
          <Text as="span" variant={'headerMedium'} weight={'bold'} color="primary" className="ml-2">
            Tables You Care About
          </Text>
        </Text>
        <Text variant={'bodyMedium'} weight={'medium'} className="mt-4">
          To set things up quickly, select the tables that you need the most initially and provide
          appropriate context.
        </Text>
        <Text style={{ fontStyle: 'italic' }} color="secondary" className="mt-2">
          We don’t train on your data.
        </Text>
      </div>
      {/* right side form */}
      <div className="flex flex-col items-end">
        <Button variant="light" color="default" className="text-default-500 mb-3">
          Confirm <Icons.ArrowRight className="size-4" />
        </Button>
        <Select
          className="xl:w-4/5"
          label="Label"
          variant="flat"
          placeholder="Select a table"
          selectionMode="multiple"
        >
          {animals.map((animal) => (
            <SelectItem key={animal.key}>{animal.label}</SelectItem>
          ))}
        </Select>
      </div>
    </div>
  );
};

export default TableDiscoverySelection;
