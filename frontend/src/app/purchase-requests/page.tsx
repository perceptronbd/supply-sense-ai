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
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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

  // API hooks
  const {
    data: purchaseRequests = [],
    isLoading,
    error,
    refetch,
  } = useGetPurchaseRequestsQuery({});
  const [submitPurchaseRequest] = useSubmitPurchaseRequestMutation();
  const [approvePurchaseRequest] = useApprovePurchaseRequestMutation();
  const [rejectPurchaseRequest] = useRejectPurchaseRequestMutation();

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
            <CardHeader className="pb-3">
              <h3 className="text-xl font-semibold">All Purchase Requests</h3>
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
                  {purchaseRequests.map((request) => (
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
            </CardBody>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            <Card>
              <CardBody className="text-center p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Requests</h3>
                <p className="text-3xl font-bold text-blue-600">{purchaseRequests.length}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Draft</h3>
                <p className="text-3xl font-bold text-gray-600">
                  {purchaseRequests.filter((req) => req.status === 'DRAFT').length}
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Submitted</h3>
                <p className="text-3xl font-bold text-yellow-600">
                  {purchaseRequests.filter((req) => req.status === 'SUBMITTED').length}
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Approved</h3>
                <p className="text-3xl font-bold text-green-600">
                  {purchaseRequests.filter((req) => req.status === 'APPROVED').length}
                </p>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Create/Edit Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
          <ModalContent>
            <ModalHeader>
              {selectedRequest ? 'Edit Purchase Request' : 'Create New Purchase Request'}
            </ModalHeader>
            <ModalBody className="pb-6">
              <PurchaseRequestForm
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
