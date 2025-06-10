'use client';

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
import AuthGuard from '../../components/AuthGuard';

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
        return 'text-green-600 bg-green-100';
      case 'Partial':
        return 'text-blue-600 bg-blue-100';
      case 'Pending Review':
        return 'text-yellow-600 bg-yellow-100';
      case 'Discrepancy':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <AuthGuard requireAuth={true}>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Goods Receipts</h1>
              <p className="text-gray-600 mt-2">Track and manage all incoming goods receipts</p>
            </div>
            <Button
              color="primary"
              onPress={() => alert('Create new receipt functionality coming soon!')}
            >
              Record New Receipt
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <h3 className="text-xl font-semibold">All Goods Receipts</h3>
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
                      <TableCell className="font-medium text-blue-600">
                        {receipt.poNumber}
                      </TableCell>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            <Card>
              <CardBody className="text-center p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Receipts</h3>
                <p className="text-3xl font-bold text-blue-600">{goodsReceipts.length}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Completed</h3>
                <p className="text-3xl font-bold text-green-600">
                  {goodsReceipts.filter((receipt) => receipt.status === 'Completed').length}
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Pending Review</h3>
                <p className="text-3xl font-bold text-yellow-600">
                  {goodsReceipts.filter((receipt) => receipt.status === 'Pending Review').length}
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Discrepancies</h3>
                <p className="text-3xl font-bold text-red-600">
                  {goodsReceipts.filter((receipt) => receipt.status === 'Discrepancy').length}
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
