'use client';

import AuthGuard from '@/components/AuthGuard';
import { PurchaseRequestForm } from '@/components/purchase-request/PurchaseRequestForm';
import { Text } from '@/components/ui/Text';
import { type PurchaseRequest, useGetPurchaseRequestQuery } from '@/store/api/purchaseRequestApi';
import { useRouter } from 'next/navigation';
import { use } from 'react';

interface EditPurchaseRequestPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditPurchaseRequestPage({ params }: EditPurchaseRequestPageProps) {
  const router = useRouter();
  const { id } = use(params);

  const { data: purchaseRequest, isLoading, error } = useGetPurchaseRequestQuery(id);

  const handleSuccess = (purchaseRequest: PurchaseRequest) => {
    // Navigate back to the purchase request's detail page
    router.push(`/purchase-requests/${purchaseRequest.id}`);
  };

  if (isLoading) {
    return (
      <AuthGuard requireAuth={true}>
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <Text variant="bodyLarge" as="p">
                Loading purchase request...
              </Text>
            </div>
          </div>
        </main>
      </AuthGuard>
    );
  }

  if (error || !purchaseRequest) {
    return (
      <AuthGuard requireAuth={true}>
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <Text variant="bodyLarge" className="text-danger" as="p">
                Error loading purchase request or request not found
              </Text>
            </div>
          </div>
        </main>
      </AuthGuard>
    );
  }

  // Only allow editing if the request is in DRAFT status
  if (purchaseRequest.status !== 'DRAFT') {
    return (
      <AuthGuard requireAuth={true}>
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <Text variant="bodyLarge" className="text-warning" as="p">
                This purchase request cannot be edited because it is in {purchaseRequest.status}{' '}
                status. Only DRAFT requests can be edited.
              </Text>
            </div>
          </div>
        </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <PurchaseRequestForm
        id={id}
        mode="edit"
        initialData={{
          title: purchaseRequest.title || '',
          description: purchaseRequest.description || '',
          requiredDate: purchaseRequest.requiredDate,
          branchId: purchaseRequest.branchId,
          justification: purchaseRequest.justification || '',
          items:
            purchaseRequest.items?.map((item) => ({
              itemId: item.itemId,
              requestedQty: item.requestedQty,
              estimatedPrice: item.estimatedPrice || undefined,
              requiredDate: item.requiredDate,
              remarks: item.remarks || '',
            })) || [],
        }}
        onSuccess={handleSuccess}
      />
    </AuthGuard>
  );
}
