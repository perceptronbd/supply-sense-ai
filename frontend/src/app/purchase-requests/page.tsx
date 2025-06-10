'use client';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
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
  useDisclosure,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import { PurchaseRequestForm } from '../../components/purchase-request/PurchaseRequestForm';
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
              <div className="text-lg">Loading...</div>
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
  };

  const handleWorkflowAction = async (
    action: 'submit' | 'approve' | 'reject',
    requestId: string
  ) => {
    try {
      switch (action) {
        case 'submit':
          await submitPurchaseRequest(requestId).unwrap();
          break;
        case 'approve':
          await approvePurchaseRequest(requestId).unwrap();
          break;
        case 'reject':
          await rejectPurchaseRequest(requestId).unwrap();
          break;
      }
      refetch();
    } catch (error) {
      console.error(`Failed to ${action} purchase request:`, error);
    }
  };

  if (isLoading) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <div className="text-lg">Loading purchase requests...</div>
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
              <div className="text-lg text-red-600">Error loading purchase requests</div>
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
              <h1 className="text-3xl font-bold text-gray-900">Purchase Requests</h1>
              <p className="text-gray-600 mt-2">Manage and track all purchase requests</p>
            </div>
            <Button color="primary" onPress={handleCreateRequest}>
              Create New Request
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3 flex flex-col gap-4">
              <div className="flex justify-between items-center w-full">
                <h3 className="text-xl font-semibold">All Purchase Requests</h3>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-500">
                    Showing {startIndex + 1}-{Math.min(endIndex, purchaseRequests.length)} of{' '}
                    {purchaseRequests.length} requests
                  </div>
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
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            onPress={() => router.push(`/purchase-requests/${request.id}`)}
                          >
                            View
                          </Button>
                          {request.status === 'DRAFT' && (
                            <>
                              <Button
                                size="sm"
                                variant="flat"
                                color="secondary"
                                onPress={() => handleEditRequest(request)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="flat"
                                color="warning"
                                onPress={() => handleWorkflowAction('submit', request.id)}
                              >
                                Submit
                              </Button>
                            </>
                          )}
                          {request.status === 'SUBMITTED' && (
                            <>
                              <Button
                                size="sm"
                                variant="flat"
                                color="success"
                                onPress={() => handleWorkflowAction('approve', request.id)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="flat"
                                color="danger"
                                onPress={() => handleWorkflowAction('reject', request.id)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
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
