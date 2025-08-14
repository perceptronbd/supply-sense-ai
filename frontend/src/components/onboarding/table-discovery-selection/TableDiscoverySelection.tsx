'use client';
import { Button } from '@/components/ui/Button';
import { useGetCompanyId } from '@/hooks/useGetCompanyId';
import { Icons } from '@/lib/icons/Icons';
import { cn } from '@/lib/utils';
import { useCaptureMetadataMutation, useGetTablesQuery } from '@/store/api/onboardingApi';
import { useOnboardingStore } from '@/store/hooks/useOnboardingStore';
import { Select, SelectItem } from '@heroui/react';
import type { SharedSelection } from '@heroui/react';
import { handleAsyncOperation } from '@supplysense/utils';
import { useState } from 'react';
import Summary from '../Summary';
import type { ICaptureMetadataPayload } from '../types';
import type { ITableDiscoverySelection } from '../types/table-discovery-selection';

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

  // Compute table options and map (React 19 will optimize reactivity)
  const tableOptions = tableResponse.data.tables.map(({ tableName, displayName }) => ({
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

  // Function to handle selection changes
  const handleSelectChange = (selectedKeys: SharedSelection) => {
    setValues(selectedKeys);
    // Map selected keys to table objects
    const selectedTableData = Array.from(selectedKeys)
      .map((key) => tableMap.get(key as string))
      .filter(Boolean) as ITableDiscoverySelection['tables'];
    setSelectedTables(selectedTableData);
  };

  // Remove a selected value when clicking X
  const handleRemove = (value: string) => {
    setValues((prev) => {
      const updated = new Set(Array.from(prev));
      updated.delete(value);
      return updated as SharedSelection;
    });
    setSelectedTables((prev) => prev.filter((table) => table.tableName !== value));
  };

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
          setOnboardingStep(3); // Move to the next step in onboarding
        }
      },
    });
  };

  return (
    <>
      {/* left side info  */}
      <Summary
        header="Select The"
        headerHighlight="Tables You Care About"
        description="To set things up quickly, select the tables that you need the most initially and provide appropriate context."
      />

      {/* right side form */}
      <div className="flex flex-col pb-12">
        <Button
          variant="light"
          color="default"
          className={cn(
            'mb-3 ms-auto w-fit',
            selectedTables.length > 0 ? 'text-primary-400' : 'text-default-500',
            {
              'opacity-50 cursor-not-allowed':
                isLoading || isCapturing || selectedTables.length === 0,
            }
          )}
          onClick={handleContinue}
          disabled={isLoading || selectedTables.length === 0 || isCapturing}
          isLoading={isCapturing}
        >
          {isCapturing ? (
            'Capturing Metadata...'
          ) : (
            <>
              Confirm <Icons.ArrowRight className="size-4" />
            </>
          )}
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
            {tableOptions.map((animal) => (
              <SelectItem key={animal.key}>{animal.label}</SelectItem>
            ))}
          </Select>
          <div className="flex w-full flex-wrap gap-2 mt-2">
            {selectedTables.map(({ tableName, displayName }) => (
              <button
                key={tableName}
                type="button"
                className="flex items-center justify-center text-sm  gap-x-2 bg-default-400 rounded-md px-3 py-1"
                onClick={() => handleRemove(tableName)}
              >
                {displayName} <Icons.X className="size-4" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default TableDiscoverySelection;
