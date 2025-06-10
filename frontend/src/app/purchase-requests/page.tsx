'use client';

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
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
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
  useDisclosure,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import { PurchaseRequestForm } from '../../components/purchase-request/PurchaseRequestForm';
import { Text } from '../../components/ui/Text';
import {
  type PurchaseRequest,
  useApprovePurchaseRequestMutation,
  useGetPurchaseRequestsQuery,
  useRejectPurchaseRequestMutation,
  useSubmitPurchaseRequestMutation,
} from '../../store/api/purchaseRequestApi';

export default function PurchaseRequestsPage() {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
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
    data: purchaseRequests = [],
    isLoading,
    error,
    refetch,
  } = useGetPurchaseRequestsQuery({}, { skip: !isMounted });
  const [submitPurchaseRequest] = useSubmitPurchaseRequestMutation();
  const [approvePurchaseRequest] = useApprovePurchaseRequestMutation();
  const [rejectPurchaseRequest] = useRejectPurchaseRequestMutation();

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
    setSelectedRequest(null);
    onOpen();
  };

  const handleEditRequest = (request: PurchaseRequest) => {
    setSelectedRequest(request);
    onOpen();
  };

  const handleFormSuccess = () => {
    refetch();
    onClose();
    // Reset to first page when new data is added
    setCurrentPage(1);

    // Show success toast
    addToast({
      title: 'Success',
      description: selectedRequest
        ? 'Purchase request updated successfully'
        : 'Purchase request created successfully',
      color: 'success',
      variant: 'flat',
    });
  };

  const handleWorkflowAction = async (
    action: 'submit' | 'approve' | 'reject',
    requestId: string
  ) => {
    try {
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
    } catch (error) {
      console.error(`Failed to ${action} purchase request:`, error);
      addToast({
        title: 'Error',
        description: `Failed to ${action} purchase request. Please try again.`,
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
              <Text variant="bodyLarge">Loading purchase requests...</Text>
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
              <Text variant="bodyLarge" className="text-red-600">
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
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Text variant="headerSmall" weight="bold" className="text-gray-900">
                Purchase Requests
              </Text>
              <Text variant="bodyBase" className="text-gray-600 mt-2">
                Manage and track all purchase requests
              </Text>
            </div>
            <Button color="primary" onPress={handleCreateRequest}>
              Create New Request
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3 flex flex-col gap-4">
              <div className="flex justify-between items-center w-full">
                <Text variant="titleSmall" weight="semiBold">
                  All Purchase Requests
                </Text>
                <div className="flex items-center gap-4">
                  <Text variant="bodySmall" className="text-gray-500">
                    Showing {startIndex + 1}-{Math.min(endIndex, purchaseRequests.length)} of{' '}
                    {purchaseRequests.length} requests
                  </Text>
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
                </div>
              </div>

              {/* Summary Chips */}
              <div className="flex flex-wrap gap-2 justify-start  w-full">
                <Chip
                  color="primary"
                  variant="flat"
                  size="sm"
                  startContent={<div className="bg-blue-500 rounded-full w-1.5 h-1.5" />}
                >
                  Total: {purchaseRequests.length}
                </Chip>
                <Chip
                  color="default"
                  variant="flat"
                  size="sm"
                  startContent={<div className="bg-gray-500 rounded-full w-1.5 h-1.5" />}
                >
                  Draft: {purchaseRequests.filter((req) => req.status === 'DRAFT').length}
                </Chip>
                <Chip
                  color="warning"
                  variant="flat"
                  size="sm"
                  startContent={<div className="bg-yellow-500 rounded-full w-1.5 h-1.5" />}
                >
                  Submitted: {purchaseRequests.filter((req) => req.status === 'SUBMITTED').length}
                </Chip>
                <Chip
                  color="success"
                  variant="flat"
                  size="sm"
                  startContent={<div className="bg-green-500 rounded-full w-1.5 h-1.5" />}
                >
                  Approved: {purchaseRequests.filter((req) => req.status === 'APPROVED').length}
                </Chip>
                <Chip
                  color="danger"
                  variant="flat"
                  size="sm"
                  startContent={<div className="bg-red-500 rounded-full w-1.5 h-1.5" />}
                >
                  Rejected: {purchaseRequests.filter((req) => req.status === 'REJECTED').length}
                </Chip>
              </div>
            </CardHeader>
            <CardBody>
              <Table aria-label="Purchase requests table">
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
                        <Chip color={getStatusColor(request.status)} variant="flat" size="sm">
                          {request.status}
                        </Chip>
                      </TableCell>
                      <TableCell>{new Date(request.requiredDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <Dropdown>
                            <DropdownTrigger>
                              <Button
                                variant="light"
                                size="sm"
                                isIconOnly
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
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
                                } else if (
                                  action === 'submit' ||
                                  action === 'approve' ||
                                  action === 'reject'
                                ) {
                                  handleWorkflowAction(
                                    action as 'submit' | 'approve' | 'reject',
                                    request.id
                                  );
                                }
                              }}
                            >
                              <DropdownItem
                                key="view"
                                startContent={
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                  </svg>
                                }
                              >
                                View Details
                              </DropdownItem>
                              {request.status === 'DRAFT' && (
                                <>
                                  <DropdownItem
                                    key="edit"
                                    startContent={
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                      </svg>
                                    }
                                  >
                                    Edit Request
                                  </DropdownItem>
                                  <DropdownItem
                                    key="submit"
                                    color="warning"
                                    startContent={
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                        />
                                      </svg>
                                    }
                                  >
                                    Submit for Approval
                                  </DropdownItem>
                                </>
                              )}
                              {request.status === 'SUBMITTED' && (
                                <>
                                  <DropdownItem
                                    key="approve"
                                    color="success"
                                    startContent={
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                    }
                                  >
                                    Approve Request
                                  </DropdownItem>
                                  <DropdownItem
                                    key="reject"
                                    color="danger"
                                    startContent={
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                    }
                                  >
                                    Reject Request
                                  </DropdownItem>
                                </>
                              )}
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
                <div className="flex justify-center mt-6">
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
        </div>

        {/* Create/Edit Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
          <ModalContent>
            <ModalHeader>
              {selectedRequest ? 'Edit Purchase Request' : 'Create New Purchase Request'}
            </ModalHeader>
            <ModalBody className="pb-6">
              <PurchaseRequestForm
                id={selectedRequest?.id}
                initialData={
                  selectedRequest
                    ? {
                        title: selectedRequest.title || '',
                        description: selectedRequest.description || '',
                        requiredDate: selectedRequest.requiredDate,
                        branchId: selectedRequest.branchId,
                        justification: selectedRequest.justification || '',
                        items:
                          selectedRequest.items?.map((item) => ({
                            itemId: item.itemId,
                            requestedQty: item.requestedQty,
                            estimatedPrice: item.estimatedPrice || undefined,
                            requiredDate: item.requiredDate,
                            remarks: item.remarks || '',
                          })) || [],
                      }
                    : undefined
                }
                mode={selectedRequest ? 'edit' : 'create'}
                onSuccess={handleFormSuccess}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      </div>
    </AuthGuard>
  );
}
