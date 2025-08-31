'use client';

import {
  Button,
  Card,
  CardBody,
  Input,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { Icons } from '../icons';

const TableBox = () => {
  return (
    <div className="rounded-xl bg-default-100//30 border-1 border-default-100 p-10 card-blur-effect-3">
      <Card
        classNames={{
          base: 'p-4 card-blur-effect-move bg-default-200 tilted-cylinder-glow',
        }}
      >
        <CardBody className="">
          <div className="flex justify-end">
            <p className="px-4 py-3 bg-gradient-to-r from-default-300 to-default-400 rounded-lg rounded-br-none mb-5 text-xs text-default-foreground w-fit">
              Show suppliers with low performance
            </p>
          </div>

          <p className="text-xs text-default-foreground mb-5">
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
                td: 'border-default-300 py-2 px-2 border-2 text-xs text-default-foreground',
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

          <form className="relative pt-5">
            <Input
              placeholder="Ask anything about your business"
              radius="md"
              variant="flat"
              size="lg"
              classNames={{
                input: 'placeholder:text-content3 placeholder:text-sm',
                inputWrapper: 'bg-content1 py-5 card-blur-effect-alt',
              }}
            />
            <Button
              type="submit"
              radius="md"
              isIconOnly
              color="primary"
              variant="light"
              size="sm"
              className="w-10 h-10 absolute right-2 top-1/2 -translate-y-1/4 mr-2"
            >
              <Icons.SendIcon className="w-7 h-7" />
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default TableBox;
