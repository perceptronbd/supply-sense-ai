import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { type LLMOutputComponent } from '@llm-ui/react';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
    <div className="w-full max-w-full overflow-hidden break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Enhanced table using HeroUI components for better UX and consistency
          table: ({ children }) => {
            // Extract table structure for HeroUI Table
            const childrenArray = React.Children.toArray(children);
            const theadElement = childrenArray.find(
              (child: unknown) => (child as { type?: string })?.type === 'thead'
            );
            const tbodyElement = childrenArray.find(
              (child: unknown) => (child as { type?: string })?.type === 'tbody'
            );

            if (!theadElement || !tbodyElement) {
              // Fallback to regular table if structure is unexpected
              return (
                <div className="my-6 w-full overflow-x-auto">
                  <table className="w-full border-collapse">{children}</table>
                </div>
              );
            }

            // Extract headers
            const theadChildren = React.Children.toArray(
              (
                theadElement as unknown as {
                  props: { children: React.ReactNode };
                }
              )?.props?.children
            );
            const headerRow = theadChildren[0] as unknown as {
              props: { children: React.ReactNode };
            };
            const headerCells = headerRow ? React.Children.toArray(headerRow.props?.children) : [];
            const columns = headerCells.map((cell: unknown, index: number) => ({
              key: `col-${index}`,
              label:
                (cell as { props: { children: React.ReactNode } })?.props?.children ||
                `Column ${index + 1}`,
            }));

            // Extract rows
            const tbodyChildren = React.Children.toArray(
              (
                tbodyElement as unknown as {
                  props: { children: React.ReactNode };
                }
              )?.props?.children
            );
            const rows = tbodyChildren.map((row: unknown, rowIndex: number) => {
              const rowCells = React.Children.toArray(
                (row as { props: { children: React.ReactNode } })?.props?.children || []
              );
              const rowData: { key: string; [key: string]: React.ReactNode } = {
                key: `row-${rowIndex}`,
              };
              rowCells.forEach((cell: unknown, cellIndex: number) => {
                rowData[`col-${cellIndex}`] = (
                  cell as { props: { children: React.ReactNode } }
                )?.props?.children;
              });
              return rowData;
            });

            return (
              <div className="my-6 w-full">
                {/* Scrollable wrapper for horizontal scrolling */}
                <div className="w-full overflow-x-auto border border-divider rounded-lg shadow-md">
                  <Table
                    aria-label="LLM generated data table"
                    removeWrapper
                    classNames={{
                      th: 'bg-default-100 text-default-700 font-semibold border-b border-divider whitespace-nowrap',
                      td: 'border-b border-divider whitespace-nowrap',
                      table: 'min-w-[800px] w-max',
                    }}
                  >
                    <TableHeader columns={columns}>
                      {(column) => (
                        <TableColumn key={column.key} className="text-left px-4 py-3">
                          {column.label}
                        </TableColumn>
                      )}
                    </TableHeader>
                    <TableBody items={rows}>
                      {(item) => (
                        <TableRow key={item.key}>
                          {columns.map((column) => (
                            <TableCell
                              key={column.key}
                              className={`px-4 py-3 ${getCellColor(item[column.key])}`}
                            >
                              {item[column.key]}
                            </TableCell>
                          ))}
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                {/* Mobile scroll hint */}
                <div className="text-xs text-default-500 mt-2 text-center sm:hidden">
                  ← Scroll horizontally to see more columns →
                </div>
              </div>
            );
          }, // Custom heading styling with HeroUI tokens
          h1: ({ children, ...props }) => (
            <h1 className="text-2xl font-bold mt-6 mb-4 text-foreground" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-xl font-semibold mt-5 mb-3 text-foreground" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-lg font-medium mt-4 mb-2 text-foreground" {...props}>
              {children}
            </h3>
          ),
          // Custom list styling with HeroUI tokens
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside my-3 space-y-1 text-default-700" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside my-3 space-y-1 text-default-700" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="ml-4" {...props}>
              {children}
            </li>
          ),
          // Custom paragraph styling with HeroUI tokens
          p: ({ children, ...props }) => (
            <p className="text-default-700 leading-relaxed" {...props}>
              {children}
            </p>
          ),
          // Custom emphasis styling with HeroUI tokens
          strong: ({ children, ...props }) => (
            <strong className="font-semibold text-foreground" {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em className="italic text-default-800" {...props}>
              {children}
            </em>
          ),
          // Custom code styling with HeroUI tokens
          code: ({ children, ...props }) => (
            <code
              className="bg-default-100 px-1 py-0.5 rounded text-sm font-mono text-default-800"
              {...props}
            >
              {children}
            </code>
          ),
          // Custom blockquote styling with HeroUI tokens
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="border-l-4 border-primary pl-4 my-4 italic text-default-600"
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
