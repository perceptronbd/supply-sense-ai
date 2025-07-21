import { Text } from '@/components/ui/Text';
import { Icons } from '@/lib/icons/Icons';
import { Card, Select, SelectItem } from '@heroui/react';
import ActionButton from './ActionButton';

const SELECT_OPTIONS = [
  {
    value: 'purchase_request.item_master_id',
    label: 'purchase_request.item_master_id',
  },
  {
    value: 'purchase_request.item_master_name',
    label: 'purchase_request.item_master_name',
  },
  {
    value: 'purchase_request.item_master_sku',
    label: 'purchase_request.item_master_sku',
  },
];

const RELATIONSHIP_OPTIONS = [
  { value: 'item_master.id', label: 'item_master.id', table: 'item_master' },
  { value: 'item_master.name', label: 'item_master.name', table: 'items' },
  { value: 'item_master.sku', label: 'item_master.sku', table: 'item_pr' },
];

const RelationshipCard = () => {
  return (
    <div className="place-items-end max-md:mt-5 w-full">
      <Card className="!p-5 w-full bg-default-300 space-y-5">
        {/* select input */}
        <div className="flex items-center gap-2 ">
          {/* NOTE:  first select will be disabled */}
          <Select disabled selectedKeys={[SELECT_OPTIONS[0].value]}>
            {SELECT_OPTIONS.map((option) => (
              <SelectItem key={option.value}>{option.label}</SelectItem>
            ))}
          </Select>

          <Icons.ChevronRight className="flex-shrink-0 size-6" />

          <Select placeholder="Select Related Table">
            {RELATIONSHIP_OPTIONS.map((option) => (
              <SelectItem key={option.value}>{option.label}</SelectItem>
            ))}
          </Select>
        </div>
        {/* description */}
        <Text>
          This means every order likely belongs to a customer. Confirming this helps the AI group or
          filter orders by customer.
        </Text>
        <div className="flex items-center gap-5">
          <ActionButton variants="yes" />
          <ActionButton variants="no" />
          <ActionButton variants="not-sure" />
        </div>
      </Card>
    </div>
  );
};

export default RelationshipCard;
