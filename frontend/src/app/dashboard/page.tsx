'use client';

import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import AuthGuard from '../../components/AuthGuard';
import type { RootState } from '../../store/store';

export default function DashboardPage() {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Welcome back, {user?.firstName} {user?.lastName}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardBody className="text-center p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Purchase Requests</h3>
                <p className="text-3xl font-bold text-blue-600">24</p>
                <p className="text-sm text-gray-500">Active requests</p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Purchase Orders</h3>
                <p className="text-3xl font-bold text-green-600">18</p>
                <p className="text-sm text-gray-500">In progress</p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Goods Receipts</h3>
                <p className="text-3xl font-bold text-purple-600">12</p>
                <p className="text-sm text-gray-500">Pending review</p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">AI Insights</h3>
                <p className="text-3xl font-bold text-orange-600">7</p>
                <p className="text-sm text-gray-500">Recommendations</p>
              </CardBody>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <h3 className="text-xl font-semibold">User Information</h3>
              </CardHeader>
              <CardBody className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <span className="ml-2 text-gray-600">{user?.email}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Role:</span>
                  <span className="ml-2 text-gray-600">{user?.role}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Branch ID:</span>
                  <span className="ml-2 text-gray-600">{user?.branchId}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className={`ml-2 ${user?.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {user?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <h3 className="text-xl font-semibold">Quick Actions</h3>
              </CardHeader>
              <CardBody className="space-y-3">
                <Button
                  color="primary"
                  variant="flat"
                  className="w-full justify-start"
                  onPress={() => router.push('/purchase-requests')}
                >
                  Create Purchase Request
                </Button>
                <Button
                  color="secondary"
                  variant="flat"
                  className="w-full justify-start"
                  onPress={() => router.push('/purchase-orders')}
                >
                  View Purchase Orders
                </Button>
                <Button
                  color="success"
                  variant="flat"
                  className="w-full justify-start"
                  onPress={() => router.push('/goods-receipts')}
                >
                  Manage Goods Receipts
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
