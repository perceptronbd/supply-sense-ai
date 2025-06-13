'use client';

import { Text } from '@/components/ui/Text';

export function WhatHappensNextSection() {
  return (
    <section className="bg-default-50 p-4 rounded-lg">
      <Text variant="bodyBase" weight="medium" className="mb-2" as="h4">
        What happens next?
      </Text>
      <ul className="text-default-600 space-y-1">
        <li>
          <Text variant="bodySmall" as="span">
            • All items from the PR will be included in the PO
          </Text>
        </li>
        <li>
          <Text variant="bodySmall" as="span">
            • Quantities and estimated prices will be copied
          </Text>
        </li>
        <li>
          <Text variant="bodySmall" as="span">
            • The PR status will be updated to "Converted to PO"
          </Text>
        </li>
        <li>
          <Text variant="bodySmall" as="span">
            • You can edit the PO details after creation
          </Text>
        </li>
      </ul>
    </section>
  );
}
