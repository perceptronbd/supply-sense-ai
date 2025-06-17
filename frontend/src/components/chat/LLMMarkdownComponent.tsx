import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { type LLMOutputComponent } from '@llm-ui/react';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './LLMMarkdown.css';

/**
 * Enhanced Markdown component for LLM output with table support
 * Uses react-markdown with GitHub Flavored Markdown (GFM) plugin
 */
const LLMMarkdownComponent: LLMOutputComponent = ({ blockMatch }) => {
  const markdown = blockMatch.output; // Helper function to detect cell content type and apply appropriate styling
  const getCellColor = (content: React.ReactNode) => {
    const text = typeof content === 'string' ? content : content?.toString() || '';
    const upperText = text.trim().toUpperCase();

    if (['CONFIRMED', 'APPROVED', 'ACTIVE', 'COMPLETED', 'SUCCESS'].includes(upperText)) {
      return 'text-success';
    }
    if (['PENDING', 'DRAFT', 'WAITING', 'IN_PROGRESS'].includes(upperText)) {
      return 'text-warning';
    }
    if (['REJECTED', 'CANCELLED', 'INACTIVE', 'FAILED', 'ERROR'].includes(upperText)) {
      return 'text-danger';
    }

    // Detect numbers
    if (/^\d+(\.\d+)?$/.test(text.trim())) {
      return 'text-default-600 font-mono';
    }

    // Detect dates
    if (/^\d{4}-\d{2}-\d{2}/.test(text.trim()) || /^\d{2}\/\d{2}\/\d{4}/.test(text.trim())) {
      return 'text-default-600';
    }

    return 'text-default-700';
  };

  return (
    <div className="llm-markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Enhanced table using HeroUI components for better UX and consistency
          table: ({ children }) => {
            // Extract table structure for HeroUI Table
            const childrenArray = React.Children.toArray(children);
            const theadElement = childrenArray.find((child: any) => child?.type === 'thead');
            const tbodyElement = childrenArray.find((child: any) => child?.type === 'tbody');

            if (!theadElement || !tbodyElement) {
              // Fallback to regular table if structure is unexpected
              return (
                <div className="my-6 w-full overflow-x-auto">
                  <table className="w-full border-collapse">{children}</table>
                </div>
              );
            }

            // Extract headers
            const theadChildren = React.Children.toArray((theadElement as any)?.props?.children);
            const headerRow = theadChildren[0] as any;
            const headerCells = headerRow ? React.Children.toArray(headerRow.props?.children) : [];
            const columns = headerCells.map((cell: any, index: number) => ({
              key: `col-${index}`,
              label: cell?.props?.children || `Column ${index + 1}`,
            }));

            // Extract rows
            const tbodyChildren = React.Children.toArray((tbodyElement as any)?.props?.children);
            const rows = tbodyChildren.map((row: any, rowIndex: number) => {
              const rowCells = React.Children.toArray(row?.props?.children || []);
              const rowData: { key: string; [key: string]: any } = {
                key: `row-${rowIndex}`,
              };
              rowCells.forEach((cell: any, cellIndex: number) => {
                rowData[`col-${cellIndex}`] = cell?.props?.children;
              });
              return rowData;
            });

            return (
              <div className="my-6 w-full">
                <Table
                  aria-label="LLM generated data table"
                  classNames={{
                    wrapper: 'shadow-md rounded-lg border border-divider overflow-hidden',
                    th: 'bg-default-100 text-default-700 font-semibold border-b border-divider',
                    td: 'border-b border-divider',
                    table: 'min-w-[1000px]',
                  }}
                >
                  <TableHeader columns={columns}>
                    {(column) => (
                      <TableColumn key={column.key} className="text-left">
                        {column.label}
                      </TableColumn>
                    )}
                  </TableHeader>
                  <TableBody items={rows}>
                    {(item) => (
                      <TableRow key={item.key}>
                        {columns.map((column) => (
                          <TableCell key={column.key} className={getCellColor(item[column.key])}>
                            {item[column.key]}
                          </TableCell>
                        ))}
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {/* Mobile scroll hint */}
                <div className="text-xs text-default-500 mt-2 text-center sm:hidden">
                  ← Scroll horizontally to see more columns →
                </div>
              </div>
            );
          },
          // Custom heading styling
          h1: ({ children, ...props }) => (
            <h1
              className="text-2xl font-bold mt-6 mb-4 text-gray-900 dark:text-gray-100"
              {...props}
            >
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2
              className="text-xl font-semibold mt-5 mb-3 text-gray-900 dark:text-gray-100"
              {...props}
            >
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3
              className="text-lg font-medium mt-4 mb-2 text-gray-900 dark:text-gray-100"
              {...props}
            >
              {children}
            </h3>
          ),
          // Custom list styling
          ul: ({ children, ...props }) => (
            <ul
              className="list-disc list-inside my-3 space-y-1 text-gray-700 dark:text-gray-300"
              {...props}
            >
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol
              className="list-decimal list-inside my-3 space-y-1 text-gray-700 dark:text-gray-300"
              {...props}
            >
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="ml-4" {...props}>
              {children}
            </li>
          ),
          // Custom paragraph styling
          p: ({ children, ...props }) => (
            <p className="my-2 text-gray-700 dark:text-gray-300 leading-relaxed" {...props}>
              {children}
            </p>
          ),
          // Custom emphasis styling
          strong: ({ children, ...props }) => (
            <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em className="italic text-gray-800 dark:text-gray-200" {...props}>
              {children}
            </em>
          ),
          // Custom code styling
          code: ({ children, ...props }) => (
            <code
              className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono text-gray-800 dark:text-gray-200"
              {...props}
            >
              {children}
            </code>
          ),
          // Custom blockquote styling
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="border-l-4 border-blue-500 pl-4 my-4 italic text-gray-600 dark:text-gray-400"
              {...props}
            >
              {children}
            </blockquote>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
};

export default LLMMarkdownComponent;
