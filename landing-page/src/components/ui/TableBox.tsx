'use client';

import {
  Card,
  CardBody,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';

const TableBox = () => {
  return (
    <div className="rounded-xl bg-layout-divider/4 border-1 border-layout-divider/15 p-8 card-blur-effect-3">
      <Card
        classNames={{
          base: 'p-5 card-blur-effect-move bg-default-200',
        }}
      >
        <CardBody className="">
          <div className="flex justify-end">
            <p className="px-4 py-3 bg-gradient-to-r from-default-300 to-default-400 rounded-lg rounded-br-none mb-5 text-sm text-default-foreground w-fit">
              Show suppliers with low performance
            </p>
          </div>

          <p className="text-sm text-default-foreground mb-5">
            Here's a summary of suppliers with potentially low performance based on order history
            and lead times. Supplier Performance Overview
          </p>

          <p className="text-sm text-default-foreground font-bold mb-2">
            Supplier Performance Overview
          </p>

          {/* table here */}

          <div className="overflow-x-auto">
            <Table
              shadow="none"
              removeWrapper={true}
              classNames={{
                base: 'w-full',
                th: 'bg-default-100 text-default-foreground text-sm border-default-300 border-2 rounded-none',
                td: 'border-default-300 py-4 px-2 border-2 text-xs md:text-sm text-default-foreground',
                thead: "[&>tr]:first:rounded-none [&>tr[aria-hidden='true']]:hidden",
              }}
              aria-label="Supply performance table"
            >
              <TableHeader>
                <TableColumn>Supplier Name</TableColumn>
                <TableColumn>Supplier Code</TableColumn>
                <TableColumn>Total Orders</TableColumn>
              </TableHeader>
              <TableBody>
                <TableRow key="1">
                  <TableCell>Packaging World Corp.</TableCell>
                  <TableCell>SUP003-62A7</TableCell>
                  <TableCell>0</TableCell>
                </TableRow>
                <TableRow key="2">
                  <TableCell>Packaging World Corp.</TableCell>
                  <TableCell>SUP003-62A7</TableCell>
                  <TableCell>0</TableCell>
                </TableRow>
                <TableRow key="3">
                  <TableCell>Packaging World Corp.</TableCell>
                  <TableCell>SUP003-62A7</TableCell>
                  <TableCell>0</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default TableBox;
