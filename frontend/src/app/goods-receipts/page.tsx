'use client';

import AuthGuard from '@/components/AuthGuard';
import { Text } from '@/components/ui/Text';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { useRouter } from 'next/navigation';

export default function GoodsReceiptsPage() {
  const _router = useRouter();

  // Mock data for the table
  const goodsReceipts = [
    {
      id: 'GR001',
      poNumber: 'PO001',
      supplier: 'ABC Supplies Inc.',
      receivedDate: '2025-06-10',
      receivedBy: 'John Warehouse',
      status: 'Completed',
      totalItems: 15,
      totalValue: '$2,450.00',
    },
    {
      id: 'GR002',
      poNumber: 'PO002',
      supplier: 'Tech Solutions Ltd.',
      receivedDate: '2025-06-09',
      receivedBy: 'Sarah Storage',
      status: 'Partial',
      totalItems: 5,
      totalValue: '$950.00',
    },
    {
      id: 'GR003',
      poNumber: 'PO003',
      supplier: 'Industrial Materials Co.',
      receivedDate: '2025-06-08',
      receivedBy: 'Mike Receiver',
      status: 'Completed',
      totalItems: 25,
      totalValue: '$3,200.00',
    },
    {
      id: 'GR004',
      poNumber: 'PO005',
      supplier: 'Safety First Equipment',
      receivedDate: '2025-06-07',
      receivedBy: 'Lisa Handler',
      status: 'Pending Review',
      totalItems: 6,
      totalValue: '$670.00',
    },
    {
      id: 'GR005',
      poNumber: 'PO006',
      supplier: 'Office Plus',
      receivedDate: '2025-06-06',
      receivedBy: 'Tom Checker',
      status: 'Discrepancy',
      totalItems: 10,
      totalValue: '$380.00',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'text-success bg-success/20';
      case 'Partial':
        return 'text-primary bg-primary/20';
      case 'Pending Review':
        return 'text-warning bg-warning/20';
      case 'Discrepancy':
        return 'text-danger bg-danger/20';
      default:
        return 'text-default-500 bg-default-100';
    }
  };

  return (
    <AuthGuard requireAuth={true}>
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="flex justify-between items-center mb-6">
            <div>
              <Text variant="headerLarge" weight="bold" className="text-foreground" as="h1">
                Goods Receipts
              </Text>
              <Text variant="bodyBase" className="text-default-500 mt-2" as="p">
                Track and manage all incoming goods receipts
              </Text>
            </div>
            <Button
              color="primary"
              onPress={() => alert('Create new receipt functionality coming soon!')}
            >
              Record New Receipt
            </Button>
          </header>

          <Card>
            <CardHeader className="pb-3">
              <Text variant="titleLarge" weight="semiBold" as="h2">
                All Goods Receipts
              </Text>
            </CardHeader>
            <CardBody>
              <Table aria-label="Goods receipts table">
                <TableHeader>
                  <TableColumn>RECEIPT ID</TableColumn>
                  <TableColumn>PO NUMBER</TableColumn>
                  <TableColumn>SUPPLIER</TableColumn>
                  <TableColumn>RECEIVED DATE</TableColumn>
                  <TableColumn>RECEIVED BY</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>ITEMS</TableColumn>
                  <TableColumn>TOTAL VALUE</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {goodsReceipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-medium">{receipt.id}</TableCell>
                      <TableCell className="font-medium text-primary">{receipt.poNumber}</TableCell>
                      <TableCell>{receipt.supplier}</TableCell>
                      <TableCell>{receipt.receivedDate}</TableCell>
                      <TableCell>{receipt.receivedBy}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            receipt.status
                          )}`}
                        >
                          {receipt.status}
                        </span>
                      </TableCell>
                      <TableCell>{receipt.totalItems}</TableCell>
                      <TableCell className="font-medium">{receipt.totalValue}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="flat" color="primary">
                            View
                          </Button>
                          <Button size="sm" variant="flat" color="secondary">
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>

          {/* Summary Cards */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            <Card>
              <CardBody className="text-center p-6">
                <Text
                  variant="titleMedium"
                  weight="semiBold"
                  className="text-foreground mb-2"
                  as="h3"
                >
                  Total Receipts
                </Text>
                <Text variant="display" weight="bold" className="text-primary" as="p">
                  {goodsReceipts.length}
                </Text>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center p-6">
                <Text
                  variant="titleMedium"
                  weight="semiBold"
                  className="text-foreground mb-2"
                  as="h3"
                >
                  Completed
                </Text>
                <Text variant="display" weight="bold" className="text-success" as="p">
                  {goodsReceipts.filter((receipt) => receipt.status === 'Completed').length}
                </Text>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center p-6">
                <Text
                  variant="titleMedium"
                  weight="semiBold"
                  className="text-foreground mb-2"
                  as="h3"
                >
                  Pending Review
                </Text>
                <Text variant="display" weight="bold" className="text-warning" as="p">
                  {goodsReceipts.filter((receipt) => receipt.status === 'Pending Review').length}
                </Text>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center p-6">
                <Text
                  variant="titleMedium"
                  weight="semiBold"
                  className="text-foreground mb-2"
                  as="h3"
                >
                  Discrepancies
                </Text>
                <Text variant="display" weight="bold" className="text-danger" as="p">
                  {goodsReceipts.filter((receipt) => receipt.status === 'Discrepancy').length}
                </Text>
              </CardBody>
            </Card>
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}
