'use client';

import AuthGuard from '@/components/AuthGuard';
import { GoodsReceiptForm } from '@/components/goods-receipt';
import { type GoodsReceipt } from '@/store/api/goodsReceiptApi';
import { useRouter } from 'next/navigation';

export default function CreateGoodsReceiptPage() {
  const router = useRouter();

  const handleSuccess = (goodsReceipt: GoodsReceipt) => {
    // Navigate to the newly created goods receipt's detail page
    router.push(`/goods-receipts/${goodsReceipt.id}`);
  };

  return (
    <AuthGuard requireAuth={true}>
      <GoodsReceiptForm mode="create" onSuccess={handleSuccess} />
    </AuthGuard>
  );
}
