'use client';

import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';

interface RenderTableProps {
  data: Record<string, string>[];
}

export const RenderTable = ({ data }: RenderTableProps) => {
  // Handle empty data case
  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

  const { id, ...restKeys } = data[0];
  // Extract column keys from the first data object
  const columnKeys = Object.keys(restKeys);

  // Create column labels by capitalizing the keys
  const columns = columnKeys.map((key) => ({
    key,
    label:
      key.charAt(0).toUpperCase() +
      key
        .slice(1)
        .replace(/([A-Z])/g, ' $1')
        .trim(),
  }));

  return (
    <div className="overflow-x-auto w-full">
      <Table
        aria-label="Data table"
        classNames={{
          base: 'min-w-full',
          table: 'min-w-full',
          th: 'text-left',
          td: 'text-left',
        }}
      >
        <TableHeader>
          {columns.map((column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          ))}
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={row.id || index}>
              {columnKeys.map((key) => (
                <TableCell key={key}>{row[key]}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
