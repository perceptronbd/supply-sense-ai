'use client';

import AuthGuard from '@/components/AuthGuard';
import { ItemForm } from '@/components/items/ItemForm';
import { type Item } from '@/store/api/itemApi';
import { useRouter } from 'next/navigation';

export default function CreateItemPage() {
  const router = useRouter();

  const handleSuccess = (item: Item) => {
    // Navigate to the newly created item's detail page
    router.push(`/items/${item.id}`);
  };

  return (
    <AuthGuard requireAuth={true}>
      <ItemForm mode="create" onSuccess={handleSuccess} />
    </AuthGuard>
  );
}
