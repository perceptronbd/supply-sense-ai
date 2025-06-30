'use client';

import AuthGuard from '@/components/AuthGuard';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import { DrawingLogo } from '@/components/ui/DrawingLogo';
import { Text } from '@/components/ui/Text';
import {
  useCancelPurchaseOrderMutation,
  useClosePurchaseOrderMutation,
  useConfirmPurchaseOrderMutation,
  useDeletePurchaseOrderMutation,
  useGetPurchaseOrderQuery,
  useSendToSupplierMutation,
} from '@/store/api/purchaseOrderApi';
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
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';

interface PurchaseOrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface StatusActionButtonsProps {
  status: string;
  orderId: string;
  onWorkflowAction: (action: 'send' | 'confirm' | 'cancel' | 'close' | 'delete') => void;
  onEdit: () => void;
}

function StatusActionButtons({ status, onWorkflowAction, onEdit }: StatusActionButtonsProps) {
  switch (status) {
    case 'DRAFT':
      return (
        <>
          <Button color="secondary" variant="flat" onPress={onEdit}>
            Edit
          </Button>
          <Button color="warning" onPress={() => onWorkflowAction('send')}>
            Send to Supplier
          </Button>
          <Button color="danger" variant="flat" onPress={() => onWorkflowAction('delete')}>
            Delete
          </Button>
        </>
      );
    case 'SENT_TO_SUPPLIER':
      return (
        <>
          <Button color="success" onPress={() => onWorkflowAction('confirm')}>
            Confirm
          </Button>
          <Button color="danger" variant="flat" onPress={() => onWorkflowAction('cancel')}>
            Cancel
          </Button>
        </>
      );
    case 'CONFIRMED':
      return (
        <Button color="primary" onPress={() => onWorkflowAction('close')}>
          Close Order
        </Button>
      );
    default:
      return null;
  }
}

export default function PurchaseOrderDetailPage({ params }: PurchaseOrderDetailPageProps) {
  const router = useRouter();
  const { id } = use(params);

  const { data: purchaseOrder, isLoading, error } = useGetPurchaseOrderQuery(id);
  const [sendToSupplier] = useSendToSupplierMutation();
  const [confirmPurchaseOrder] = useConfirmPurchaseOrderMutation();
  const [cancelPurchaseOrder] = useCancelPurchaseOrderMutation();
  const [closePurchaseOrder] = useClosePurchaseOrderMutation();
  const [deletePurchaseOrder] = useDeletePurchaseOrderMutation();

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
  }>({
    isOpen: false,
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'success';
      case 'cancelled':
        return 'danger';
      case 'sent_to_supplier':
        return 'warning';
      case 'draft':
        return 'default';
      case 'closed':
        return 'primary';
      default:
        return 'secondary';
    }
  };

  const handleWorkflowAction = async (
    action: 'send' | 'confirm' | 'cancel' | 'close' | 'delete'
  ) => {
    try {
      if (action === 'delete') {
        setDeleteModal({ isOpen: true });
        return;
      }

      await executeWorkflowAction(action);
    } catch (error) {
      console.error(`Failed to ${action} purchase order:`, error);
    }
  };

  const executeWorkflowAction = async (action: 'send' | 'confirm' | 'cancel' | 'close') => {
    switch (action) {
      case 'send':
        await sendToSupplier(id).unwrap();
        break;
      case 'confirm':
        await confirmPurchaseOrder(id).unwrap();
        break;
      case 'cancel':
        await cancelPurchaseOrder(id).unwrap();
        break;
      case 'close':
        await closePurchaseOrder(id).unwrap();
        break;
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deletePurchaseOrder(id).unwrap();
      router.push('/purchase-orders');
    } catch (error) {
      console.error('Failed to delete purchase order:', error);
    }
  };

  if (isLoading) {
    return (
      <AuthGuard requireAuth={true}>
        <main className="p-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex justify-center items-center h-64">
              <DrawingLogo size={60} variant="primary" speed="fast" showFill={true} />
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
          <div className="mx-auto max-w-7xl">
            <div className="flex justify-center items-center h-64">
              <Text variant="bodyLarge" className="text-danger">
                Error loading purchase order or order not found
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
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <header className="flex justify-between items-center mb-6">
            <div>
              <Button variant="flat" color="default" onPress={() => router.back()} className="mb-4">
                ← Back
              </Button>
              <Text variant="headerSmall" weight="bold" className="text-foreground" as="h1">
                Purchase Order {purchaseOrder.poNumber}
              </Text>
              <Text variant="bodyBase" className="mt-2 text-default-500" as="p">
                View and manage purchase order details
              </Text>
            </div>
            <div className="flex gap-2">
              <StatusActionButtons
                status={purchaseOrder.status}
                orderId={id}
                onWorkflowAction={handleWorkflowAction}
                onEdit={() => router.push(`/purchase-orders/${id}/edit`)}
              />
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
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                    Status
                  </Text>
                  <Chip
                    color={getStatusColor(purchaseOrder.status)}
                    variant="flat"
                    className="mt-1"
                  >
                    {purchaseOrder.status.replace('_', ' ')}
                  </Chip>
                </div>
                <div>
                  <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                    Title
                  </Text>
                  <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                    {purchaseOrder.title || 'Untitled'}
                  </Text>
                </div>
                <div>
                  <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                    Expected Delivery Date
                  </Text>
                  <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                    {new Date(purchaseOrder.expectedDeliveryDate).toLocaleDateString()}
                  </Text>
                </div>
                <div>
                  <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                    Supplier
                  </Text>
                  <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                    {purchaseOrder.supplier.name}
                  </Text>
                </div>
                <div>
                  <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                    Branch
                  </Text>
                  <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                    {purchaseOrder.branch.name}
                  </Text>
                </div>
                <div>
                  <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                    Created By
                  </Text>
                  <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                    {purchaseOrder.createdBy.firstName} {purchaseOrder.createdBy.lastName}
                  </Text>
                </div>
                <div>
                  <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                    Total Amount
                  </Text>
                  <Text variant="bodyBase" className="mt-1 font-semibold text-foreground" as="p">
                    ${Number(purchaseOrder.totalAmount).toFixed(2)}
                  </Text>
                </div>
                {purchaseOrder.paymentTerms && (
                  <div>
                    <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                      Payment Terms
                    </Text>
                    <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                      {purchaseOrder.paymentTerms}
                    </Text>
                  </div>
                )}
                {purchaseOrder.deliveryTerms && (
                  <div>
                    <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                      Delivery Terms
                    </Text>
                    <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                      {purchaseOrder.deliveryTerms}
                    </Text>
                  </div>
                )}
                {purchaseOrder.notes && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                      Notes
                    </Text>
                    <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                      {purchaseOrder.notes}
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
                Items
              </Text>
            </CardHeader>
            <CardBody>
              <Table
                classNames={{
                  th: 'bg-default-200',
                  tr: 'hover:bg-default-200',
                }}
                aria-label="Purchase order items"
              >
                <TableHeader>
                  <TableColumn>ITEM</TableColumn>
                  <TableColumn>ORDERED QTY</TableColumn>
                  <TableColumn>RECEIVED QTY</TableColumn>
                  <TableColumn>UNIT PRICE</TableColumn>
                  <TableColumn>TOTAL</TableColumn>
                  <TableColumn>DELIVERY DATE</TableColumn>
                  <TableColumn>REMARKS</TableColumn>
                </TableHeader>
                <TableBody>
                  {purchaseOrder.items.map((item) => (
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
                      <TableCell>${Number(item.unitPrice).toFixed(2)}</TableCell>
                      <TableCell className="font-medium">
                        ${Number(item.totalAmount).toFixed(2)}
                      </TableCell>
                      <TableCell>{new Date(item.deliveryDate).toLocaleDateString()}</TableCell>
                      <TableCell>{item.remarks || '—'}</TableCell>
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
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                    Order Date
                  </Text>
                  <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                    {new Date(purchaseOrder.orderDate).toLocaleString()}
                  </Text>
                </div>
                <div>
                  <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                    Last Updated
                  </Text>
                  <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                    {new Date(purchaseOrder.updatedAt).toLocaleString()}
                  </Text>
                </div>
                {purchaseOrder.sentToSupplierAt && (
                  <div>
                    <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                      Sent to Supplier
                    </Text>
                    <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                      {new Date(purchaseOrder.sentToSupplierAt).toLocaleString()}
                    </Text>
                  </div>
                )}
                {purchaseOrder.confirmedAt && (
                  <div>
                    <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                      Confirmed
                    </Text>
                    <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                      {new Date(purchaseOrder.confirmedAt).toLocaleString()}
                    </Text>
                  </div>
                )}
                {purchaseOrder.cancelledAt && (
                  <div>
                    <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                      Cancelled
                    </Text>
                    <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                      {new Date(purchaseOrder.cancelledAt).toLocaleString()}
                    </Text>
                  </div>
                )}
                {purchaseOrder.closedAt && (
                  <div>
                    <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                      Closed
                    </Text>
                    <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                      {new Date(purchaseOrder.closedAt).toLocaleString()}
                    </Text>
                  </div>
                )}
                {purchaseOrder.purchaseRequest && (
                  <div>
                    <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                      Related Purchase Request
                    </Text>
                    <div className="mt-1">
                      <Button
                        variant="flat"
                        size="sm"
                        onPress={() =>
                          router.push(`/purchase-requests/${purchaseOrder.purchaseRequest?.id}`)
                        }
                      >
                        {purchaseOrder.purchaseRequest.prNumber}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={handleDeleteConfirm}
        title="Delete Purchase Order"
        message="Are you sure you want to delete this purchase order?"
        itemName={`PO #${purchaseOrder?.poNumber || ''}`}
      />
    </AuthGuard>
  );
}
