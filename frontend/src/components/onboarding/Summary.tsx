import { Text } from '@/components/ui/Text';
import LogoSupplySense from '../ui/LogoSupplySense';

interface IProps {
  header: string;
  headerHighlight: string;
  description?: string;
}

const Summary = ({ header, headerHighlight, description }: IProps) => {
  return (
    <div className="mt-[13%]">
      <LogoSupplySense />
      <Text variant="headerMedium" color="secondary" weight={'bold'} className="mt-[8%] xl:mt-12 ">
        {header}
        <Text as="p" variant={'headerMedium'} weight={'bold'} color="primary" className="ml-2">
          {headerHighlight}
        </Text>
      </Text>
      <Text variant={'bodyMedium'} weight={'medium'} className="mt-4">
        {description}
      </Text>
      <Text style={{ fontStyle: 'italic' }} color="secondary" className="mt-2">
        We don’t train on your data.
      </Text>
    </div>
  );
};

export default Summary;
