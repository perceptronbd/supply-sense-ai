import { Button } from '@/components/ui/Button';
import LogoSupplySense from '@/components/ui/LogoSupplySense';
import { Text } from '@/components/ui/Text';
import { Icons } from '@/lib/icons/Icons';
import { Select, SelectItem } from '@heroui/react';
import type { SharedSelection } from '@heroui/react';
import { useState } from 'react';

export const animals = [
  { key: 'branch', label: 'Branch' },
  { key: 'category', label: 'Category' },
  { key: 'customer', label: 'Customer' },
  { key: 'customer_group', label: 'Customer Group' },
  { key: 'customer_segment', label: 'Customer Segment' },
  { key: 'item', label: 'Item' },
  { key: 'item_group', label: 'Item Group' },
  { key: 'location', label: 'Location' },
  { key: 'location_group', label: 'Location Group' },
  { key: 'order', label: 'Order' },
  { key: 'order_item', label: 'Order Item' },
  { key: 'product', label: 'Product' },
  { key: 'product_group', label: 'Product Group' },
];

const TableDiscoverySelection = () => {
  const [values, setValues] = useState<SharedSelection>(new Set([]) as unknown as SharedSelection);
  // Function to handle selection changes
  const handleSelectChange = (selectedKeys: SharedSelection) => {
    setValues(selectedKeys);
  };

  // Remove a selected value when clicking X
  const handleRemove = (value: string) => {
    setValues((prev) => {
      const updated = new Set(Array.from(prev));
      updated.delete(value);
      return updated as SharedSelection;
    });
  };

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
      <div className="flex flex-col">
        <Button variant="light" color="default" className="text-default-500 mb-3 ms-auto w-fit">
          Confirm <Icons.ArrowRight className="size-4" />
        </Button>
        <div className="w-[80%] ms-auto">
          <Select
            label="Label"
            variant="flat"
            placeholder="Select a table"
            selectionMode="multiple"
            selectedKeys={values}
            onSelectionChange={handleSelectChange}
          >
            {animals.map((animal) => (
              <SelectItem key={animal.key}>{animal.label}</SelectItem>
            ))}
          </Select>
          <div className="flex w-full flex-wrap gap-2 mt-2">
            {Array.from(values).map((value) => (
              <button
                key={value}
                type="button"
                className="flex items-center justify-center text-sm  gap-x-2 bg-default-400 rounded-md px-3 py-1"
                onClick={() => handleRemove(value as string)}
              >
                {value} <Icons.X className="size-4" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableDiscoverySelection;
