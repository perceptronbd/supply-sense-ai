'use client';

import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { ReactNode, useState } from 'react';
import { tableData } from './TableData';

const PricingMobileTables = () => {
  const [view1, setView1] = useState(false);
  const [view2, setView2] = useState(false);
  const [view3, setView3] = useState(false);

  const visibleRows1 = view1 ? tableData : tableData.slice(0, 4);
  const visibleRows2 = view2 ? tableData : tableData.slice(0, 4);
  const visibleRows3 = view3 ? tableData : tableData.slice(0, 4);

  const ValueCell = ({ value }: { value: ReactNode | string }) => {
    if (typeof value === 'string') {
      return <span className="flex-1 text-center">{value}</span>;
    }
    return <div className="flex-1 flex justify-center items-center">{value}</div>;
  };

  return (
    <>
      {/* starter table */}
      <Table
        aria-label="Pricing Table - Starter"
        classNames={{
          base: '',
          wrapper:
            'bg-gradient-to-r from-primary/10 to-secondary/5 border-1 border-default rounded-lg',
          tr: 'border-b-2 border-default-200',
          th: 'bg-transparent',
          td: 'md:py-5 py-3',
          tbody: 'bg-default-100',
        }}
        bottomContent={
          <Button color="primary" size="sm" variant="light" onPress={() => setView1(!view1)}>
            {view1 ? 'View Less' : 'View More'}
          </Button>
        }
      >
        <TableHeader>
          <TableColumn align="center">
            <h3 className="font-bold text-content1-foreground text-lg">
              Starter <br />
              <span className="text-primary text-2xl font-brand">$9.99</span>
              <span className="text-lg font-medium">/Month</span>
            </h3>
          </TableColumn>
        </TableHeader>
        <TableBody>
          {visibleRows1.map((row) => (
            <TableRow key={row.id}>
              <TableCell align="left">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-content1-foreground flex-1 text-start">
                    {row.featureName}
                  </p>
                  <ValueCell value={row.values[0]} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* business table */}
      <Table
        aria-label="Pricing Table - Business"
        classNames={{
          base: '',
          wrapper:
            'bg-gradient-to-r from-primary/10 to-secondary/5 border-1 border-default rounded-lg',
          tr: 'border-b-2 border-default-200',
          th: 'bg-transparent',
          td: 'md:py-5 py-3',
          tbody: 'bg-default-100',
        }}
        bottomContent={
          <Button color="primary" size="sm" variant="light" onPress={() => setView2(!view2)}>
            {view2 ? 'View Less' : 'View More'}
          </Button>
        }
      >
        <TableHeader>
          <TableColumn align="center">
            <h3 className="font-bold text-content1-foreground text-lg">
              Business <br />
              <span className="text-primary text-2xl font-brand">$99.99</span>
              <span className="text-lg font-medium">/Month</span>
            </h3>
          </TableColumn>
        </TableHeader>
        <TableBody>
          {visibleRows2.map((row) => (
            <TableRow key={row.id}>
              <TableCell align="left">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-content1-foreground flex-1 text-start">
                    {row.featureName}
                  </p>
                  <ValueCell value={row.values[1]} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* enterprise table */}
      <Table
        aria-label="Pricing Table - Enterprise"
        classNames={{
          base: '',
          wrapper:
            'bg-gradient-to-r from-primary/10 to-secondary/5 border-1 border-default rounded-lg',
          tr: 'border-b-2 border-default-200',
          th: 'bg-transparent',
          td: 'md:py-5 py-3',
          tbody: 'bg-default-100',
        }}
        bottomContent={
          <Button color="primary" size="sm" variant="light" onPress={() => setView3(!view3)}>
            {view3 ? 'View Less' : 'View More'}
          </Button>
        }
      >
        <TableHeader>
          <TableColumn align="center">
            <h3 className="font-bold text-content1-foreground text-lg">
              Enterprise <br />
              <span className="text-primary text-2xl font-brand">Custom</span>
            </h3>
          </TableColumn>
        </TableHeader>
        <TableBody>
          {visibleRows3.map((row) => (
            <TableRow key={row.id}>
              <TableCell align="left">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-content1-foreground flex-1 text-start">
                    {row.featureName}
                  </p>
                  <ValueCell value={row.values[2]} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

export default PricingMobileTables;
