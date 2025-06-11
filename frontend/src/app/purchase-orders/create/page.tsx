'use client';

import { useRouter } from 'next/navigation';
import AuthGuard from '../../../components/AuthGuard';
import { PurchaseOrderForm } from '../../../components/purchase-order/PurchaseOrderForm';
import { type PurchaseOrder } from '../../../store/api/purchaseOrderApi';

export default function CreatePurchaseOrderPage() {
  const router = useRouter();

  const handleSuccess = (purchaseOrder: PurchaseOrder) => {
    // Navigate to the newly created purchase order's detail page
    router.push(`/purchase-orders/${purchaseOrder.id}`);
  };

  return (
    <AuthGuard requireAuth={true}>
      <PurchaseOrderForm mode="create" onSuccess={handleSuccess} />
    </AuthGuard>
  );
}
