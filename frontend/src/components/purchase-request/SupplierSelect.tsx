'use client';

import { Text } from '@/components/ui/Text';
import { Select, SelectItem } from '@heroui/react';

interface Supplier {
  id: string;
  name: string;
  code: string;
  contactPerson?: string;
  isActive: boolean;
}

interface SupplierSelectProps {
  suppliers: Supplier[];
  isLoading: boolean;
  selectedSupplierId: string;
  onSelectionChange: (supplierId: string) => void;
}

export function SupplierSelect({
  suppliers,
  isLoading,
  selectedSupplierId,
  onSelectionChange,
}: SupplierSelectProps) {
  const activeSuppliers = suppliers.filter((supplier) => supplier.isActive);

  return (
    <>
      <Select
        label="Select Supplier"
        placeholder="Choose a supplier for this purchase order"
        isRequired
        variant="bordered"
        isLoading={isLoading}
        selectedKeys={selectedSupplierId ? new Set([selectedSupplierId]) : new Set()}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as string;
          onSelectionChange(selected || '');
        }}
        disallowEmptySelection={false}
        description="Select the supplier who will fulfill this purchase order"
      >
        {activeSuppliers.map((supplier) => (
          <SelectItem key={supplier.id} textValue={supplier.name}>
            <div className="flex flex-col">
              <span className="font-medium">{supplier.name}</span>
              <span className="text-sm opacity-60">Code: {supplier.code}</span>
              {supplier.contactPerson && (
                <span className="text-sm opacity-70">Contact: {supplier.contactPerson}</span>
              )}
            </div>
          </SelectItem>
        ))}
      </Select>

      {activeSuppliers.length === 0 && !isLoading && <NoSuppliersMessage />}
    </>
  );
}

function NoSuppliersMessage() {
  return (
    <section className="text-center py-4 text-default-500">
      <Text variant="bodyMedium" as="p">
        No active suppliers available.
      </Text>
      <Text variant="bodyXSmall" className="mt-1" as="p">
        Please add suppliers before creating purchase orders.
      </Text>
    </section>
  );
}
