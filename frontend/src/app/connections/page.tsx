'use client';
import {
  Button,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { MoreVertical, RefreshCw, Settings, Trash2 } from 'lucide-react';
import { Text } from '@/components/ui/Text';
import { Icons } from '@/lib/icons/Icons';

interface Connection {
  key: string;
  name: string;
  status: 'connected' | 'disconnected';
  host: string;
  database: string;
  user: string;
}

interface Column {
  key: string;
  label: string;
}

const connections: Connection[] = [
  {
    key: '1',
    name: 'Outsource Dev',
    status: 'connected',
    host: '127.0.0.1:5462',
    database: 'outsourceddev',
    user: 'mac-teeranon',
  },
  {
    key: '2',
    name: 'Qashup Production',
    status: 'disconnected',
    host: '127.0.0.1:5462',
    database: 'outsourceddev',
    user: 'mac-teeranon',
  },
];

const columns: Column[] = [
  { key: 'name', label: 'NAME' },
  { key: 'status', label: 'STATUS' },
  { key: 'host', label: 'HOST' },
  { key: 'database', label: 'DATABASE' },
  { key: 'user', label: 'USER' },
  { key: 'actions', label: 'ACTION' },
];

export default function DatabaseConnectionsPage() {
  const renderCell = (connection: Connection, columnKey: React.Key): React.ReactNode => {
    const key = columnKey as string;

    switch (key) {
      case 'name':
        return (
          <Text variant="bodySmall" weight="medium">
            {connection.name}
          </Text>
        );

      case 'status':
        return (
          <Chip
            color={connection.status === 'connected' ? 'success' : 'danger'}
            variant="flat"
            size="sm"
          >
            <Text variant="label" color={connection.status === 'connected' ? 'success' : 'danger'}>
              {connection.status === 'connected' ? 'Connected' : 'Disconnected'}
            </Text>
          </Chip>
        );

      case 'host':
        return (
          <Text variant="bodySmall" color="default">
            {connection.host}
          </Text>
        );

      case 'database':
        return (
          <Text variant="bodySmall" color="default">
            {connection.database}
          </Text>
        );

      case 'user':
        return (
          <Text variant="bodySmall" color="default">
            {connection.user}
          </Text>
        );

      case 'actions':
        return (
          <div className="flex justify-center">
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Button isIconOnly variant="light" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Connection actions"
                variant="flat"
                itemClasses={{
                  base: 'text-default-500',
                }}
              >
                <DropdownItem key="manage" startContent={<Settings className="w-4 h-4" />}>
                  <Text variant="bodySmall">Manage</Text>
                </DropdownItem>
                <DropdownItem key="refresh" startContent={<RefreshCw className="w-4 h-4" />}>
                  <Text variant="bodySmall">Refresh Schema</Text>
                </DropdownItem>
                <DropdownItem
                  key="remove"
                  color="danger"
                  startContent={<Trash2 className="w-4 h-4" />}
                >
                  <Text variant="bodySmall" color="danger">
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
          radius="lg"
          shadow="sm"
          classNames={{
            wrapper: 'bg-default-50',
            th: 'bg-default-100 text-default-500',
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
            items={connections}
            emptyContent={<Text variant="bodySmall">No connections found.</Text>}
          >
            {(item: Connection) => (
              <TableRow key={item.key}>
                {(columnKey: React.Key) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
