import PricingMobileTables from '../ui/PricingMobileTables';
import PricingTable from '../ui/PricingTable';
import ProgressBar from '../ui/ProgressBar';
import SectionWrapper from '../ui/SectionWrapper';

const PricingSection = () => {
  return (
    <SectionWrapper size="medium" id="pricing" className="">
      {/* heading section */}
      <div className="mb-16">
        <h1 className="max-w-2xl pt-12 font-brand leading-snug text-3xl md:text-4xl font-bold text-content1-foreground text-center mx-auto mb-6">
          Pricing
        </h1>

        <h3 className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-secondary to-secondary-700 text-center mx-auto mb-3">
          Unlock the full potential of SupplySense for free
        </h3>
        <p className="font-medium text-lg text-content1-foreground text-center mb-8">
          <span className="text-primary">SupplySense</span> is currently free to use. The tiers
          below will be available soon.
        </p>

        <p className="text-default-foreground font-medium text-center mb-2">
          Get as many or as little credits you want
        </p>

        <ProgressBar value={10000} className="mb-8" />

        <p className="text-xs italic text-center font-medium text-transparent bg-clip-text bg-gradient-to-r from-primary-100 to-primary-400">
          Credits are used based on the complexity of your request. Each action will consume at
          least 1 credit.
        </p>
      </div>

      {/* table section  */}

      {/* desktop table */}
      <div className="hidden lg:flex">
        <PricingTable />
      </div>

      {/* mobile tables */}
      <div className="flex flex-col gap-8 lg:hidden mx-auto">
        <PricingMobileTables />
      </div>
    </SectionWrapper>
  );
};

export default PricingSection;
