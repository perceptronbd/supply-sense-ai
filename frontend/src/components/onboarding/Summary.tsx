import { Text } from '@/components/ui/Text';
import LogoSupplySense from '../ui/LogoSupplySense';

interface IProps {
  header: string;
  headerHighlight: string;
  description?: string;
  as?: 'span' | 'p';
  subDescription?: string;
}

const Summary = ({
  header,
  headerHighlight,
  description,
  subDescription = 'We don’t train on your data.',
  as = 'span',
}: IProps) => {
  return (
    <div className="mt-[13%]">
      <LogoSupplySense />
      <Text variant="headerMedium" color="secondary" weight={'bold'} className="mt-[8%] xl:mt-12 ">
        {header}
        <Text as={as} variant={'headerMedium'} weight={'bold'} color="primary" className="ml-2">
          {headerHighlight}
        </Text>
      </Text>
      <Text variant={'bodyMedium'} weight={'medium'} className="mt-4">
        {description}
      </Text>
      <Text style={{ fontStyle: 'italic' }} color="secondary" className="mt-2">
        {subDescription}
      </Text>
    </div>
  );
};

export default Summary;
