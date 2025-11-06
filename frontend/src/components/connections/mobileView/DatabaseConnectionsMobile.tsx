'use client';

import {
  Button,
  Card,
  CardBody,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Spinner,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { DatabaseConnection } from 'types/db-connection.type';
import { Text } from '@/components/ui/Text';
import { Icons } from '@/lib/icons/Icons';

interface DatabaseConnectionsMobileProps {
  databaseConnections: DatabaseConnection[] | undefined;
  isLoadingConnections: boolean;
  connectionsError: unknown;
}

export function DatabaseConnectionsMobile({
  databaseConnections,
  isLoadingConnections,
  connectionsError,
}: Readonly<DatabaseConnectionsMobileProps>) {
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const renderMobileCard = (connection: DatabaseConnection) => {
    const status = connection.sslEnabled ? 'connected' : 'disconnected';
    const isMenuOpen = openMenuId === connection.id;
    const setIsMenuOpen = (isOpen: boolean) => setOpenMenuId(isOpen ? connection.id : null);

    return (
      <Card key={connection.id}>
        <CardBody>
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <Text variant="titleSmall" color="primary">
                {connection.title}
              </Text>
              <Chip color={status === 'connected' ? 'success' : 'danger'} variant="flat" size="sm">
                <Text variant="label" color={status === 'connected' ? 'success' : 'danger'}>
                  {status === 'connected' ? 'Connected' : 'Disconnected'}
                </Text>
              </Chip>
            </div>
            <Dropdown isOpen={isMenuOpen} onOpenChange={setIsMenuOpen} placement="bottom-end">
              <DropdownTrigger>
                <Button isIconOnly variant="light" size="sm">
                  <Icons.EllipsisHorizontal className="w-4 h-4" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Connection actions"
                variant="flat"
                itemClasses={{ base: 'text-default-500' }}
              >
                <DropdownItem
                  key="manage"
                  className="group"
                  onPress={() => router.push(`/connections/${connection.id}`)}
                  startContent={<Icons.Settings className="w-4 h-4 group-hover:text-foreground" />}
                >
                  <Text variant="bodySmall" color="muted" className="group-hover:text-foreground">
                    Manage
                  </Text>
                </DropdownItem>
                <DropdownItem
                  key="refresh"
                  className="group"
                  startContent={<Icons.RefreshCw className="w-4 h-4 group-hover:text-foreground" />}
                >
                  <Text variant="bodySmall" color="muted" className="group-hover:text-foreground">
                    Refresh Schema
                  </Text>
                </DropdownItem>
                <DropdownItem
                  key="remove"
                  className="group"
                  startContent={<Icons.Trash className="w-4 h-4 group-hover:text-foreground" />}
                >
                  <Text variant="bodySmall" color="muted" className="group-hover:text-foreground">
                    Remove
                  </Text>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Text variant="bodySmall" color="muted">
                Host:
              </Text>
              <Text variant="bodySmall" color="default">
                {connection.host}:{connection.port}
              </Text>
            </div>
            <div className="flex justify-between items-center">
              <Text variant="bodySmall" color="muted">
                Database:
              </Text>
              <Text variant="bodySmall" color="default">
                {connection.database}
              </Text>
            </div>
            <div className="flex justify-between items-center">
              <Text variant="bodySmall" color="muted">
                User:
              </Text>
              <Text variant="bodySmall" color="default">
                {connection.username}
              </Text>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  };

  // --- handle different states
  if (isLoadingConnections) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8">
        <Spinner size="sm" />
        <Text variant="bodySmall" color="secondary">
          Loading connections...
        </Text>
      </div>
    );
  }

  if (connectionsError) {
    return (
      <div className="flex items-center justify-center py-8">
        <Text variant="bodySmall" color="danger">
          Failed to load connections.
        </Text>
      </div>
    );
  }

  if (!databaseConnections || databaseConnections.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Text variant="bodySmall">No connections found.</Text>
      </div>
    );
  }

  return (
    <div className="md:hidden space-y-4">
      {databaseConnections.map((connection) => renderMobileCard(connection))}
    </div>
  );
}
