'use client';

import { useScroll } from 'motion/react';
import { useRef } from 'react';
import useGradientIcons from '../icons/useGradientIcons';
import SectionWrapper from '../ui/SectionWrapper';
import TableBox from '../ui/TableBox';

const BuiltSection = () => {
  const { CheckCircle, Message, Search, Document } = useGradientIcons();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['end end', 'start start'],
  });

  return (
    <SectionWrapper size="large">
      <div className="flex flex-col xl:flex-row items-start justify-center gap-20 bg-background">
        {/* first column - chat box  */}
        <div className="w-full max-w-lg mx-auto">
          {/* First table  */}
          <TableBox />

          {/* Second table  */}
          {/* <TableBox /> */}

          {/* third table */}
          {/* <TableBox /> */}

          {/* fourth table */}
          {/* <TableBox /> */}
        </div>

        {/* second column */}
        <div className="max-w-lg mx-auto pt-5">
          {/* first row */}
          <div className="flex gap-4 items-center h-full mb-3">
            <div className="bg-gradient-to-b from-primary-200 via-primary to-primary-200 w-1 self-stretch" />
            <div>
              <div className="flex gap-2 items-center mb-1">
                <CheckCircle className="h-10 w-10" />
                <h3 className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent text-2xl font-medium font-brand">
                  Built for Clarity — Not Complexity
                </h3>
              </div>
              <p className="text-content4-foreground text-start mb-3 text-sm pl-3">
                Finally, your PostgreSQL database makes sense to everyone
              </p>
              <p className="text-content4-foreground text-start mb-3 pl-3 max-w-md">
                "We turn cryptic tables and columns into natural conversations. No SQL, no
                dashboards, no technical barriers. Just ask questions like you're talking to a
                colleague, and get answers that actually make sense."
              </p>
            </div>
          </div>

          {/* second row */}
          <div className="flex gap-4 items-center h-full mb-3 relative">
            <div className="absolute top-0 left-0 h-full w-full z-1 opacity-50 bg-black" />
            <div className="bg-gradient-to-b from-primary-200 via-primary to-primary-200 w-1 self-stretch" />
            <div>
              <div className="flex gap-2 items-center mb-1">
                <Message className="h-10 w-10" />
                <h3 className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent text-2xl font-medium font-brand max-w-sm">
                  Ask Like You Think, Not Like a Machine
                </h3>
              </div>
              <p className="text-content4-foreground text-start mb-3 text-sm pl-3">
                Natural language that understands your business logic
              </p>
              <p className="text-content4-foreground text-start mb-3 pl-3 max-w-md">
                "Say 'Show me declining products' instead of juggling through dashboard. Our AI maps
                your unique business rules (not generic algorithms) so answers reflect how you
                actually operate. Follow-up questions work like real dialogue."
              </p>
            </div>
          </div>

          {/* third row */}
          <div className="flex gap-4 items-center h-full mb-3 relative">
            <div className="absolute top-0 left-0 h-full w-full z-1 opacity-50 bg-black" />
            <div className="bg-gradient-to-b from-primary-200 via-primary to-primary-200 w-1 self-stretch" />
            <div>
              <div className="flex gap-2 items-center mb-1">
                <Search className="h-10 w-10" />
                <h3 className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent text-2xl font-medium font-brand max-w-sm">
                  Answers You Can Trust, Immediately
                </h3>
              </div>
              <p className="text-content4-foreground text-start mb-3 text-sm pl-3">
                No more guessing if the data is right
              </p>
              <p className="text-content4-foreground text-start mb-3 pl-3 max-w-md">
                "Every answer shows its source tables and confidence score. See exactly how we
                arrived at insights – no black boxes. Confirm schema relationships before going live
                so your team never doubts the data again."
              </p>
            </div>
          </div>

          {/* fourth row */}
          <div className="flex gap-4 items-center h-full mb-3 relative">
            <div className="absolute top-0 left-0 h-full w-full z-1 opacity-50 bg-black" />
            <div className="bg-gradient-to-b from-primary-200 via-primary to-primary-200 w-1 self-stretch" />
            <div>
              <div className="flex gap-2 items-center mb-1">
                <Document className="h-10 w-10" />
                <h3 className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent text-2xl font-medium font-brand max-w-sm">
                  Your Data, Your Rules, Always
                </h3>
              </div>
              <p className="text-content4-foreground text-start mb-3 text-sm pl-3">
                No storage, no training, no leaks
              </p>

              <p className="text-content4-foreground text-start mb-3 pl-3 max-w-md">
                "We never store your data or queries. Every connection is ephemeral – your
                PostgreSQL URL is encrypted, queries execute in real-time, then vanish. You see
                exactly what's accessed and when."
              </p>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default BuiltSection;
