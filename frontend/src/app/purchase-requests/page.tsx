'use client';

import AuthGuard from '@/components/AuthGuard';
import {
  CheckIcon,
  DotsVerticalIcon,
  EditIcon,
  EyeIcon,
  SendIcon,
  ShoppingCartIcon,
  TrashIcon,
  XMarkIcon,
} from '@/components/icons';
import CreatePOFromPRModal from '@/components/purchase-request/CreatePOFromPRModal';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import { DrawingLogo } from '@/components/ui/DrawingLogo';
import { Text } from '@/components/ui/Text';
import { usePermissions } from '@/hooks/usePermissions';
import {
  type PurchaseRequest,
  useApprovePurchaseRequestMutation,
  useDeletePurchaseRequestMutation,
  useGetPurchaseRequestsQuery,
  useRejectPurchaseRequestMutation,
  useSubmitPurchaseRequestMutation,
} from '@/store/api/purchaseRequestApi';
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
import { PURCHASE_ORDER_PERMISSIONS, PURCHASE_REQUEST_PERMISSIONS } from '@supplysense/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PurchaseRequestsPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const { hasPermission } = usePermissions();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal state
  const [createPOModal, setCreatePOModal] = useState<{
    isOpen: boolean;
    purchaseRequestId: string;
    purchaseRequestNumber: string;
  }>({
    isOpen: false,
    purchaseRequestId: '',
    purchaseRequestNumber: '',
  });

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    requestId: string;
    requestNumber: string;
  }>({
    isOpen: false,
    requestId: '',
    requestNumber: '',
  });

  // Ensure component is mounted before rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // API hooks
  const {
    data: purchaseRequests = [],
    isLoading,
    error,
    refetch,
  } = useGetPurchaseRequestsQuery({}, { skip: !isMounted });
  const [submitPurchaseRequest] = useSubmitPurchaseRequestMutation();
  const [approvePurchaseRequest] = useApprovePurchaseRequestMutation();
  const [rejectPurchaseRequest] = useRejectPurchaseRequestMutation();
  const [deletePurchaseRequest] = useDeletePurchaseRequestMutation();

  // Pagination calculations
  const totalPages = Math.ceil(purchaseRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = purchaseRequests.slice(startIndex, endIndex);

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
              <Text variant="bodyLarge">Loading...</Text>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'submitted':
        return 'warning';
      case 'draft':
        return 'default';
      default:
        return 'primary';
    }
  };

  const handleCreateRequest = () => {
    router.push('/purchase-requests/create');
  };

  const handleEditRequest = (request: PurchaseRequest) => {
    router.push(`/purchase-requests/${request.id}/edit`);
  };

  const handleCreatePO = (request: PurchaseRequest) => {
    setCreatePOModal({
      isOpen: true,
      purchaseRequestId: request.id,
      purchaseRequestNumber: request.prNumber,
    });
  };

  // Helper functions to reduce complexity
  const getDraftStatusItems = () => {
    const items = [];

    if (hasPermission(PURCHASE_REQUEST_PERMISSIONS.UPDATE)) {
      items.push(
        <DropdownItem key="edit" startContent={<EditIcon />}>
          Edit Request
        </DropdownItem>
      );
    }

    if (hasPermission(PURCHASE_REQUEST_PERMISSIONS.SUBMIT)) {
      items.push(
        <DropdownItem key="submit" color="warning" startContent={<SendIcon />}>
          Submit for Approval
        </DropdownItem>
      );
    }

    if (hasPermission(PURCHASE_REQUEST_PERMISSIONS.DELETE)) {
      items.push(
        <DropdownItem key="delete" color="danger" startContent={<TrashIcon />}>
          Delete Request
        </DropdownItem>
      );
    }

    return items;
  };

  const getSubmittedStatusItems = () => {
    const items = [];

    if (hasPermission(PURCHASE_REQUEST_PERMISSIONS.APPROVE)) {
      items.push(
        <DropdownItem key="approve" color="success" startContent={<CheckIcon />}>
          Approve Request
        </DropdownItem>
      );
    }

    if (hasPermission(PURCHASE_REQUEST_PERMISSIONS.REJECT)) {
      items.push(
        <DropdownItem key="reject" color="danger" startContent={<XMarkIcon />}>
          Reject Request
        </DropdownItem>
      );
    }

    return items;
  };

  const getApprovedStatusItems = () => {
    const items = [];

    if (hasPermission(PURCHASE_ORDER_PERMISSIONS.CREATE)) {
      items.push(
        <DropdownItem key="createPO" color="primary" startContent={<ShoppingCartIcon />}>
          Create Purchase Order
        </DropdownItem>
      );
    }

    return items;
  };

  const getDropdownItems = (request: PurchaseRequest) => {
    const items = [
      <DropdownItem key="view" startContent={<EyeIcon />}>
        View Details
      </DropdownItem>,
    ];

    switch (request.status) {
      case 'DRAFT':
        items.push(...getDraftStatusItems());
        break;
      case 'SUBMITTED':
        items.push(...getSubmittedStatusItems());
        break;
      case 'APPROVED':
        items.push(...getApprovedStatusItems());
        break;
    }

    return items;
  };

  const handleWorkflowAction = async (
    action: 'submit' | 'approve' | 'reject' | 'delete',
    requestId: string
  ) => {
    try {
      // Show confirmation modal for delete action
      if (action === 'delete') {
        const request = purchaseRequests.find((pr) => pr.id === requestId);
        setDeleteModal({
          isOpen: true,
          requestId,
          requestNumber: request?.prNumber || 'Unknown',
        });
        return; // Don't continue with deletion here
      }

      switch (action) {
        case 'submit':
          await submitPurchaseRequest(requestId).unwrap();
          addToast({
            title: 'Success',
            description: 'Purchase request submitted for approval',
            color: 'success',
            variant: 'flat',
          });
          break;
        case 'approve':
          await approvePurchaseRequest(requestId).unwrap();
          addToast({
            title: 'Success',
            description: 'Purchase request approved successfully',
            color: 'success',
            variant: 'flat',
          });
          break;
        case 'reject':
          await rejectPurchaseRequest(requestId).unwrap();
          addToast({
            title: 'Success',
            description: 'Purchase request rejected',
            color: 'warning',
            variant: 'flat',
          });
          break;
      }
      refetch();
    } catch {
      // Error logging would be handled by a proper logging service in production
      addToast({
        title: 'Error',
        description: `Failed to ${action} purchase request. Please try again.`,
        color: 'danger',
        variant: 'flat',
      });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deletePurchaseRequest(deleteModal.requestId).unwrap();
      addToast({
        title: 'Success',
        description: 'Purchase request deleted successfully',
        color: 'success',
        variant: 'flat',
      });
      refetch();
    } catch (error: unknown) {
      console.error('Failed to delete purchase request:', error);
      addToast({
        title: 'Error',
        description: 'Failed to delete purchase request. Please try again.',
        color: 'danger',
        variant: 'flat',
      });
    }
  };

  if (isLoading) {
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

  if (error) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="p-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-center h-64">
              <Text variant="bodyLarge" className="text-danger">
                Error loading purchase requests
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
          <header className="flex items-center justify-between mb-6">
            <div>
              <Text variant="headerSmall" weight="bold" className="text-foreground" as="h1">
                Purchase Requests
              </Text>
              <Text variant="bodyBase" className="mt-2 text-default-500" as="p">
                Manage and track all purchase requests
              </Text>
            </div>
            {hasPermission(PURCHASE_REQUEST_PERMISSIONS.CREATE) && (
              <Button color="primary" onPress={handleCreateRequest}>
                Create New Request
              </Button>
            )}
          </header>

          <section>
            <Card>
              <CardHeader className="flex flex-col gap-4 pb-3">
                <div className="flex items-center justify-between w-full">
                  <Text variant="titleSmall" weight="semiBold" as="h2">
                    All Purchase Requests
                  </Text>
                  {/* Status Summary Chips moved to the right */}
                  <div className="flex flex-wrap justify-end gap-2">
                    <Chip
                      color="primary"
                      variant="flat"
                      size="sm"
                      startContent={<div className="bg-primary rounded-full w-1.5 h-1.5" />}
                    >
                      Total: {purchaseRequests.length}
                    </Chip>
                    <Chip
                      color="default"
                      variant="flat"
                      size="sm"
                      startContent={<div className="bg-default-500 rounded-full w-1.5 h-1.5" />}
                    >
                      Draft: {purchaseRequests.filter((req) => req.status === 'DRAFT').length}
                    </Chip>
                    <Chip
                      color="warning"
                      variant="flat"
                      size="sm"
                      startContent={<div className="bg-warning rounded-full w-1.5 h-1.5" />}
                    >
                      Submitted:{' '}
                      {purchaseRequests.filter((req) => req.status === 'SUBMITTED').length}
                    </Chip>
                    <Chip
                      color="success"
                      variant="flat"
                      size="sm"
                      startContent={<div className="bg-success rounded-full w-1.5 h-1.5" />}
                    >
                      Approved: {purchaseRequests.filter((req) => req.status === 'APPROVED').length}
                    </Chip>
                    <Chip
                      color="danger"
                      variant="flat"
                      size="sm"
                      startContent={<div className="bg-danger rounded-full w-1.5 h-1.5" />}
                    >
                      Rejected: {purchaseRequests.filter((req) => req.status === 'REJECTED').length}
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
                      Failed to load purchase requests
                    </Text>
                    <Button color="primary" variant="flat" onPress={() => window.location.reload()}>
                      Try Again
                    </Button>
                  </div>
                )}

                {/* Empty State */}
                {!isLoading &&
                  !error &&
                  (!Array.isArray(purchaseRequests) || purchaseRequests.length === 0) && (
                    <div className="py-12 text-center border-2 border-dashed rounded-lg border-divider">
                      <Text variant="bodyLarge" color="muted" className="mb-2">
                        No purchase requests found
                      </Text>
                    </div>
                  )}

                {/* Purchase Requests Table */}
                {!isLoading &&
                  !error &&
                  Array.isArray(purchaseRequests) &&
                  purchaseRequests.length > 0 && (
                    <>
                      <Table
                        aria-label="Purchase requests table"
                        classNames={{
                          th: 'bg-default-200',
                          tr: 'hover:bg-default-200',
                        }}
                      >
                        <TableHeader>
                          <TableColumn>REQUEST ID</TableColumn>
                          <TableColumn>TITLE</TableColumn>
                          <TableColumn>STATUS</TableColumn>
                          <TableColumn>REQUIRED DATE</TableColumn>
                          <TableColumn>CREATED</TableColumn>
                          <TableColumn>ACTIONS</TableColumn>
                        </TableHeader>
                        <TableBody>
                          {paginatedRequests.map((request) => (
                            <TableRow key={request.id}>
                              <TableCell className="font-medium">{request.prNumber}</TableCell>
                              <TableCell>{request.title || 'Untitled'}</TableCell>
                              <TableCell>
                                <Chip
                                  color={getStatusColor(request.status)}
                                  variant="flat"
                                  size="sm"
                                >
                                  {request.status}
                                </Chip>
                              </TableCell>
                              <TableCell>
                                {new Date(request.requiredDate).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {new Date(request.createdAt).toLocaleDateString()}
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
                                          router.push(`/purchase-requests/${request.id}`);
                                        } else if (action === 'edit') {
                                          handleEditRequest(request);
                                        } else if (action === 'createPO') {
                                          handleCreatePO(request);
                                        } else if (
                                          action === 'submit' ||
                                          action === 'approve' ||
                                          action === 'reject' ||
                                          action === 'delete'
                                        ) {
                                          handleWorkflowAction(
                                            action as 'submit' | 'approve' | 'reject' | 'delete',
                                            request.id
                                          );
                                        }
                                      }}
                                    >
                                      {getDropdownItems(request)}
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
                          {/* Left side: Dropdown and text */}
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
                                setCurrentPage(1); // Reset to first page
                              }}
                            >
                              <SelectItem key="5">5</SelectItem>
                              <SelectItem key="10">10</SelectItem>
                              <SelectItem key="25">25</SelectItem>
                              <SelectItem key="50">50</SelectItem>
                            </Select>
                            <Text variant="bodySmall" className="text-default-500" as="p">
                              Showing {startIndex + 1}-{Math.min(endIndex, purchaseRequests.length)}{' '}
                              of {purchaseRequests.length} requests
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
                    </>
                  )}
              </CardBody>
            </Card>
          </section>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={handleDeleteConfirm}
        title="Delete Purchase Request"
        message="Are you sure you want to delete this purchase request?"
        itemName={`PR #${deleteModal.requestNumber}`}
      />

      {/* Create PO from PR Modal */}
      {createPOModal.isOpen && (
        <CreatePOFromPRModal
          isOpen={createPOModal.isOpen}
          onClose={() => setCreatePOModal({ ...createPOModal, isOpen: false })}
          purchaseRequestId={createPOModal.purchaseRequestId}
          purchaseRequestNumber={createPOModal.purchaseRequestNumber}
          onSuccess={() => refetch()}
        />
      )}
    </AuthGuard>
  );
}
