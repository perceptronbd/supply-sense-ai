import { Text } from '@/components/ui/Text';
import type { Branch } from '@/store/api/branchApi';

export const NameCell = ({ branch }: { branch: Branch }) => (
  <div className="flex flex-col">
    <Text variant="bodyBase" className="font-medium">
      {branch.name}
    </Text>
    <Text variant="bodySmall" className="text-default-500">
      Code: {branch.code}
    </Text>
  </div>
);

export const ContactCell = ({ branch }: { branch: Branch }) => (
  <div className="flex flex-col">
    {branch.email && <Text variant="bodySmall">{branch.email}</Text>}
    {branch.phone && (
      <Text variant="bodySmall" className="text-default-500">
        {branch.phone}
      </Text>
    )}
    {!branch.email && !branch.phone && (
      <Text variant="bodySmall" className="text-default-400">
        No contact info
      </Text>
    )}
  </div>
);

export const AddressCell = ({ branch }: { branch: Branch }) =>
  branch.address ? (
    <Text variant="bodySmall">{branch.address}</Text>
  ) : (
    <Text variant="bodySmall" className="text-default-400">
      No address
    </Text>
  );

export const ManagerCell = ({ branch }: { branch: Branch }) =>
  branch.manager ? (
    <div className="flex flex-col">
      <Text variant="bodySmall" className="font-medium">
        {branch.manager.firstName} {branch.manager.lastName}
      </Text>
      <Text variant="bodySmall" className="text-default-500">
        {branch.manager.email}
      </Text>
    </div>
  ) : (
    <Text variant="bodySmall" className="text-default-400">
      No manager assigned
    </Text>
  );
