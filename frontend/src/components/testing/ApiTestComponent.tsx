'use client';

import { Text } from '@/components/ui/Text';
import { useGetAllBranchesQuery } from '@/store/api/branchApi';
import { useSearchItemsQuery } from '@/store/api/itemApi';
import { Card, CardBody, CardHeader } from '@heroui/react';

export function ApiTestComponent() {
  // Test branch API
  const {
    data: branches,
    isLoading: branchesLoading,
    error: branchesError,
  } = useGetAllBranchesQuery(undefined);

  // Test item search API
  const {
    data: items,
    isLoading: itemsLoading,
    error: itemsError,
  } = useSearchItemsQuery({ q: 'steel', limit: 5 }, { skip: false });

  return (
    <section className="space-y-6 p-6">
      <header>
        <Text variant="headerMedium" weight="bold" as="h2">
          API Integration Test
        </Text>
      </header>

      {/* Branch API Test */}
      <Card>
        <CardHeader>
          <Text variant="titleMedium" weight="semiBold" as="h3">
            Branch API Test
          </Text>
        </CardHeader>
        <CardBody>
          {branchesLoading && (
            <Text variant="bodyBase" as="p">
              Loading branches...
            </Text>
          )}
          {branchesError && (
            <Text variant="bodyBase" color="danger" as="p">
              Error loading branches: {JSON.stringify(branchesError)}
            </Text>
          )}
          {branches && (
            <article>
              <Text variant="bodyBase" className="mb-2" as="p">
                Found {branches.length} branches:
              </Text>
              <ul className="space-y-1">
                {branches.slice(0, 3).map((branch) => (
                  <li key={branch.id}>
                    <Text variant="bodySmall" as="span">
                      {branch.code} - {branch.name}
                    </Text>
                  </li>
                ))}
              </ul>
            </article>
          )}
        </CardBody>
      </Card>

      {/* Item API Test */}
      <Card>
        <CardHeader>
          <Text variant="titleMedium" weight="semiBold" as="h3">
            Item Search API Test
          </Text>
        </CardHeader>
        <CardBody>
          {itemsLoading && (
            <Text variant="bodyBase" as="p">
              Loading items...
            </Text>
          )}
          {itemsError && (
            <Text variant="bodyBase" color="danger" as="p">
              Error loading items: {JSON.stringify(itemsError)}
            </Text>
          )}
          {items && (
            <article>
              <Text variant="bodyBase" className="mb-2" as="p">
                Found {items.length} items for "steel":
              </Text>
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.id}>
                    <Text variant="bodySmall" as="span">
                      {item.sku} - {item.name} ({item.mainUnit})
                      {item.stock && (
                        <Text variant="bodySmall" color="muted" className="ml-2" as="span">
                          {' '}
                          Stock: {item.stock.availableQty}
                        </Text>
                      )}
                    </Text>
                  </li>
                ))}
              </ul>
            </article>
          )}
        </CardBody>
      </Card>
    </section>
  );
}
