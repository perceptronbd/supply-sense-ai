'use client';

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
import { useParams } from 'next/navigation';
import AuthGuard from '../../../components/AuthGuard';
import {
  useApprovePurchaseRequestMutation,
  useGetPurchaseRequestQuery,
  useRejectPurchaseRequestMutation,
  useSubmitPurchaseRequestMutation,
} from '../../../store/api/purchaseRequestApi';

export default function PurchaseRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: purchaseRequest, isLoading, error } = useGetPurchaseRequestQuery(id);
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

  const handleWorkflowAction = async (action: 'submit' | 'approve' | 'reject') => {
    try {
      switch (action) {
        case 'submit':
          await submitPurchaseRequest(id).unwrap();
          break;
        case 'approve':
          await approvePurchaseRequest(id).unwrap();
          break;
        case 'reject':
          await rejectPurchaseRequest(id).unwrap();
          break;
      }
      // The query will automatically refetch due to cache invalidation
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
              <div className="text-lg">Loading purchase request...</div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error || !purchaseRequest) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-red-600">
                Error loading purchase request or request not found
              </div>
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
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <Button variant="flat" color="default" onPress={() => router.back()} className="mb-4">
                ← Back
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">
                Purchase Request {purchaseRequest.prNumber}
              </h1>
              <p className="text-gray-600 mt-2">View and manage purchase request details</p>
            </div>
            <div className="flex gap-2">
              {purchaseRequest.status === 'DRAFT' && (
                <>
                  <Button
                    color="secondary"
                    variant="flat"
                    onPress={() => router.push(`/purchase-requests/${id}/edit`)}
                  >
                    Edit
                  </Button>
                  <Button color="warning" onPress={() => handleWorkflowAction('submit')}>
                    Submit for Approval
                  </Button>
                </>
              )}
              {purchaseRequest.status === 'SUBMITTED' && (
                <>
                  <Button color="success" onPress={() => handleWorkflowAction('approve')}>
                    Approve
                  </Button>
                  <Button
                    color="danger"
                    variant="flat"
                    onPress={() => handleWorkflowAction('reject')}
                  >
                    Reject
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-xl font-semibold">Basic Information</h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <Chip
                    color={getStatusColor(purchaseRequest.status)}
                    variant="flat"
                    className="mt-1"
                  >
                    {purchaseRequest.status}
                  </Chip>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Title</p>
                  <p className="mt-1 text-gray-900">{purchaseRequest.title || 'Untitled'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Required Date</p>
                  <p className="mt-1 text-gray-900">
                    {new Date(purchaseRequest.requiredDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Branch</p>
                  <p className="mt-1 text-gray-900">{purchaseRequest.branch.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Requested By</p>
                  <p className="mt-1 text-gray-900">
                    {purchaseRequest.createdBy.firstName} {purchaseRequest.createdBy.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Amount</p>
                  <p className="mt-1 text-gray-900 font-semibold">
                    ${purchaseRequest.totalAmount.toFixed(2)}
                  </p>
                </div>
                {purchaseRequest.description && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <p className="text-sm font-medium text-gray-600">Description</p>
                    <p className="mt-1 text-gray-900">{purchaseRequest.description}</p>
                  </div>
                )}
                {purchaseRequest.justification && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <p className="text-sm font-medium text-gray-600">Justification</p>
                    <p className="mt-1 text-gray-900">{purchaseRequest.justification}</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Items</h2>
            </CardHeader>
            <CardBody>
              <Table aria-label="Purchase request items">
                <TableHeader>
                  <TableColumn>ITEM</TableColumn>
                  <TableColumn>QUANTITY</TableColumn>
                  <TableColumn>UNIT PRICE</TableColumn>
                  <TableColumn>TOTAL</TableColumn>
                  <TableColumn>REQUIRED DATE</TableColumn>
                  <TableColumn>REMARKS</TableColumn>
                </TableHeader>
                <TableBody>
                  {purchaseRequest.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.item.name}</p>
                          <p className="text-sm text-gray-600">{item.item.code}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.requestedQty} {item.item.unit}
                      </TableCell>
                      <TableCell>
                        {item.estimatedPrice ? `$${item.estimatedPrice.toFixed(2)}` : 'N/A'}
                      </TableCell>
                      <TableCell className="font-medium">${item.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>{new Date(item.requiredDate).toLocaleDateString()}</TableCell>
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
              <h2 className="text-xl font-semibold">Metadata</h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">Created At</p>
                  <p className="mt-1 text-gray-900">
                    {new Date(purchaseRequest.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Updated</p>
                  <p className="mt-1 text-gray-900">
                    {new Date(purchaseRequest.updatedAt).toLocaleString()}
                  </p>
                </div>
                {purchaseRequest.prTemplate && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Template Used</p>
                    <p className="mt-1 text-gray-900">{purchaseRequest.prTemplate.name}</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
