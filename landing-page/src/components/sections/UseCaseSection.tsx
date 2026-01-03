'use client';
import { useEffect } from 'react';
import SectionWrapper from '../ui/SectionWrapper';

const SECTION_ID = 'use-cases';

const SpotlightBlob = () => (
  <>
    <div
      className="relative blob pointer-events-none opacity-0 mix-blend-screen group-hover:opacity-100"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 400,
        height: 400,
        borderRadius: '50%',
        filter: 'blur(80px)',
        zIndex: 1,
        transform: 'translate(-200px, -200px)',
        background:
          'radial-gradient(circle at 50% 50%, rgba(232,74,46,0.15), rgba(70, 22, 14, 0.05), transparent 70%)',
        transition: 'opacity 300ms ease',
        pointerEvents: 'none',
      }}
    />
    <div
      className="fakeblob relative"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 400,
        height: 400,
        borderRadius: '50%',
        zIndex: 1,
        pointerEvents: 'none',
        opacity: 0,
      }}
    />
  </>
);

const UseCaseSection = () => {
  useEffect(() => {
    const allCards = document.querySelectorAll<HTMLElement>('.use-case-card');

    const onMove = (ev: MouseEvent) => {
      allCards.forEach((card) => {
        const blob = card.querySelector<HTMLElement>('.blob');
        const fblob = card.querySelector<HTMLElement>('.fakeblob');
        if (!blob || !fblob) return;

        const rec = fblob.getBoundingClientRect();
        const x = ev.clientX - rec.left - rec.width / 2;
        const y = ev.clientY - rec.top - rec.height / 2;

        blob.animate([{ transform: `translate(${x}px, ${y}px)` }], {
          duration: 300,
          fill: 'forwards',
        });
      });
    };

    globalThis.addEventListener('mousemove', onMove);

    return () => {
      globalThis.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <SectionWrapper
      id={SECTION_ID}
      className="py-24 md:py-32 snap-start flex flex-col items-center justify-center relative"
      size="medium"
    >
      {/* Header */}
      <h1 className="max-w-3xl pt-12 font-brand leading-tight text-4xl md:text-5xl font-bold text-content1-foreground text-center mx-auto mb-6">
        What You Can <span className="text-primary">Ask</span>
      </h1>
      <p className="mx-auto text-center text-content1-foreground/80 text-xl max-w-2xl mb-16 leading-relaxed">
        If it's operational data, Supply Sense can answer it. Explore the types of questions you
        might inquire.
      </p>

      {/* grid display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-12">
        {/* Row 1: Supplier Delays (spans 2 cols) + Inventory Status */}
        <div className="md:col-span-2 glass-card use-case-card min-h-[180px] p-8 flex flex-col justify-end relative overflow-hidden group hover:border-primary/30 transition-colors">
          <div className="gradient-card opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute inset-0 bg-background/40 backdrop-blur-xl" />

          <SpotlightBlob />

          <h3 className="text-2xl font-bold text-foreground mb-3 relative z-10">Supplier Delays</h3>
          <p className="text-foreground/80 text-lg leading-relaxed relative z-10">
            "Which supplier had the most delays this month?"
          </p>
        </div>

        <div className="glass-card use-case-card min-h-[180px] p-8 flex flex-col justify-end relative overflow-hidden group hover:border-primary/30 transition-colors">
          <div className="absolute inset-0 bg-default-50/50 backdrop-blur-sm" />
          <SpotlightBlob />
          <h3 className="text-xl font-bold text-foreground mb-3 relative z-10">Inventory Status</h3>
          <p className="text-foreground/80 text-base leading-relaxed relative z-10">
            "What's the current inventory level of Cement in Chittagong?"
          </p>
        </div>

        {/* Row 2: Purchase Orders + Performance Metrics */}
        <div className="glass-card use-case-card min-h-[180px] p-8 flex flex-col justify-end relative overflow-hidden group hover:border-primary/30 transition-colors">
          <div className="absolute inset-0 bg-default-50/50 backdrop-blur-sm" />
          <SpotlightBlob />
          <h3 className="text-xl font-bold text-foreground mb-3 relative z-10">Purchase Orders</h3>
          <p className="text-foreground/80 text-base leading-relaxed relative z-10">
            "Who has permission to approve purchase orders?"
          </p>
        </div>

        <div className="md:col-span-2 glass-card use-case-card min-h-[180px] p-8 flex flex-col justify-end relative overflow-hidden group hover:border-primary/30 transition-colors">
          <div className="gradient-card opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute inset-0 bg-background/40 backdrop-blur-xl" />
          <SpotlightBlob />
          <h3 className="text-2xl font-bold text-foreground mb-3 relative z-10">
            Performance Metrics
          </h3>
          <p className="text-foreground/80 text-lg leading-relaxed relative z-10">
            "What's our fastest moving item across all branches?"
          </p>
        </div>

        {/* Row 3: Transaction history (spans 2 cols) + Team Performance */}
        <div className="md:col-span-2 glass-card use-case-card min-h-[180px] p-8 flex flex-col justify-end relative overflow-hidden group hover:border-primary/30 transition-colors">
          <div className="gradient-card opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute inset-0 bg-background/40 backdrop-blur-xl" />
          <SpotlightBlob />
          <h3 className="text-2xl font-bold text-foreground mb-3 relative z-10">
            Transaction History
          </h3>
          <p className="text-foreground/80 text-lg leading-relaxed relative z-10">
            "Show me all GRN changes in the last week."
          </p>
        </div>

        <div className="glass-card use-case-card min-h-[180px] p-8 flex flex-col justify-end relative overflow-hidden group hover:border-primary/30 transition-colors">
          <div className="absolute inset-0 bg-default-50/50 backdrop-blur-sm" />
          <SpotlightBlob />
          <h3 className="text-xl font-bold text-foreground mb-3 relative z-10">Team Performance</h3>
          <p className="text-foreground/80 text-base leading-relaxed relative z-10">
            "Which team processed the most orders yesterday?"
          </p>
        </div>
      </div>
    </SectionWrapper>
  );
};
export default UseCaseSection;
