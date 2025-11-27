'use client';
import SectionWrapper from '../ui/SectionWrapper';

const SECTION_ID = 'use-cases';

const UseCaseSection = () => {
  return (
    <SectionWrapper
      id={SECTION_ID}
      className="py-16 snap-start lg:min-h-screen flex flex-col items-center justify-center"
    >
      {/* Header */}
      <h1 className="max-w-2xl pt-12 font-brand leading-snug text-3xl md:text-4xl font-bold text-content1-foreground text-center mx-auto">
        What You Can Ask
      </h1>
      <p className="mt-6 mx-auto text-center text-content1-foreground text-lg max-w-lg mb-16">
        If it's operational data, Supply Sense can answer it. Here are some example questions you
        might want to inquire.
      </p>
      {/* grid display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Row 1: Supplier Delays (spans 2 cols) + Inventory Status */}
        {/* col 1 - col span 2*/}
        <div className="md:col-span-2 glass-card shadow-sm relative order-1">
          <div className="gradient-card" />
          <div className="absolute inset-0 bg-black/10 backdrop-blur-md rounded-xl" />
          <h3 className="text-content1-foreground font-semibold text-lg mb-3 relative z-10">
            Supplier Delays
          </h3>
          <p className="text-content1-foreground text-sm leading-relaxed relative z-10">
            Which supplier had the most delays this month?
          </p>
        </div>
        {/* col 2*/}
        <div className="bg-default-50/70 p-6 rounded-xl border-2 border-primary-100 shadow-sm relative order-2 md:order-3">
          <h3 className="text-primary-800 font-semibold text-lg mb-3">Inventory Status</h3>
          <p className="text-primary-800 text-sm leading-relaxed">
            What's the current inventory level of Cement in Chittagong?
          </p>
        </div>
        {/* Row 2: Purchase Orders + Performance Metrics */}
        {/* col 1*/}
        <div className="bg-default-50/70 backdrop-blur-sm p-6 rounded-xl border border-primary-100 shadow-sm order-4">
          <h3 className="text-primary-800 font-semibold text-lg mb-3">Purchase Orders</h3>
          <p className="text-primary-800 text-sm leading-relaxed">
            Who has permission to approve purchase orders?
          </p>
        </div>
        {/* col 2 - col span 2*/}
        <div className="md:col-span-2 glass-card shadow-sm relative order-3 md:order-5">
          <div className="gradient-card" />
          <div className="absolute inset-0 bg-black/10 backdrop-blur-md rounded-xl" />
          <h3 className="text-content1-foreground font-semibold text-lg mb-3 relative z-10">
            Performance Metrics
          </h3>
          <p className="text-content1-foreground text-sm leading-relaxed relative z-10">
            What's our fastest moving item across all branches?
          </p>
        </div>
        {/* Row 3: Transaction history (spans 2 cols) + Team Performance */}
        {/* col 1 - col span 2*/}
        <div className="md:col-span-2 glass-card shadow-sm relative order-5 md:order-7">
          <div className="gradient-card" />
          <div className="absolute inset-0 bg-black/10 backdrop-blur-md rounded-xl" />
          <h3 className="text-content1-foreground font-semibold text-lg mb-3 relative z-10">
            Transaction history
          </h3>
          <p className="text-content1-foreground text-sm leading-relaxed relative z-10">
            Show me all GRN changes in the last week.
          </p>
        </div>
        {/* col 2*/}
        <div className="bg-default-50/70 backdrop-blur-sm p-6 rounded-xl border border-primary-100 shadow-sm order-6 md:order-9">
          <h3 className="text-primary-800 font-semibold text-lg mb-3">Team Performance</h3>
          <p className="text-primary-800 text-sm leading-relaxed">
            Which team processed the most orders yesterday?
          </p>
        </div>
      </div>
    </SectionWrapper>
  );
};
export default UseCaseSection;
