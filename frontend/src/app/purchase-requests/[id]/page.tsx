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
import { Text } from '../../../components/ui/Text';
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
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <Text variant="bodyLarge">Loading purchase request...</Text>
            </div>
          </div>
        </main>
      </AuthGuard>
    );
  }

  if (error || !purchaseRequest) {
    return (
      <AuthGuard requireAuth={true}>
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <Text variant="bodyLarge" className="text-danger">
                Error loading purchase request or request not found
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
                Purchase Request {purchaseRequest.prNumber}
              </Text>
              <Text variant="bodyBase" className="text-default-500 mt-2" as="p">
                View and manage purchase request details
              </Text>
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
                  <Chip
                    color={getStatusColor(purchaseRequest.status)}
                    variant="flat"
                    className="mt-1"
                  >
                    {purchaseRequest.status}
                  </Chip>
                </div>
                <div>
                  <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                    Title
                  </Text>
                  <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                    {purchaseRequest.title || 'Untitled'}
                  </Text>
                </div>
                <div>
                  <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                    Required Date
                  </Text>
                  <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                    {new Date(purchaseRequest.requiredDate).toLocaleDateString()}
                  </Text>
                </div>
                <div>
                  <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                    Branch
                  </Text>
                  <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                    {purchaseRequest.branch.name}
                  </Text>
                </div>
                <div>
                  <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                    Requested By
                  </Text>
                  <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                    {purchaseRequest.createdBy.firstName} {purchaseRequest.createdBy.lastName}
                  </Text>
                </div>
                <div>
                  <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                    Total Amount
                  </Text>
                  <Text variant="bodyBase" className="mt-1 text-foreground font-semibold" as="p">
                    ${Number(purchaseRequest.totalAmount).toFixed(2)}
                  </Text>
                </div>
                {purchaseRequest.description && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                      Description
                    </Text>
                    <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                      {purchaseRequest.description}
                    </Text>
                  </div>
                )}
                {purchaseRequest.justification && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                      Justification
                    </Text>
                    <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                      {purchaseRequest.justification}
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
                          <Text variant="bodyBase" weight="medium" as="p">
                            {item.item.name}
                          </Text>
                          <Text variant="bodySmall" className="text-default-500" as="p">
                            {item.item.code}
                          </Text>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.requestedQty} {item.item.unit}
                      </TableCell>
                      <TableCell>
                        {item.estimatedPrice ? `$${Number(item.estimatedPrice).toFixed(2)}` : 'N/A'}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${Number(item.totalAmount).toFixed(2)}
                      </TableCell>
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
                    {new Date(purchaseRequest.createdAt).toLocaleString()}
                  </Text>
                </div>
                <div>
                  <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                    Last Updated
                  </Text>
                  <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                    {new Date(purchaseRequest.updatedAt).toLocaleString()}
                  </Text>
                </div>
                {purchaseRequest.prTemplate && (
                  <div>
                    <Text variant="bodySmall" weight="medium" className="text-default-500" as="p">
                      Template Used
                    </Text>
                    <Text variant="bodyBase" className="mt-1 text-foreground" as="p">
                      {purchaseRequest.prTemplate.name}
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
