'use client';

import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { ReactNode } from 'react';
import { tableData } from './TableData';

export default function PricingTable() {
  const ValueCell = ({ value }: { value: ReactNode | string }) => {
    if (typeof value === 'string') {
      return <span>{value}</span>;
    }
    return <div className="flex justify-center items-center">{value}</div>;
  };

  return (
    <Table
      aria-label="Pricing Table"
      classNames={{
        base: '',
        wrapper:
          'bg-gradient-to-r from-primary/10 to-secondary/5 border-1 border-default rounded-lg',
        tr: 'border-b-2 border-default-200',
        th: 'bg-transparent',
        tbody: 'bg-default-100',
      }}
    >
      {/* table header */}
      <TableHeader>
        <TableColumn>
          <h2 className="font-brand font-bold text-content1-foreground text-3xl">Features</h2>
        </TableColumn>
        <TableColumn align="center">
          <h3 className="font-bold text-content1-foreground text-2xl">
            Starter <br />
            <span className="text-primary text-3xl font-brand">$9.99</span>
            <span className="text-lg font-medium">/Month</span>
          </h3>
        </TableColumn>
        <TableColumn align="center">
          <h3 className="font-bold text-content1-foreground text-2xl">
            Business <br />
            <span className="text-primary text-3xl font-brand">$99.99</span>
            <span className="text-lg font-medium">/Month</span>
          </h3>
        </TableColumn>
        <TableColumn align="center">
          <h3 className="font-bold text-content1-foreground text-2xl">
            Enterprise <br />
            <span className="text-primary text-3xl font-brand">Custom</span>
          </h3>
        </TableColumn>
      </TableHeader>
      <TableBody>
        {tableData.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <p className="font-bold text-lg text-content1-foreground mb-3">{row.featureName}</p>
              <p className="text-content1-foreground">
                {row.description}{' '}
                <span className="text-primary underline hover:cursor-pointer">Know more</span>
              </p>
            </TableCell>

            {/* Starter Column */}
            <TableCell>
              <ValueCell value={row.values[0]} />
            </TableCell>

            {/* Business Column */}
            <TableCell>
              <ValueCell value={row.values[1]} />
            </TableCell>

            {/* Enterprise Column */}
            <TableCell>
              <ValueCell value={row.values[2]} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
