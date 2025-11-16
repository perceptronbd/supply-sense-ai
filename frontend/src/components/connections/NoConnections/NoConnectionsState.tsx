import { Button } from '@heroui/react';
import { Text } from '@/components/ui/Text';
import { Icons } from '@/lib/icons/Icons';

export function NoConnectionsState() {
  return (
    <main className="w-full h-full bg-background lg:flex gap-2">
      <div className="flex flex-col h-full w-full p-6 relative text-foreground rounded-xl bg-content2 flex-1">
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4">
          <div className="mb-8">
            <Icons.NoConnection className="w-28 h-28 md:w-40 md:h-40" />
          </div>
          <Text variant="headerMedium" className="mb-2">
            <span className="text-primary">No Database</span>{' '}
            <span className="text-secondary">Connected Yet</span>
          </Text>
          <Text variant="bodyMedium" className="mb-8">
            Start by connecting your system to enable AI assistance.
          </Text>

          <Button
            variant="flat"
            color="primary"
            size="lg"
            radius="md"
            startContent={<Icons.Connection className="w-4 h-4 text-primary" />}
          >
            <Text variant="label" color="primary" weight="medium">
              Add New
            </Text>
          </Button>
        </div>
      </div>
    </main>
  );
}
