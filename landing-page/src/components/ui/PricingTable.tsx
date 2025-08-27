'use client';

import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { Icons } from '../icons';

export default function PricingTable() {
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
        {/* first row */}
        <TableRow key="1">
          <TableCell>
            <p className="font-bold text-lg text-content1-foreground mb-3">Credits / Month</p>
            <p className="text-content1-foreground">
              The number of credits you can use monthly for AI tasks, searches, or analysis.{' '}
              <span className="text-primary underline hover:cursor-pointer">Know more</span>
            </p>
          </TableCell>
          <TableCell>500</TableCell>
          <TableCell>5000</TableCell>
          <TableCell>Unlimited</TableCell>
        </TableRow>

        {/* second row */}
        <TableRow key="2">
          <TableCell>
            <p className="font-bold text-lg text-content1-foreground mb-3">Api Access</p>
            <p className="text-content1-foreground">
              Ability to connect your own systems to SupplySense via API for automated workflows.{' '}
              <span className="text-primary underline hover:cursor-pointer">Know more</span>
            </p>
          </TableCell>
          <TableCell>
            <div className="flex justify-center items-center">
              <Icons.Cross className="w-5 h-5 text-danger" />
            </div>
          </TableCell>
          <TableCell>
            <div className="flex justify-center items-center">
              <Icons.Verified className="w-5 h-5 text-success" />
            </div>
          </TableCell>
          <TableCell>
            <div className="flex justify-center items-center">
              <Icons.Verified className="w-5 h-5 text-success" />
            </div>
          </TableCell>
        </TableRow>

        {/* third row */}
        <TableRow key="3">
          <TableCell>
            <p className="font-bold text-lg text-content1-foreground mb-3">
              API Requests Limit/Month
            </p>
            <p className="text-content1-foreground">
              Maximum number of API calls you can make per month.{' '}
              <span className="text-primary underline hover:cursor-pointer">Know more</span>
            </p>
          </TableCell>
          <TableCell>
            <div className="flex justify-center items-center">
              <Icons.Cross className="w-5 h-5 text-danger" />
            </div>
          </TableCell>
          <TableCell>50,000</TableCell>
          <TableCell>Unlimited</TableCell>
        </TableRow>

        {/* fourth row */}
        <TableRow key="4">
          <TableCell>
            <p className="font-bold text-lg text-content1-foreground mb-3">Bulk Import/Export</p>
            <p className="text-content1-foreground">
              Ability to connect your own systems to SupplySense via API for automated workflows.{' '}
              <span className="text-primary underline hover:cursor-pointer">Know more</span>
            </p>
          </TableCell>
          <TableCell>
            <div className="flex justify-center items-center">
              <Icons.Cross className="w-5 h-5 text-danger" />
            </div>
          </TableCell>
          <TableCell>
            <div className="flex justify-center items-center">
              <Icons.Verified className="w-5 h-5 text-success" />
            </div>
          </TableCell>
          <TableCell>
            <div className="flex justify-center items-center">
              <Icons.Verified className="w-5 h-5 text-success" />
            </div>
          </TableCell>
        </TableRow>

        {/* fifth row */}
        <TableRow key="5">
          <TableCell>
            <p className="font-bold text-lg text-content1-foreground mb-3">Priority Support</p>
            <p className="text-content1-foreground">
              Ability to connect your own systems to SupplySense via API for automated workflows.{' '}
              <span className="text-primary underline hover:cursor-pointer">Know more</span>
            </p>
          </TableCell>
          <TableCell>
            <div className="flex justify-center items-center">
              <Icons.Cross className="w-5 h-5 text-danger" />
            </div>
          </TableCell>
          <TableCell>
            <div className="flex justify-center items-center">
              <Icons.Verified className="w-5 h-5 text-success" />
            </div>
          </TableCell>
          <TableCell>
            <div className="flex justify-center items-center">
              <Icons.Verified className="w-5 h-5 text-success" />
            </div>
          </TableCell>
        </TableRow>

        {/* sixth row */}
        <TableRow key="6">
          <TableCell>
            <p className="font-bold text-lg text-content1-foreground mb-3">Early Beta Access</p>
            <p className="text-content1-foreground">
              Ability to connect your own systems to SupplySense via API for automated workflows.{' '}
              <span className="text-primary underline hover:cursor-pointer">Know more</span>
            </p>
          </TableCell>
          <TableCell>
            <div className="flex justify-center items-center">
              <Icons.Cross className="w-5 h-5 text-danger" />
            </div>
          </TableCell>
          <TableCell>
            <div className="flex justify-center items-center">
              <Icons.Verified className="w-5 h-5 text-success" />
            </div>
          </TableCell>
          <TableCell>
            <div className="flex justify-center items-center">
              <Icons.Verified className="w-5 h-5 text-success" />
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
