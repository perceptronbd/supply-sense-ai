'use client';
import SectionWrapper from '../ui/SectionWrapper';

const QuestionSection = () => {
  return (
    <SectionWrapper>
      {/* Header */}
      <h1 className="max-w-2xl pt-12 font-brand leading-snug text-3xl md:text-4xl font-bold text-content1-foreground text-center mx-auto">
        What You Can Ask
      </h1>

      <p className="mt-6 mx-auto text-center text-content1-foreground text-lg max-w-lg mb-16">
        If it’s operational data, Supply Sense can answer it. Here are some example questions you
        might want to inquire.
      </p>

      {/* grid display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Row 1: Supplier Delays (spans 2 cols) + Inventory Status */}
        {/* col 1 */}
        <div className="bg-gradient-to-r from-default/50 to-focus/50 md:col-span-2 p-6 border-2 border-focus/50 rounded-xl glass-effect">
          <h3 className="text-content1-foreground font-semibold text-lg mb-3">Supplier Delays</h3>
          <p className="text-content1-foreground text-sm leading-relaxed">
            Which supplier had the most delays this month?
          </p>
        </div>

        {/* col 2 */}
        <div className="border-2 border-focus/50 p-6 rounded-xl glass-effect">
          <h3 className="text-content1-foreground font-semibold text-lg mb-3">Inventory Status</h3>
          <p className="text-content1-foreground text-sm leading-relaxed">
            What's the current inventory level of Cement in Chittagong?
          </p>
        </div>

        {/* Row 2: Purchase Orders + Performance Metrics */}
        {/* col 1 */}
        <div className="border-2 border-focus/50 p-6 rounded-xl glass-effect">
          <h3 className="text-content1-foreground font-semibold text-lg mb-3">Purchase Orders</h3>
          <p className="text-content1-foreground text-sm leading-relaxed">
            Who has permission to approve purchase orders?
          </p>
        </div>

        {/* col 2 */}
        <div className="bg-gradient-to-r from-default/50 to-focus/50 md:col-span-2 p-6 border-2 border-focus/50 rounded-xl glass-effect">
          <h3 className="text-content1-foreground font-semibold text-lg mb-3">
            Performance Metrics
          </h3>
          <p className="text-content1-foreground text-sm leading-relaxed">
            What's our fastest moving item across all branches?
          </p>
        </div>

        {/* Row 3: Transaction history (spans 2 cols) + Team Performance */}
        {/* col 1 */}
        <div className="bg-gradient-to-r from-default/50 to-focus/50 md:col-span-2 p-6 border-2 border-focus/50 rounded-xl glass-effect">
          <h3 className="text-content1-foreground font-semibold text-lg mb-3">
            Transaction history
          </h3>
          <p className="text-content1-foreground text-sm leading-relaxed">
            Show me all GRN changes in the last week.
          </p>
        </div>

        {/* col 2 */}
        <div className="border-2 border-focus/50 p-6 rounded-xl glass-effect">
          <h3 className="text-content1-foreground font-semibold text-lg mb-3">Team Performance</h3>
          <p className="text-content1-foreground text-sm leading-relaxed">
            Which team processed the most orders yesterday?
          </p>
        </div>
      </div>

      {/* View More Button */}
      <div className="text-center">
        <button type="button" className="text-primary">
          View More
        </button>
      </div>
    </SectionWrapper>
  );
};

export default QuestionSection;
