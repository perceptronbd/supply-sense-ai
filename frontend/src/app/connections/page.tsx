'use client';
import {
  Button,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import type { DatabaseConnection } from 'types/db-connection.type';
import { Text } from '@/components/ui/Text';
import { useDatabaseConnections } from '@/hooks/useDatabaseConnections';
import { Icons } from '@/lib/icons/Icons';

interface Column {
  key: string;
  label: string;
}

const columns: Column[] = [
  { key: 'title', label: 'NAME' },
  { key: 'status', label: 'STATUS' },
  { key: 'host', label: 'HOST' },
  { key: 'database', label: 'DATABASE' },
  { key: 'username', label: 'USER' },
  { key: 'actions', label: 'ACTION' },
];

export default function DatabaseConnectionsPage() {
  const router = useRouter();
  const { databaseConnections, isLoadingConnections, connectionsError } = useDatabaseConnections();

  const renderCell = (connection: DatabaseConnection, columnKey: React.Key): React.ReactNode => {
    const key = columnKey as string;

    switch (key) {
      case 'title':
        return (
          <Text variant="bodySmall" weight="medium">
            {connection.title}
          </Text>
        );

      case 'status': {
        const status: 'connected' | 'disconnected' = connection.sslEnabled
          ? 'connected'
          : 'disconnected';

        return (
          <Chip color={status === 'connected' ? 'success' : 'danger'} variant="flat" size="sm">
            <Text variant="label" color={status === 'connected' ? 'success' : 'danger'}>
              {status === 'connected' ? 'Connected' : 'Disconnected'}
            </Text>
          </Chip>
        );
      }

      case 'host':
        return (
          <Text variant="bodySmall" color="default">
            {connection.host}:{connection.port}
          </Text>
        );

      case 'database':
        return (
          <Text variant="bodySmall" color="default">
            {connection.database}
          </Text>
        );

      case 'username':
        return (
          <Text variant="bodySmall" color="default">
            {connection.username}
          </Text>
        );

      case 'actions':
        return (
          <div className="flex justify-center">
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Button isIconOnly variant="light" size="sm">
                  <Icons.EllipsisHorizontal className="w-4 h-4" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Connection actions"
                variant="flat"
                itemClasses={{
                  base: 'text-default-500',
                }}
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
        );

      default:
        return null;
    }
  };

  return (
    <main className="w-full h-full bg-background lg:flex gap-2">
      <div className="flex flex-col h-full w-full p-6 relative text-foreground rounded-xl bg-content2 flex-1">
        <div className="flex justify-between items-start mb-6">
          <div>
            <Text variant="headerSmall" weight={'semiBold'}>
              Database Connections
            </Text>
            <Text variant="bodyMedium" color="secondary" className="mt-1">
              Manage your database connections
            </Text>
          </div>
          <Button
            variant="flat"
            color="primary"
            startContent={<Icons.Connection className="w-4 h-4 text-primary" />}
          >
            <Text variant="label" color="primary" weight="medium">
              New Connection
            </Text>
          </Button>
        </div>

        <Table
          aria-label="Database connections table"
          shadow="none"
          classNames={{
            wrapper: 'bg-default-50',
            th: 'bg-default-100 text-default-500 !rounded-lg',
            tr: 'hover:bg-content1 data-[hover=true]:bg-content1 !rounded-lg',
          }}
        >
          <TableHeader columns={columns}>
            {(column: Column) => (
              <TableColumn key={column.key} align={column.key === 'actions' ? 'center' : 'start'}>
                <Text variant="label" color="muted" weight="medium">
                  {column.label}
                </Text>
              </TableColumn>
            )}
          </TableHeader>

          <TableBody
            items={databaseConnections || []}
            isLoading={isLoadingConnections}
            loadingContent={
              <div className="flex flex-col items-center justify-center gap-2">
                <Text variant="bodySmall" color="secondary">
                  <Spinner size="sm" />
                  Loading connections...
                </Text>
              </div>
            }
            emptyContent={
              connectionsError ? (
                <Text variant="bodySmall" color="danger">
                  Failed to load connections.
                </Text>
              ) : (
                <Text variant="bodySmall">No connections found.</Text>
              )
            }
          >
            {(item: DatabaseConnection) => (
              <TableRow key={item.id}>
                {(columnKey: React.Key) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
