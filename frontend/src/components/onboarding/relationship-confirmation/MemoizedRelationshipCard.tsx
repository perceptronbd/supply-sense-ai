import { memo, useCallback } from 'react';
import type { IRelationshipTables } from '../types/table-relationship';
import { ACTION_BUTTON_VARIANTS, TActionButtonVariants } from './ActionButton';
import RelationshipCard from './RelationshipCard';

interface IMemorizedProps {
  table: IRelationshipTables;
  isLoading: boolean;
  rightSelectOptions: { label: string; value: string; table: string }[];
  leftSelectedKey: string;
  rightSelectedKey: string;
  onRightSelectChange: (value: IRelationshipTables) => void;
}

// Memoized wrapper component to prevent unnecessary re-renders
const MemoizedRelationshipCard = memo(
  ({
    table,
    isLoading,
    rightSelectOptions,
    leftSelectedKey,
    rightSelectedKey,
    onRightSelectChange,
  }: IMemorizedProps) => {
    const handleChange = useCallback(
      (value: string) => {
        const isButtonPressedValue = ACTION_BUTTON_VARIANTS.includes(
          value as TActionButtonVariants
        );

        if (isButtonPressedValue) {
          onRightSelectChange({
            refTable: table.refTable,
            refColumn: table.refColumn,
            tableName: table.tableName,
            columnName: table.columnName,
            description: table.description,
            isConfirmed: value === 'yes' || value === 'confirmed',
            actionVariant: value as TActionButtonVariants,
          });
          return;
        }
        const [refTable, refColumn] = value.split('_');
        onRightSelectChange({
          refTable,
          refColumn,
          tableName: table.tableName,
          columnName: table.columnName,
          description: table.description,
          isConfirmed: false,
          actionVariant: 'no',
        });
      },
      [
        table.tableName,
        table.columnName,
        table.description,
        table.refTable,
        table.refColumn,
        onRightSelectChange,
      ]
    );

    return (
      <RelationshipCard
        isLoading={isLoading}
        rightSelectOptions={rightSelectOptions}
        leftSelectedKey={leftSelectedKey}
        rightSelectedKey={rightSelectedKey}
        onRightSelectChange={handleChange}
        description={table.description}
      />
    );
  }
);

MemoizedRelationshipCard.displayName = 'MemoizedRelationshipCard';

export default MemoizedRelationshipCard;
