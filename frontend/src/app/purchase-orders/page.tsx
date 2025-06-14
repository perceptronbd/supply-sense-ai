'use client';

import AuthGuard from '@/components/AuthGuard';
import {
  CheckCircleIcon,
  CheckIcon,
  DotsVerticalIcon,
  EditIcon,
  EyeIcon,
  ReceiptIcon,
  SendIcon,
  XMarkIcon,
} from '@/components/icons';
import { Text } from '@/components/ui/Text';
import { useCreateGoodsReceiptFromPOMutation } from '@/store/api/goodsReceiptApi';
import {
  type PurchaseOrder,
  useCancelPurchaseOrderMutation,
  useClosePurchaseOrderMutation,
  useConfirmPurchaseOrderMutation,
  useGetPurchaseOrdersQuery,
  useSendToSupplierMutation,
} from '@/store/api/purchaseOrderApi';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Pagination,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  addToast,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Ensure component is mounted before rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // API hooks
  const {
    data: purchaseOrders = [],
    isLoading,
    error,
    refetch,
  } = useGetPurchaseOrdersQuery({}, { skip: !isMounted });
  const [sendToSupplier] = useSendToSupplierMutation();
  const [confirmPurchaseOrder] = useConfirmPurchaseOrderMutation();
  const [cancelPurchaseOrder] = useCancelPurchaseOrderMutation();
  const [closePurchaseOrder] = useClosePurchaseOrderMutation();
  const [createGoodsReceiptFromPO] = useCreateGoodsReceiptFromPOMutation();

  // Pagination calculations
  const totalPages = Math.ceil(purchaseOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = purchaseOrders.slice(startIndex, endIndex);

  // Reset to last valid page if current page is out of bounds
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Don't render anything until mounted
  if (!isMounted) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <Text variant="bodyLarge">Loading...</Text>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

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

  const handleCreateOrder = () => {
    router.push('/purchase-orders/create');
  };

  const handleEditOrder = (order: PurchaseOrder) => {
    router.push(`/purchase-orders/${order.id}/edit`);
  };

  const getDropdownItems = (order: PurchaseOrder) => {
    const items = [
      <DropdownItem key="view" startContent={<EyeIcon />}>
        View Details
      </DropdownItem>,
    ];

    if (order.status === 'DRAFT') {
      items.push(
        <DropdownItem key="edit" startContent={<EditIcon />}>
          Edit Order
        </DropdownItem>,
        <DropdownItem key="send" color="warning" startContent={<SendIcon />}>
          Send to Supplier
        </DropdownItem>
      );
    }

    if (order.status === 'SENT_TO_SUPPLIER') {
      items.push(
        <DropdownItem key="confirm" color="success" startContent={<CheckIcon />}>
          Confirm Order
        </DropdownItem>,
        <DropdownItem key="cancel" color="danger" startContent={<XMarkIcon />}>
          Cancel Order
        </DropdownItem>
      );
    }

    if (order.status === 'CONFIRMED') {
      items.push(
        <DropdownItem key="createGR" color="primary" startContent={<ReceiptIcon />}>
          Create Goods Receipt
        </DropdownItem>,
        <DropdownItem key="close" color="success" startContent={<CheckCircleIcon />}>
          Close Order
        </DropdownItem>
      );
    }

    return items;
  };

  const handleWorkflowAction = async (
    action: 'send' | 'confirm' | 'cancel' | 'close' | 'createGR',
    orderId: string
  ) => {
    try {
      switch (action) {
        case 'send':
          await sendToSupplier(orderId).unwrap();
          addToast({
            title: 'Success',
            description: 'Purchase order sent to supplier',
            color: 'success',
            variant: 'flat',
          });
          break;
        case 'confirm':
          await confirmPurchaseOrder(orderId).unwrap();
          addToast({
            title: 'Success',
            description: 'Purchase order confirmed successfully',
            color: 'success',
            variant: 'flat',
          });
          break;
        case 'cancel':
          await cancelPurchaseOrder(orderId).unwrap();
          addToast({
            title: 'Success',
            description: 'Purchase order cancelled',
            color: 'warning',
            variant: 'flat',
          });
          break;
        case 'close':
          await closePurchaseOrder(orderId).unwrap();
          addToast({
            title: 'Success',
            description: 'Purchase order closed successfully',
            color: 'success',
            variant: 'flat',
          });
          break;
        case 'createGR': {
          const goodsReceipt = await createGoodsReceiptFromPO(orderId).unwrap();
          addToast({
            title: 'Success',
            description: 'Goods receipt created successfully',
            color: 'success',
            variant: 'flat',
          });
          // Navigate to the new goods receipt
          router.push(`/goods-receipts/${goodsReceipt.id}`);
          break;
        }
      }
      refetch();
    } catch (error) {
      console.error(`Failed to ${action} purchase order:`, error);
      addToast({
        title: 'Error',
        description: `Failed to ${action} purchase order. Please try again.`,
        color: 'danger',
        variant: 'flat',
      });
    }
  };

  if (isLoading) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <Text variant="bodyLarge">Loading purchase orders...</Text>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <Text variant="bodyLarge" className="text-danger">
                Error loading purchase orders
              </Text>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <header className="flex justify-between items-center mb-6">
            <div>
              <Text variant="headerSmall" weight="bold" className="text-foreground" as="h1">
                Purchase Orders
              </Text>
              <Text variant="bodyBase" className="text-default-500 mt-2" as="p">
                Track and manage all purchase orders
              </Text>
            </div>
            <Button color="primary" onPress={handleCreateOrder}>
              Create New Order
            </Button>
          </header>

          <section>
            <Card>
              <CardHeader className="pb-3 flex flex-col gap-4">
                <div className="flex justify-between items-center w-full">
                  <Text variant="titleSmall" weight="semiBold">
                    All Purchase Orders
                  </Text>
                  {/* Status Summary Chips moved to the right */}
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Chip
                      color="primary"
                      variant="flat"
                      size="sm"
                      startContent={<div className="bg-primary rounded-full w-1.5 h-1.5" />}
                    >
                      Total: {purchaseOrders.length}
                    </Chip>
                    <Chip
                      color="default"
                      variant="flat"
                      size="sm"
                      startContent={<div className="bg-default-500 rounded-full w-1.5 h-1.5" />}
                    >
                      Draft: {purchaseOrders.filter((order) => order.status === 'DRAFT').length}
                    </Chip>
                    <Chip
                      color="warning"
                      variant="flat"
                      size="sm"
                      startContent={<div className="bg-warning rounded-full w-1.5 h-1.5" />}
                    >
                      Sent:{' '}
                      {purchaseOrders.filter((order) => order.status === 'SENT_TO_SUPPLIER').length}
                    </Chip>
                    <Chip
                      color="success"
                      variant="flat"
                      size="sm"
                      startContent={<div className="bg-success rounded-full w-1.5 h-1.5" />}
                    >
                      Confirmed:{' '}
                      {purchaseOrders.filter((order) => order.status === 'CONFIRMED').length}
                    </Chip>
                    <Chip
                      color="danger"
                      variant="flat"
                      size="sm"
                      startContent={<div className="bg-danger rounded-full w-1.5 h-1.5" />}
                    >
                      Cancelled:{' '}
                      {purchaseOrders.filter((order) => order.status === 'CANCELLED').length}
                    </Chip>
                    <Chip
                      color="primary"
                      variant="flat"
                      size="sm"
                      startContent={<div className="bg-primary rounded-full w-1.5 h-1.5" />}
                    >
                      Closed: {purchaseOrders.filter((order) => order.status === 'CLOSED').length}
                    </Chip>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <Table aria-label="Purchase orders table">
                  <TableHeader>
                    <TableColumn>ORDER ID</TableColumn>
                    <TableColumn>SUPPLIER</TableColumn>
                    <TableColumn>ORDER DATE</TableColumn>
                    <TableColumn>EXPECTED DELIVERY</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>TOTAL AMOUNT</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.poNumber}</TableCell>
                        <TableCell>{order.supplier.name}</TableCell>
                        <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {new Date(order.expectedDeliveryDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip color={getStatusColor(order.status)} variant="flat" size="sm">
                            {order.status.replace('_', ' ')}
                          </Chip>
                        </TableCell>
                        <TableCell className="font-medium">
                          ${Number(order.totalAmount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <Dropdown>
                              <DropdownTrigger>
                                <Button
                                  variant="light"
                                  size="sm"
                                  isIconOnly
                                  className="text-default-400 hover:text-default-600"
                                >
                                  <DotsVerticalIcon />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu
                                variant="flat"
                                onAction={(key) => {
                                  const action = key as string;
                                  if (action === 'view') {
                                    router.push(`/purchase-orders/${order.id}`);
                                  } else if (action === 'edit') {
                                    handleEditOrder(order);
                                  } else if (
                                    action === 'send' ||
                                    action === 'confirm' ||
                                    action === 'cancel' ||
                                    action === 'close' ||
                                    action === 'createGR'
                                  ) {
                                    handleWorkflowAction(
                                      action as
                                        | 'send'
                                        | 'confirm'
                                        | 'cancel'
                                        | 'close'
                                        | 'createGR',
                                      order.id
                                    );
                                  }
                                }}
                              >
                                {getDropdownItems(order)}
                              </DropdownMenu>
                            </Dropdown>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-6">
                    {/* Left side: Dropdown and text */}
                    <div className="flex items-center gap-4">
                      <Select
                        size="sm"
                        placeholder="Items per page"
                        defaultSelectedKeys={[itemsPerPage.toString()]}
                        className="w-32"
                        onChange={(e) => {
                          const newItemsPerPage = Number.parseInt(e.target.value);
                          setItemsPerPage(newItemsPerPage);
                          setCurrentPage(1); // Reset to first page
                        }}
                      >
                        <SelectItem key="5">5</SelectItem>
                        <SelectItem key="10">10</SelectItem>
                        <SelectItem key="25">25</SelectItem>
                        <SelectItem key="50">50</SelectItem>
                      </Select>
                      <Text variant="bodySmall" className="text-default-500">
                        Showing {startIndex + 1}-{Math.min(endIndex, purchaseOrders.length)} of{' '}
                        {purchaseOrders.length} orders
                      </Text>
                    </div>

                    {/* Right side: Pagination buttons */}
                    <Pagination
                      total={totalPages}
                      page={currentPage}
                      onChange={setCurrentPage}
                      showControls
                      showShadow
                      color="primary"
                    />
                  </div>
                )}
              </CardBody>
            </Card>
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}
