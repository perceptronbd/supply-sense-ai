'use client';

import { useParams, useRouter } from 'next/navigation';
import AuthGuard from '../../../../components/AuthGuard';
import { PurchaseRequestForm } from '../../../../components/purchase-request/PurchaseRequestForm';
import {
  type PurchaseRequest,
  useGetPurchaseRequestQuery,
} from '../../../../store/api/purchaseRequestApi';

export default function EditPurchaseRequestPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: purchaseRequest, isLoading, error } = useGetPurchaseRequestQuery(id);

  const handleSuccess = (purchaseRequest: PurchaseRequest) => {
    // Navigate back to the purchase request's detail page
    router.push(`/purchase-requests/${purchaseRequest.id}`);
  };

  if (isLoading) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <div className="text-lg">Loading purchase request...</div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error || !purchaseRequest) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-red-600">
                Error loading purchase request or request not found
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Only allow editing if the request is in DRAFT status
  if (purchaseRequest.status !== 'DRAFT') {
    return (
      <AuthGuard requireAuth={true}>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-yellow-600">
                This purchase request cannot be edited because it is in {purchaseRequest.status}{' '}
                status. Only DRAFT requests can be edited.
              </div>
            </div>
          </div>
        </div>
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
