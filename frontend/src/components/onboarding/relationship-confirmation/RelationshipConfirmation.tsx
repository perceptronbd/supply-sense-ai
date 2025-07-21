import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Icons } from '@/lib/icons/Icons';
import Summary from '../Summary';
import RelationshipCard from './RelationshipCard';

const RelationshipConfirmation = () => {
  return (
    <>
      {/* left side info  */}
      <Summary
        header="Help Link"
        headerHighlight="Related Tables"
        description="Confirm how tables are connected so the agent can ask smarter questions."
        subDescription="You can skip relationships now and define them later."
      />

      {/* right side form */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-x-2 ">
            <Icons.Exclamatory />{' '}
            <Text color="warning">You can confirm the table relations later.</Text>
          </div>
          <Button variant="light" color="default" className="text-default-500 mb-3 w-fit">
            Confirm <Icons.ArrowRight className="size-4" />
          </Button>
        </div>

        <RelationshipCard />
      </div>
    </>
  );
};

export default RelationshipConfirmation;
