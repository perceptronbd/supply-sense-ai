'use client';

import AuthGuard from '@/components/AuthGuard';
import { GoodsReceiptForm } from '@/components/goods-receipt';
import { Text } from '@/components/ui/Text';
import { type GoodsReceipt, useGetGoodsReceiptByIdQuery } from '@/store/api/goodsReceiptApi';
import { useRouter } from 'next/navigation';
import { use } from 'react';

interface EditGoodsReceiptPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditGoodsReceiptPage({ params }: EditGoodsReceiptPageProps) {
  const router = useRouter();
  const { id } = use(params);

  const { data: goodsReceipt, isLoading, error } = useGetGoodsReceiptByIdQuery(id);

  const handleSuccess = (goodsReceipt: GoodsReceipt) => {
    // Navigate back to the goods receipt's detail page
    router.push(`/goods-receipts/${goodsReceipt.id}`);
  };

  if (isLoading) {
    return (
      <AuthGuard requireAuth={true}>
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <Text variant="bodyLarge" as="p">
                Loading goods receipt...
              </Text>
            </div>
          </div>
        </main>
      </AuthGuard>
    );
  }

  if (error || !goodsReceipt) {
    return (
      <AuthGuard requireAuth={true}>
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <Text variant="bodyLarge" className="text-danger" as="p">
                Error loading goods receipt
              </Text>
            </div>
          </div>
        </main>
      </AuthGuard>
    );
  }
  // Transform goods receipt data to form data format
  const initialData = {
    receiptDate: goodsReceipt.receiptDate.split('T')[0], // Convert to date string
    documentNumber: goodsReceipt.documentNumber || '',
    branchId: goodsReceipt.branchId,
    remarks: goodsReceipt.remarks || '',
    items: goodsReceipt.items.map((item) => ({
      itemId: item.itemId,
      orderedQty: Number(item.orderedQty),
      receivedQty: Number(item.receivedQty),
      unitPrice: item.unitPrice ? Number.parseFloat(item.unitPrice) : undefined,
      qualityNotes: item.qualityNotes || '',
    })),
  };

  return (
    <AuthGuard requireAuth={true}>
      <GoodsReceiptForm id={id} mode="edit" initialData={initialData} onSuccess={handleSuccess} />
    </AuthGuard>
  );
}
