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

export default function PurchaseOrdersPage() {
  const _router = useRouter();

  // Mock data for the table
  const purchaseOrders = [
    {
      id: 'PO001',
      supplier: 'ABC Supplies Inc.',
      orderDate: '2025-06-08',
      expectedDelivery: '2025-06-15',
      status: 'Confirmed',
      totalAmount: '$2,450.00',
      items: 15,
    },
    {
      id: 'PO002',
      supplier: 'Tech Solutions Ltd.',
      orderDate: '2025-06-07',
      expectedDelivery: '2025-06-14',
      status: 'Shipped',
      totalAmount: '$1,800.00',
      items: 8,
    },
    {
      id: 'PO003',
      supplier: 'Industrial Materials Co.',
      orderDate: '2025-06-06',
      expectedDelivery: '2025-06-13',
      status: 'Delivered',
      totalAmount: '$3,200.00',
      items: 25,
    },
    {
      id: 'PO004',
      supplier: 'Office Plus',
      orderDate: '2025-06-05',
      expectedDelivery: '2025-06-12',
      status: 'Pending',
      totalAmount: '$450.00',
      items: 12,
    },
    {
      id: 'PO005',
      supplier: 'Safety First Equipment',
      orderDate: '2025-06-04',
      expectedDelivery: '2025-06-11',
      status: 'Confirmed',
      totalAmount: '$670.00',
      items: 6,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'text-green-600 bg-green-100';
      case 'Shipped':
        return 'text-blue-600 bg-blue-100';
      case 'Confirmed':
        return 'text-purple-600 bg-purple-100';
      case 'Pending':
        return 'text-yellow-600 bg-yellow-100';
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
              <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
              <p className="text-gray-600 mt-2">Track and manage all purchase orders</p>
            </div>
            <Button
              color="primary"
              onPress={() => alert('Create new order functionality coming soon!')}
            >
              Create New Order
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <h3 className="text-xl font-semibold">All Purchase Orders</h3>
            </CardHeader>
            <CardBody>
              <Table aria-label="Purchase orders table">
                <TableHeader>
                  <TableColumn>ORDER ID</TableColumn>
                  <TableColumn>SUPPLIER</TableColumn>
                  <TableColumn>ORDER DATE</TableColumn>
                  <TableColumn>EXPECTED DELIVERY</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>ITEMS</TableColumn>
                  <TableColumn>TOTAL AMOUNT</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.supplier}</TableCell>
                      <TableCell>{order.orderDate}</TableCell>
                      <TableCell>{order.expectedDelivery}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell>{order.items}</TableCell>
                      <TableCell className="font-medium">{order.totalAmount}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="flat" color="primary">
                            View
                          </Button>
                          <Button size="sm" variant="flat" color="secondary">
                            Track
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
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Orders</h3>
                <p className="text-3xl font-bold text-blue-600">{purchaseOrders.length}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Pending</h3>
                <p className="text-3xl font-bold text-yellow-600">
                  {purchaseOrders.filter((order) => order.status === 'Pending').length}
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Shipped</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {purchaseOrders.filter((order) => order.status === 'Shipped').length}
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Delivered</h3>
                <p className="text-3xl font-bold text-green-600">
                  {purchaseOrders.filter((order) => order.status === 'Delivered').length}
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
