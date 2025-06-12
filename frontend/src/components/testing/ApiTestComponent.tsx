'use client';

import { Card, CardBody, CardHeader } from '@heroui/react';
import { useGetAllBranchesQuery } from '../../store/api/branchApi';
import { useSearchItemsQuery } from '../../store/api/itemApi';

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
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">API Integration Test</h2>

      {/* Branch API Test */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Branch API Test</h3>
        </CardHeader>
        <CardBody>
          {branchesLoading && <p>Loading branches...</p>}
          {branchesError && (
            <p className="text-danger">Error loading branches: {JSON.stringify(branchesError)}</p>
          )}
          {branches && (
            <div>
              <p className="mb-2">Found {branches.length} branches:</p>
              <ul className="space-y-1">
                {branches.slice(0, 3).map((branch) => (
                  <li key={branch.id} className="text-sm">
                    {branch.code} - {branch.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Item API Test */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Item Search API Test</h3>
        </CardHeader>
        <CardBody>
          {itemsLoading && <p>Loading items...</p>}
          {itemsError && (
            <p className="text-danger">Error loading items: {JSON.stringify(itemsError)}</p>
          )}
          {items && (
            <div>
              <p className="mb-2">Found {items.length} items for "steel":</p>
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.id} className="text-sm">
                    {item.sku} - {item.name} ({item.mainUnit})
                    {item.stock && (
                      <span className="ml-2 text-default-500">
                        Stock: {item.stock.availableQty}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
