import {
  addToast,
  Chip,
  Input,
  Select,
  SelectItem,
  SelectSection,
  SharedSelection,
  Textarea,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { handleAsyncOperation } from '@supplysense/utils';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import z from 'zod';
import type { ITableDiscoverySelection } from '@/components/onboarding/types';
import { Icons } from '@/lib/icons/Icons';
import { useGetTablesQuery, useUpdateBusinessContextMutation } from '@/store/api/onboardingApi';
import { useOnboardingStore } from '@/store/hooks/useOnboardingStore';
import { ConnectionsTitleAndButtons } from '../connections-title-and-buttons/ConnectionsTitleAndButtons';

// Schema for form validation
const businessContextSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  aboutYourBusiness: z.string().min(10, 'Please provide at least 10 characters'),
});

type BusinessContextFormData = z.infer<typeof businessContextSchema>;

interface IProps {
  companyId: string;
  dbConnectionId: string;
}

const UpdateBusinessContext = ({ companyId, dbConnectionId }: IProps) => {
  // Store selected table keys (tableName)
  const [values, setValues] = useState<SharedSelection>(new Set() as SharedSelection);
  // Store selected table objects
  const [selectedTables, setSelectedTables] = useState<ITableDiscoverySelection['tables']>([]);
  const { generatedMetadata } = useOnboardingStore();

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BusinessContextFormData>({
    resolver: zodResolver(businessContextSchema),
    defaultValues: {
      title: '',
      aboutYourBusiness: '',
    },
  });

  const { saveGeneratedMetadata, setUpdateCurrentStep, updateCurrentStep } = useOnboardingStore();

  // Fetch tables based on companyId and dbConnectionId
  const { data: tableResponse = { data: { tables: [] } }, isLoading } = useGetTablesQuery(
    {
      companyId,
      dbConnectionId,
    },
    {
      skip: !(companyId && dbConnectionId),
    }
  );

  const [updateBusinessContextMutation, { isLoading: isUpdatingBusinessContext }] =
    useUpdateBusinessContextMutation();

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

  // Check if all tables are selected
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

  // Form submission
  const onSubmit = async (data: BusinessContextFormData) => {
    const payload = {
      companyId,
      dbConnectionId,
      title: data.title,
      businessContext: data.aboutYourBusiness,
      tables: selectedTables,
    };

    if (selectedTables.length === 0) {
      addToast({
        title: 'Please select at least one table',
        color: 'danger',
        variant: 'flat',
      });
      return;
    }

    await handleAsyncOperation(
      async () => {
        return await updateBusinessContextMutation(payload).unwrap();
      },
      {
        onSuccess(result) {
          saveGeneratedMetadata(result.data.metadata.generatedMetadata);
          if (result.data.metadata.generatedMetadata.length > 0) {
            setUpdateCurrentStep(2);
          }
          addToast({
            title: 'Business context updated successfully',
            color: 'success',
            variant: 'flat',
          });
        },
        onError(error) {
          addToast({
            title: (error as Error)?.message || 'An error occurred',
            color: 'danger',
            variant: 'flat',
          });
          setUpdateCurrentStep(1);
        },
      }
    );
  };

  console.log('generatedMetadata.length', generatedMetadata.length);

  const isButtonDisabled =
    isLoading || isSubmitting || isUpdatingBusinessContext || generatedMetadata.length === 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Title and Buttons */}

        <ConnectionsTitleAndButtons
          title="Database Name & Business Details"
          description="Update your business context"
          primaryActionText="Save"
          secondaryActionText="Next"
          isSubmitting={isSubmitting}
          isDisabled={isButtonDisabled}
          onPrimaryAction={handleSubmit(onSubmit)}
          onSecondaryAction={() => setUpdateCurrentStep(updateCurrentStep + 1)}
        />

        {/* Right Column - Form Fields */}
        <div className="space-y-6">
          {/* Title Field */}
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Title"
                placeholder="Outsource Devs"
                variant="faded"
                color="primary"
                isInvalid={!!errors.title}
                errorMessage={errors.title?.message}
                classNames={{
                  input: 'focus:outline-none focus:ring-0',
                }}
              />
            )}
          />

          {/* About Your Business */}
          <Controller
            name="aboutYourBusiness"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                label="About Your Business"
                color="primary"
                variant="faded"
                radius="lg"
                size="lg"
                placeholder="Provide a brief detail of the kind of business this database is used for."
                isInvalid={!!errors.aboutYourBusiness}
                errorMessage={errors.aboutYourBusiness?.message}
                classNames={{
                  input: 'focus:outline-none focus:ring-0',
                }}
              />
            )}
          />

          {/* Label/Table Selection */}
          <div>
            <Select
              label="Label"
              variant="faded"
              color="primary"
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

            {/* Selected Tables as Chips */}
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
        </div>
      </div>
    </form>
  );
};

export default UpdateBusinessContext;
