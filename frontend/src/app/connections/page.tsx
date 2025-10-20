import BlinkingLogo from '@/components/ui/animations/BlinkingLogo';
import { Text } from '@/components/ui/Text';

export default function ConnectionsPage() {
  return (
    <div className="flex flex-col justify-center items-center h-full max-h-[calc(100vh-40px)] text-center">
      <BlinkingLogo size={100} />

      <Text variant="headerSmall" color="primary" weight="bold" className="mt-5 xl:mt-12">
        Connections
        <Text as="span" variant="headerSmall" weight="bold" color="default" className="ml-2">
          Coming Soon
        </Text>
      </Text>

      <Text variant="bodyBase" color="default" className="text-default-500 text-center mt-2">
        Connect your favorite tools and services to enhance your workflow.
      </Text>
    </div>
  );
}
