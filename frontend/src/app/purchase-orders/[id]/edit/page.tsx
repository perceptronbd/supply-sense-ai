'use client';

import AuthGuard from '@/components/AuthGuard';
import { PurchaseOrderForm } from '@/components/purchase-order/PurchaseOrderForm';
import { Text } from '@/components/ui/Text';
import { type PurchaseOrder, useGetPurchaseOrderQuery } from '@/store/api/purchaseOrderApi';
import { useRouter } from 'next/navigation';
import { use } from 'react';

interface EditPurchaseOrderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditPurchaseOrderPage({ params }: EditPurchaseOrderPageProps) {
  const router = useRouter();
  const { id } = use(params);

  const { data: purchaseOrder, isLoading, error } = useGetPurchaseOrderQuery(id);

  const handleSuccess = (purchaseOrder: PurchaseOrder) => {
    // Navigate back to the purchase order's detail page
    router.push(`/purchase-orders/${purchaseOrder.id}`);
  };

  if (isLoading) {
    return (
      <AuthGuard requireAuth={true}>
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <Text variant="bodyLarge" as="p">
                Loading purchase order...
              </Text>
            </div>
          </div>
        </main>
      </AuthGuard>
    );
  }

  if (error || !purchaseOrder) {
    return (
      <AuthGuard requireAuth={true}>
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <Text variant="bodyLarge" className="text-danger" as="p">
                Error loading purchase order or order not found
              </Text>
            </div>
          </div>
        </main>
      </AuthGuard>
    );
  }

  // Only allow editing if the order is in DRAFT status
  if (purchaseOrder.status !== 'DRAFT') {
    return (
      <AuthGuard requireAuth={true}>
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <Text variant="bodyLarge" className="text-warning" as="p">
                This purchase order cannot be edited because it is in {purchaseOrder.status} status.
                Only DRAFT orders can be edited.
              </Text>
            </div>
          </div>
        </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <PurchaseOrderForm
        id={id}
        mode="edit"
        initialData={{
          title: purchaseOrder.title || '',
          prId: purchaseOrder.prId || '',
          supplierId: purchaseOrder.supplierId,
          expectedDeliveryDate: purchaseOrder.expectedDeliveryDate,
          paymentTerms: purchaseOrder.paymentTerms || '',
          deliveryTerms: purchaseOrder.deliveryTerms || '',
          branchId: purchaseOrder.branch.id,
          notes: purchaseOrder.notes || '',
          items:
            purchaseOrder.items?.map((item) => ({
              itemId: item.itemId,
              orderedQty: item.orderedQty,
              unitPrice: item.unitPrice,
              deliveryDate: item.deliveryDate,
              remarks: item.remarks || '',
            })) || [],
        }}
        onSuccess={handleSuccess}
      />
    </AuthGuard>
  );
}
