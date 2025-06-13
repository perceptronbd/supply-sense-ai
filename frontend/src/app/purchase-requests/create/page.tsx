'use client';

import AuthGuard from '@/components/AuthGuard';
import { PurchaseRequestForm } from '@/components/purchase-request/PurchaseRequestForm';
import { type PurchaseRequest } from '@/store/api/purchaseRequestApi';
import { useRouter } from 'next/navigation';

export default function CreatePurchaseRequestPage() {
  const router = useRouter();

  const handleSuccess = (purchaseRequest: PurchaseRequest) => {
    // Navigate to the newly created purchase request's detail page
    router.push(`/purchase-requests/${purchaseRequest.id}`);
  };

  return (
    <AuthGuard requireAuth={true}>
      <PurchaseRequestForm mode="create" onSuccess={handleSuccess} />
    </AuthGuard>
  );
}
