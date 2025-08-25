import SectionWrapper from '../ui/SectionWrapper';
import TableBox from '../ui/TableBox';

const BuiltSection = () => {
  return (
    <SectionWrapper size="large">
      <div className="flex flex-col xl:flex-row items-start justify-center gap-6 md:gap-16 bg-background">
        {/* first column - chat box  */}
        <div className="w-full max-w-lg mx-auto">
          <TableBox />
        </div>

        {/* second column */}
        <div className="max-w-lg mx-auto xl:mx-0">
          <h1 className="font-brand text-4xl md:text-5xl font-bold text-content1-foreground text-center xl:text-start mb-6">
            Built for Clarity — Not Complexity
          </h1>

          <p className="text-content1-foreground text-center md:pr-10 xl:text-start">
            No dashboards to learn. No training required. Just ask questions in plain language and
            get clear, grounded answers from your system — whether it’s about stock, people,
            documents, or vendors.
          </p>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default BuiltSection;
