'use client';

import AuthGuard from '@/components/AuthGuard';
import { ItemForm } from '@/components/items/ItemForm';
import { Text } from '@/components/ui/Text';
import { usePermissions } from '@/hooks/usePermissions';
import { type Item, useGetItemQuery } from '@/store/api/itemApi';
import { ITEM_PERMISSIONS } from '@supplysense/types';
import { useRouter } from 'next/navigation';
import { use } from 'react';

interface EditItemPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditItemPage({ params }: EditItemPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { hasPermission } = usePermissions();

  const {
    data: item,
    isLoading,
    error,
  } = useGetItemQuery({
    id,
    includeStock: true,
  });

  const handleSuccess = (item: Item) => {
    // Navigate back to the item's detail page
    router.push(`/items/${item.id}`);
  };

  if (isLoading) {
    return (
      <AuthGuard requireAuth={true}>
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <Text variant="bodyLarge" as="p">
                Loading item...
              </Text>
            </div>
          </div>
        </main>
      </AuthGuard>
    );
  }

  if (error || !item) {
    return (
      <AuthGuard requireAuth={true}>
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <Text variant="bodyLarge" className="text-danger" as="p">
                Error loading item or item not found
              </Text>
            </div>
          </div>
        </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      {!hasPermission(ITEM_PERMISSIONS.UPDATE) ? (
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <Text variant="bodyLarge" className="text-danger" as="p">
                You don't have permission to edit items
              </Text>
            </div>
          </div>
        </main>
      ) : (
        <ItemForm mode="edit" item={item} onSuccess={handleSuccess} />
      )}
    </AuthGuard>
  );
}
