'use client';
import type { SharedSelection } from '@heroui/react';
import { Chip, Select, SelectItem, SelectSection } from '@heroui/react';
import { handleAsyncOperation } from '@supplysense/utils';
import { useState } from 'react';
import BlinkingLogo from '@/components/ui/animations/BlinkingLogo';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useGetCompanyId } from '@/hooks/useGetCompanyId';
import { Icons } from '@/lib/icons/Icons';
import { cn } from '@/lib/utils';
import { useCaptureMetadataMutation, useGetTablesQuery } from '@/store/api/onboardingApi';
import { useOnboardingStore } from '@/store/hooks/useOnboardingStore';
import Summary from '../Summary';
import type { ICaptureMetadataPayload } from '../types';
import type { ITableDiscoverySelection } from '../types/table-discovery-selection';

// Loading State Component
const LoadingState = ({ selectedTablesCount }: { selectedTablesCount: number }) => (
  <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6">
    <BlinkingLogo size={100} />
    <div className="text-center space-y-3">
      <Text variant="headerSmall" as="h3">
        Capturing Metadata
      </Text>
      <Text variant="bodyBase" color="muted" className="max-w-md">
        We're analyzing your database structure and generating metadata for your selected tables.
        This may take a moment.
      </Text>
    </div>
    <div className="flex items-center gap-2">
      <div className="flex gap-1.5">
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
      </div>
    </div>
    <div className="mt-4 px-6 py-3 bg-default-100 rounded-2xl">
      <Text variant="bodySmall" color="muted" as="p">
        Processing{' '}
        <Text variant="bodySmall" color="secondary" weight="semiBold" as="span">
          {selectedTablesCount}
        </Text>{' '}
        {selectedTablesCount === 1 ? 'table' : 'tables'}
      </Text>
    </div>
  </div>
);

const TableDiscoverySelection = () => {
  // Store selected table keys (tableName)
  const [values, setValues] = useState<SharedSelection>(new Set() as SharedSelection);
  // Store selected table objects
  const [selectedTables, setSelectedTables] = useState<ITableDiscoverySelection['tables']>([]);
  const { companyId } = useGetCompanyId();
  const { dbConnectionId, currentStep, setOnboardingStep, saveGeneratedMetadata } =
    useOnboardingStore();

  const [captureMetadata, { isLoading: isCapturing }] = useCaptureMetadataMutation();
  // Fetch tables based on companyId and dbConnectionId
  const { data: tableResponse = { data: { tables: [] } }, isLoading } = useGetTablesQuery(
    {
      companyId,
      dbConnectionId,
    },
    {
      skip: !(companyId && dbConnectionId && currentStep === 2),
    }
  );

  // Create table options
  const tableOptions = tableResponse.data.tables
    .filter(({ tableName }) => tableName.toLowerCase() !== '_prisma_migrations')
    .map(({ tableName, displayName }) => ({
      key: tableName,
      label: displayName,
    }));

  const tableMap = new Map<string, ITableDiscoverySelection['tables'][number]>();
  for (const option of tableOptions) {
    if (!tableMap.has(option.key)) {
      tableMap.set(option.key, {
        tableName: option.key,
        displayName: option.label,
      });
    }
  }

  //check if all tables are selected
  const isAllSelected = tableOptions.length > 0 && selectedTables.length === tableOptions.length;

  // Select all tables
  const selectAllTables = () => {
    const allKeys = new Set(tableOptions.map((option) => option.key)) as SharedSelection;
    setValues(allKeys);
    const allTableData = tableOptions.map((option) => ({
      tableName: option.key,
      displayName: option.label,
    }));
    setSelectedTables(allTableData);
  };

  // Unselect all tables
  const unselectAllTables = () => {
    setValues(new Set() as SharedSelection);
    setSelectedTables([]);
  };

  // Handle regular selection
  const handleRegularSelection = (selectedKeys: SharedSelection) => {
    setValues(selectedKeys);
    const selectedTableData = Array.from(selectedKeys)
      .map((key) => tableMap.get(key as string))
      .filter(Boolean) as ITableDiscoverySelection['tables'];
    setSelectedTables(selectedTableData);
  };

  // Check if select all was clicked
  const isSelectAllClicked = (selectedKeys: SharedSelection) => {
    return (
      selectedKeys === 'all' || (selectedKeys instanceof Set && selectedKeys.has('__select_all__'))
    );
  };

  // Main selection handler
  const handleSelectChange = (selectedKeys: SharedSelection) => {
    if (isSelectAllClicked(selectedKeys)) {
      isAllSelected ? unselectAllTables() : selectAllTables();
      return;
    }
    handleRegularSelection(selectedKeys);
  };

  // Remove a selected table
  const handleRemove = (value: string) => {
    setValues((prev) => {
      const updated = new Set(Array.from(prev));
      updated.delete(value);
      return updated as SharedSelection;
    });
    setSelectedTables((prev) => prev.filter((table) => table.tableName !== value));
  };

  // Continue to next step
  const handleContinue = async () => {
    const payload: ICaptureMetadataPayload = {
      companyId,
      dbConnectionId,
      tables: selectedTables,
    };

    await handleAsyncOperation(async () => await captureMetadata(payload).unwrap(), {
      onSuccess(result) {
        saveGeneratedMetadata(result.data.metadata.generatedMetadata);
        if (result.data.metadata.generatedMetadata.length > 0) {
          setOnboardingStep(3);
        }
      },
    });
  };

  const isButtonDisabled = isLoading || selectedTables.length === 0 || isCapturing;

  return (
    <>
      {/* left side info  */}
      <Summary
        header="Select The"
        headerHighlight="Tables You Care About"
        description="To set things up quickly, select the tables that you need the most initially and provide appropriate context."
      />

      {/* Right side selection  */}
      <div className="flex flex-col pb-12">
        {isCapturing ? (
          <LoadingState selectedTablesCount={selectedTables.length} />
        ) : (
          <>
            <Button
              variant="light"
              color="default"
              className={cn(
                'mb-3 ms-auto w-fit',
                selectedTables.length > 0 ? 'text-primary-400' : 'text-default-500',
                {
                  'opacity-50 cursor-not-allowed': isButtonDisabled,
                }
              )}
              onClick={handleContinue}
              disabled={isButtonDisabled}
              isLoading={isCapturing}
            >
              Confirm <Icons.ArrowRight className="size-4" />
            </Button>

            <div className="w-full md:w-[80%] ms-auto">
              <Select
                label="Label"
                variant="flat"
                placeholder="Select a table"
                selectionMode="multiple"
                selectedKeys={values}
                onSelectionChange={handleSelectChange}
                isLoading={isLoading}
              >
                <SelectSection showDivider>
                  <SelectItem
                    key="__select_all__"
                    className="font-semibold text-primary"
                    startContent={isAllSelected ? <Icons.Check className="size-4" /> : null}
                  >
                    {isAllSelected ? 'Unselect All' : 'Select All'}
                  </SelectItem>
                </SelectSection>
                <SelectSection>
                  {tableOptions.map((table) => (
                    <SelectItem key={table.key}>{table.label}</SelectItem>
                  ))}
                </SelectSection>
              </Select>
              <div className="flex w-full flex-wrap gap-2 mt-2 max-h-96 overflow-y-auto no-scrollbar">
                {selectedTables.map(({ tableName, displayName }) => (
                  <Chip
                    key={tableName}
                    variant="flat"
                    color="default"
                    size="md"
                    radius="sm"
                    classNames={{
                      base: 'text-white bg-default-400',
                    }}
                    endContent={<Icons.X className="size-4 text-white" strokeWidth="3" />}
                    onClose={() => handleRemove(tableName)}
                  >
                    {displayName}
                  </Chip>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default TableDiscoverySelection;
