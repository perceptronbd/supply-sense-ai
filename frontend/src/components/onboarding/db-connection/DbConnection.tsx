import LogoSupplySense from '@/components/ui/LogoSupplySense';
import { Text } from '@/components/ui/Text';
import { ProgressStep } from '../progress-step';
import DbConnectionForm from './DbConnectionForm';
const DbConnection = () => {
  return (
    <section className="h-screen flex flex-col py-12 w-full container gap-y-7">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 flex-grow">
        {/* left side info  */}
        <div className="mt-[13%]">
          <LogoSupplySense />
          <Text
            variant="headerMedium"
            color="secondary"
            weight={'bold'}
            className="mt-[8%] xl:mt-12"
          >
            Connect Your
            <Text
              as="span"
              variant={'headerMedium'}
              weight={'bold'}
              color="primary"
              className="ml-2"
            >
              Database
            </Text>
          </Text>
          <Text variant={'bodyMedium'} weight={'medium'} className="mt-4">
            Your credentials will be encrypted and your data will not be stored or tracked.
          </Text>
          <Text style={{ fontStyle: 'italic' }} color="secondary" className="mt-2">
            We don’t train on your data.
          </Text>
        </div>
        {/* right side form */}
        <DbConnectionForm />
      </div>
      {/* progress step */}
      <ProgressStep currentStep={4} />
    </section>
  );
};

export default DbConnection;
