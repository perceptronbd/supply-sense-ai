'use client';

import AuthGuard from '@/components/AuthGuard';
import { ItemForm } from '@/components/items/ItemForm';
import { Text } from '@/components/ui/Text';
import { usePermissions } from '@/hooks/usePermissions';
import { type Item } from '@/store/api/itemApi';
import { ITEM_PERMISSIONS } from '@supplysense/types';
import { useRouter } from 'next/navigation';

export default function CreateItemPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  const handleSuccess = (item: Item) => {
    // Navigate to the newly created item's detail page
    router.push(`/items/${item.id}`);
  };

  return (
    <AuthGuard requireAuth={true}>
      {!hasPermission(ITEM_PERMISSIONS.CREATE) ? (
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <Text variant="bodyLarge" className="text-danger" as="p">
                You don't have permission to create items
              </Text>
            </div>
          </div>
        </main>
      ) : (
        <ItemForm mode="create" onSuccess={handleSuccess} />
      )}
    </AuthGuard>
  );
}
