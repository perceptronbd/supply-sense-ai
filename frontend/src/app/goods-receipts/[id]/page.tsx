'use client';

import AuthGuard from '@/components/AuthGuard';
import { DrawingLogo } from '@/components/ui/DrawingLogo';
import { Text } from '@/components/ui/Text';
import {
  useCancelGoodsReceiptMutation,
  useGetGoodsReceiptByIdQuery,
  usePostGoodsReceiptMutation,
} from '@/store/api/goodsReceiptApi';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  addToast,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

interface GoodsReceiptDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function GoodsReceiptDetailPage({ params }: GoodsReceiptDetailPageProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Unwrap the async params
  const { id } = use(params);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    data: goodsReceipt,
    isLoading,
    error,
    refetch,
  } = useGetGoodsReceiptByIdQuery(id, { skip: !isMounted });

  const [postGoodsReceipt] = usePostGoodsReceiptMutation();
  const [cancelGoodsReceipt] = useCancelGoodsReceiptMutation();

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'posted':
        return 'success';
      case 'cancelled':
        return 'danger';
      case 'draft':
        return 'default';
      default:
        return 'primary';
    }
  };
  const handleWorkflowAction = async (action: 'post' | 'cancel') => {
    try {
      switch (action) {
        case 'post':
          await postGoodsReceipt(id).unwrap();
          addToast({
            title: 'Success',
            description: 'Goods receipt posted successfully',
            color: 'success',
            variant: 'flat',
          });
          break;
        case 'cancel':
          await cancelGoodsReceipt(id).unwrap();
          addToast({
            title: 'Success',
            description: 'Goods receipt cancelled',
            color: 'warning',
            variant: 'flat',
          });
          break;
      }
      refetch();
    } catch (error) {
      console.error(`Failed to ${action} goods receipt:`, error);
      addToast({
        title: 'Error',
        description: `Failed to ${action} goods receipt. Please try again.`,
        color: 'danger',
        variant: 'flat',
      });
    }
  };

  const calculateTotalValue = (): number => {
    if (!goodsReceipt?.items) return 0;
    return goodsReceipt.items.reduce((total, item) => {
      const totalCost = item.totalCost ? Number.parseFloat(item.totalCost) : 0;
      return total + totalCost;
    }, 0);
  };

  if (!isMounted) {
    return (
      <AuthGuard requireAuth={true}>
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <DrawingLogo size={60} variant="primary" speed="fast" showFill={true} />
            </div>
          </div>
        </main>
      </AuthGuard>
    );
  }

  if (isLoading) {
    return (
      <AuthGuard requireAuth={true}>
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <Text variant="bodyLarge">Loading goods receipt...</Text>
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
              <Text variant="bodyLarge" className="text-danger">
                Error loading goods receipt or receipt not found
              </Text>
            </div>
          </div>
        </main>
      </AuthGuard>
    );
  }
  return (
    <AuthGuard requireAuth={true}>
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="flex justify-between items-center mb-6">
            <div>
              <Button variant="flat" color="default" onPress={() => router.back()} className="mb-4">
                ← Back
              </Button>
              <Text variant="headerSmall" weight="bold" className="text-foreground" as="h1">
                Goods Receipt {goodsReceipt.grNumber}
              </Text>
              <Text variant="bodyBase" className="text-default-500 mt-2" as="p">
                View and manage goods receipt details
              </Text>
            </div>
            <div className="flex gap-2">
              {goodsReceipt.status === 'DRAFT' && (
                <>
                  <Button
                    color="secondary"
                    variant="flat"
                    onPress={() => router.push(`/goods-receipts/${id}/edit`)}
                  >
                    Edit
                  </Button>
                  <Button
                    color="danger"
                    variant="flat"
                    onPress={() => handleWorkflowAction('cancel')}
                  >
                    Cancel
                  </Button>
                  <Button color="success" onPress={() => handleWorkflowAction('post')}>
                    Post Receipt
                  </Button>
                </>
              )}
            </div>
          </header>

          {/* Basic Information */}
          <Card className="mb-6">
            <CardHeader>
              <Text variant="titleLarge" weight="semiBold" as="h2">
                Basic Information
              </Text>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                    Status
                  </Text>
                  <Chip color={getStatusColor(goodsReceipt.status)} variant="flat" className="mt-1">
                    {goodsReceipt.status}
                  </Chip>
                </div>
                <div>
                  <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                    Receipt Date
                  </Text>
                  <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                    {new Date(goodsReceipt.receiptDate).toLocaleDateString()}
                  </Text>
                </div>
                <div>
                  <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                    Document Number
                  </Text>
                  <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                    {goodsReceipt.documentNumber || '—'}
                  </Text>
                </div>
                <div>
                  <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                    Branch
                  </Text>
                  <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                    {goodsReceipt.branch.name}
                  </Text>
                </div>
                <div>
                  <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                    Received By
                  </Text>
                  <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                    {goodsReceipt.receivedBy.firstName} {goodsReceipt.receivedBy.lastName}
                  </Text>
                </div>
                <div>
                  <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                    Total Items
                  </Text>
                  <Text variant="bodyBase" className="mt-1 text-foreground font-semibold" as="p">
                    {goodsReceipt.items.length}
                  </Text>
                </div>
                <div>
                  <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                    Total Value
                  </Text>
                  <Text variant="bodyBase" className="mt-1 text-foreground font-semibold" as="p">
                    ${calculateTotalValue().toFixed(2)}
                  </Text>
                </div>
                {goodsReceipt.purchaseOrder && (
                  <div>
                    <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                      Source Purchase Order
                    </Text>
                    <div className="mt-1">
                      <Button
                        variant="flat"
                        size="sm"
                        onPress={() =>
                          router.push(`/purchase-orders/${goodsReceipt.purchaseOrder?.id}`)
                        }
                      >
                        {goodsReceipt.purchaseOrder.poNumber}
                      </Button>
                    </div>
                  </div>
                )}
                {goodsReceipt.materialRequisition && (
                  <div>
                    <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                      Source Material Requisition
                    </Text>
                    <div className="mt-1">
                      <Button
                        variant="flat"
                        size="sm"
                        onPress={() =>
                          router.push(
                            `/material-requisitions/${goodsReceipt.materialRequisition?.id}`
                          )
                        }
                      >
                        {goodsReceipt.materialRequisition.mrNumber}
                      </Button>
                    </div>
                  </div>
                )}
                {goodsReceipt.purchaseOrder?.supplier && (
                  <div>
                    <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                      Supplier
                    </Text>
                    <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                      {goodsReceipt.purchaseOrder.supplier.name}
                    </Text>
                  </div>
                )}
                {goodsReceipt.remarks && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                      Remarks
                    </Text>
                    <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                      {goodsReceipt.remarks}
                    </Text>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <Text variant="titleLarge" weight="semiBold" as="h2">
                Received Items
              </Text>
            </CardHeader>
            <CardBody>
              <Table
                classNames={{
                  th: 'bg-default-200',
                  tr: 'hover:bg-default-200',
                }}
                aria-label="Goods receipt items"
              >
                <TableHeader>
                  <TableColumn>ITEM</TableColumn>
                  <TableColumn>ORDERED QTY</TableColumn>
                  <TableColumn>RECEIVED QTY</TableColumn>
                  <TableColumn>UNIT PRICE</TableColumn>
                  <TableColumn>TOTAL COST</TableColumn>
                  <TableColumn>QUALITY NOTES</TableColumn>
                </TableHeader>
                <TableBody>
                  {goodsReceipt.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <Text variant="bodyBase" weight="medium" as="p">
                            {item.item.name}
                          </Text>
                          <Text variant="bodySmall" className="text-default-500" as="p">
                            {item.item.code}
                          </Text>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.orderedQty} {item.item.unit}
                      </TableCell>
                      <TableCell>
                        {item.receivedQty} {item.item.unit}
                      </TableCell>
                      <TableCell>
                        {item.unitPrice ? `$${Number.parseFloat(item.unitPrice).toFixed(2)}` : '—'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.totalCost ? `$${Number.parseFloat(item.totalCost).toFixed(2)}` : '—'}
                      </TableCell>
                      <TableCell>{item.qualityNotes || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>

          {/* Metadata */}
          <Card className="mt-6">
            <CardHeader>
              <Text variant="titleLarge" weight="semiBold" as="h2">
                Metadata
              </Text>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                    Created At
                  </Text>
                  <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                    {new Date(goodsReceipt.createdAt).toLocaleString()}
                  </Text>
                </div>
                <div>
                  <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                    Last Updated
                  </Text>
                  <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                    {new Date(goodsReceipt.updatedAt).toLocaleString()}
                  </Text>
                </div>{' '}
                {goodsReceipt.postedAt && (
                  <div>
                    <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                      Posted At
                    </Text>
                    <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                      {new Date(goodsReceipt.postedAt).toLocaleString()}
                    </Text>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </main>
    </AuthGuard>
  );
}
