'use client';

import AuthGuard from '@/components/AuthGuard';
import {
  DotsVerticalIcon,
  EditIcon,
  EyeIcon,
  PostIcon,
  ReceiptIcon,
  TrashIcon,
  XMarkIcon,
} from '@/components/icons';
import { DrawingLogo } from '@/components/ui/DrawingLogo';
import { PermissionGuard } from '@/components/ui/PermissionGuard';
import { Text } from '@/components/ui/Text';
import { usePermissions } from '@/hooks/usePermissions';
import {
  type GoodsReceipt,
  useCancelGoodsReceiptMutation,
  useDeleteGoodsReceiptMutation,
  useGetGoodsReceiptsQuery,
  usePostGoodsReceiptMutation,
} from '@/store/api/goodsReceiptApi';
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
import { GOODS_RECEIPT_PERMISSIONS } from '@supplysense/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function GoodsReceiptsPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const { hasPermission } = usePermissions();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Ensure component is mounted before rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // API hooks
  const {
    data: goodsReceipts = [],
    isLoading,
    error,
    refetch,
  } = useGetGoodsReceiptsQuery({}, { skip: !isMounted });
  const [postGoodsReceipt] = usePostGoodsReceiptMutation();
  const [cancelGoodsReceipt] = useCancelGoodsReceiptMutation();
  const [deleteGoodsReceipt] = useDeleteGoodsReceiptMutation();

  // Pagination calculations
  const totalPages = Math.ceil(goodsReceipts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReceipts = goodsReceipts.slice(startIndex, endIndex);

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
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-center h-64">
              <DrawingLogo size={60} variant="primary" speed="fast" showFill={true} />
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

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

  const handleCreateReceipt = () => {
    router.push('/goods-receipts/create');
  };

  const handleEditReceipt = (receipt: GoodsReceipt) => {
    router.push(`/goods-receipts/${receipt.id}/edit`);
  };

  const getDropdownItems = (receipt: GoodsReceipt) => {
    const items = [
      <DropdownItem key="view" startContent={<EyeIcon />}>
        View Details
      </DropdownItem>,
    ];

    if (receipt.status === 'DRAFT') {
      // Edit action - requires UPDATE permission
      if (hasPermission(GOODS_RECEIPT_PERMISSIONS.UPDATE)) {
        items.push(
          <DropdownItem key="edit" startContent={<EditIcon />}>
            Edit Receipt
          </DropdownItem>
        );
      }

      // Post action - requires APPROVE permission (posting is like approving)
      if (hasPermission(GOODS_RECEIPT_PERMISSIONS.APPROVE)) {
        items.push(
          <DropdownItem key="post" color="success" startContent={<PostIcon />}>
            Post Receipt
          </DropdownItem>
        );
      }

      // Cancel action - requires REJECT permission (canceling is like rejecting)
      if (hasPermission(GOODS_RECEIPT_PERMISSIONS.REJECT)) {
        items.push(
          <DropdownItem key="cancel" color="warning" startContent={<XMarkIcon />}>
            Cancel Receipt
          </DropdownItem>
        );
      }

      // Delete action - requires DELETE permission
      if (hasPermission(GOODS_RECEIPT_PERMISSIONS.DELETE)) {
        items.push(
          <DropdownItem key="delete" color="danger" startContent={<TrashIcon />}>
            Delete Receipt
          </DropdownItem>
        );
      }
    }

    return items;
  };

  const handleWorkflowAction = async (action: 'post' | 'cancel' | 'delete', receiptId: string) => {
    try {
      switch (action) {
        case 'post':
          await postGoodsReceipt(receiptId).unwrap();
          addToast({
            title: 'Success',
            description: 'Goods receipt posted successfully',
            color: 'success',
            variant: 'flat',
          });
          break;
        case 'cancel':
          await cancelGoodsReceipt(receiptId).unwrap();
          addToast({
            title: 'Success',
            description: 'Goods receipt cancelled',
            color: 'warning',
            variant: 'flat',
          });
          break;
        case 'delete':
          await deleteGoodsReceipt(receiptId).unwrap();
          addToast({
            title: 'Success',
            description: 'Goods receipt deleted',
            color: 'success',
            variant: 'flat',
          });
          break;
      }
      refetch();
    } catch {
      addToast({
        title: 'Error',
        description: `Failed to ${action} goods receipt. Please try again.`,
        color: 'danger',
        variant: 'flat',
      });
    }
  };

  const calculateTotalValue = (receipt: GoodsReceipt): number => {
    return receipt.items.reduce((total, item) => {
      const totalCost = item.totalCost ? Number.parseFloat(item.totalCost) : 0;
      return total + totalCost;
    }, 0);
  };

  const calculateTotalItems = (receipt: GoodsReceipt): number => {
    return receipt.items.reduce((total, item) => {
      const receivedQty = Number.parseFloat(item.receivedQty);
      return total + receivedQty;
    }, 0);
  };

  if (isLoading) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="p-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-center h-64">
              <Text variant="bodyLarge">Loading goods receipts...</Text>
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
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-center h-64">
              <Text variant="bodyLarge" className="text-danger">
                Error loading goods receipts
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
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <header className="flex items-center justify-between mb-6">
            <div>
              <Text variant="headerSmall" weight="bold" className="text-foreground" as="h1">
                Goods Receipts
              </Text>
              <Text variant="bodyBase" className="mt-2 text-default-500" as="p">
                Track and manage all incoming goods receipts
              </Text>
            </div>
            <PermissionGuard permission={GOODS_RECEIPT_PERMISSIONS.CREATE}>
              <Button color="primary" onPress={handleCreateReceipt} startContent={<ReceiptIcon />}>
                Record New Receipt
              </Button>
            </PermissionGuard>
          </header>

          <section>
            <Card>
              <CardHeader className="flex flex-col gap-4 pb-3">
                <div className="flex items-center justify-between w-full">
                  <Text variant="titleSmall" weight="semiBold">
                    All Goods Receipts
                  </Text>
                  {/* Status Summary Chips */}
                  <div className="flex flex-wrap justify-end gap-2">
                    <Chip
                      color="primary"
                      variant="flat"
                      size="sm"
                      startContent={<div className="bg-primary rounded-full w-1.5 h-1.5" />}
                    >
                      Total: {goodsReceipts.length}
                    </Chip>
                    <Chip
                      color="default"
                      variant="flat"
                      size="sm"
                      startContent={<div className="bg-default-500 rounded-full w-1.5 h-1.5" />}
                    >
                      Draft: {goodsReceipts.filter((receipt) => receipt.status === 'DRAFT').length}
                    </Chip>
                    <Chip
                      color="success"
                      variant="flat"
                      size="sm"
                      startContent={<div className="bg-success rounded-full w-1.5 h-1.5" />}
                    >
                      Posted:{' '}
                      {goodsReceipts.filter((receipt) => receipt.status === 'POSTED').length}
                    </Chip>
                    <Chip
                      color="danger"
                      variant="flat"
                      size="sm"
                      startContent={<div className="bg-danger rounded-full w-1.5 h-1.5" />}
                    >
                      Cancelled:{' '}
                      {goodsReceipts.filter((receipt) => receipt.status === 'CANCELLED').length}
                    </Chip>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                {/* Loading State */}
                {isLoading && (
                  <div className="flex items-center justify-center py-12">
                    <DrawingLogo size={60} variant="primary" speed="fast" showFill={true} />
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="py-12 text-center">
                    <Text variant="bodyLarge" color="danger" className="mb-4">
                      Failed to load goods receipts
                    </Text>
                    <Button color="primary" variant="flat" onPress={() => window.location.reload()}>
                      Try Again
                    </Button>
                  </div>
                )}

                {/* Empty State */}
                {!isLoading &&
                  !error &&
                  (!Array.isArray(goodsReceipts) || goodsReceipts.length === 0) && (
                    <div className="py-12 text-center border-2 border-dashed rounded-lg border-divider">
                      <Text variant="bodyLarge" color="muted" className="mb-2">
                        No goods receipts found
                      </Text>
                    </div>
                  )}

                {/* Goods Receipts Table */}
                {!isLoading &&
                  !error &&
                  Array.isArray(goodsReceipts) &&
                  goodsReceipts.length > 0 && (
                    <>
                      <Table
                        aria-label="Goods receipts table"
                        classNames={{
                          th: 'bg-default-200',
                          tr: 'hover:bg-default-200',
                        }}
                      >
                        <TableHeader>
                          <TableColumn>RECEIPT ID</TableColumn>
                          <TableColumn>SOURCE</TableColumn>
                          <TableColumn>SUPPLIER/BRANCH</TableColumn>
                          <TableColumn>RECEIVED DATE</TableColumn>
                          <TableColumn>RECEIVED BY</TableColumn>
                          <TableColumn>STATUS</TableColumn>
                          <TableColumn>ITEMS</TableColumn>
                          <TableColumn>TOTAL VALUE</TableColumn>
                          <TableColumn>ACTIONS</TableColumn>
                        </TableHeader>
                        <TableBody>
                          {paginatedReceipts.map((receipt) => (
                            <TableRow key={receipt.id}>
                              <TableCell className="font-medium">{receipt.grNumber}</TableCell>
                              <TableCell>
                                {receipt.purchaseOrder ? (
                                  <div>
                                    <Text
                                      variant="bodyBase"
                                      weight="medium"
                                      className="text-primary"
                                      as="p"
                                    >
                                      {receipt.purchaseOrder.poNumber}
                                    </Text>
                                    <Text variant="bodySmall" className="text-default-500" as="p">
                                      Purchase Order
                                    </Text>
                                  </div>
                                ) : receipt.materialRequisition ? (
                                  <div>
                                    <Text
                                      variant="bodyBase"
                                      weight="medium"
                                      className="text-warning"
                                      as="p"
                                    >
                                      {receipt.materialRequisition.mrNumber}
                                    </Text>
                                    <Text variant="bodySmall" className="text-default-500" as="p">
                                      Material Requisition
                                    </Text>
                                  </div>
                                ) : (
                                  <div>
                                    <Text variant="bodyBase" weight="medium" as="p">
                                      Manual Entry
                                    </Text>
                                    <Text variant="bodySmall" className="text-default-500" as="p">
                                      Standalone Receipt
                                    </Text>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {receipt.purchaseOrder?.supplier?.name || receipt.branch.name}
                              </TableCell>
                              <TableCell>
                                {new Date(receipt.receiptDate).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {receipt.receivedBy.firstName} {receipt.receivedBy.lastName}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  color={getStatusColor(receipt.status)}
                                  variant="flat"
                                  size="sm"
                                >
                                  {receipt.status}
                                </Chip>
                              </TableCell>
                              <TableCell>{calculateTotalItems(receipt)}</TableCell>
                              <TableCell className="font-medium">
                                ${calculateTotalValue(receipt).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-center">
                                  <Dropdown>
                                    <DropdownTrigger>
                                      <Button
                                        variant="light"
                                        size="sm"
                                        isIconOnly
                                        className="text-default-600 hover:text-default-600"
                                      >
                                        <DotsVerticalIcon />
                                      </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu
                                      variant="flat"
                                      onAction={(key) => {
                                        const action = key as string;
                                        if (action === 'view') {
                                          router.push(`/goods-receipts/${receipt.id}`);
                                        } else if (action === 'edit') {
                                          handleEditReceipt(receipt);
                                        } else if (
                                          action === 'post' ||
                                          action === 'cancel' ||
                                          action === 'delete'
                                        ) {
                                          handleWorkflowAction(
                                            action as 'post' | 'cancel' | 'delete',
                                            receipt.id
                                          );
                                        }
                                      }}
                                    >
                                      {getDropdownItems(receipt)}
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
                        <div className="flex items-center justify-between mt-6">
                          <div className="flex items-center gap-4">
                            <Select
                              size="sm"
                              placeholder="Items per page"
                              defaultSelectedKeys={[itemsPerPage.toString()]}
                              className="w-32"
                              classNames={{
                                popoverContent: 'bg-default-200',
                                trigger: 'bg-default-200',
                              }}
                              onChange={(e) => {
                                const newItemsPerPage = Number.parseInt(e.target.value);
                                setItemsPerPage(newItemsPerPage);
                                setCurrentPage(1);
                              }}
                            >
                              <SelectItem key="5">5</SelectItem>
                              <SelectItem key="10">10</SelectItem>
                              <SelectItem key="25">25</SelectItem>
                              <SelectItem key="50">50</SelectItem>
                            </Select>
                            <Text variant="bodySmall" className="text-default-500">
                              Showing {startIndex + 1}-{Math.min(endIndex, goodsReceipts.length)} of{' '}
                              {goodsReceipts.length} receipts
                            </Text>
                          </div>

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
                    </>
                  )}
              </CardBody>
            </Card>
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}
