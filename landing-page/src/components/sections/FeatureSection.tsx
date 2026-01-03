'use client';

import { useEffect } from 'react';
import useGradientIcons from '../icons/useGradientIcons';
import SectionWrapper from '../ui/SectionWrapper';

const Features = () => {
  const { Settings, DangerCircle, Clock } = useGradientIcons();

  const challenges = [
    {
      icon: Settings,
      title: 'Training Burden',
      description:
        'New team members need extensive training just to navigate your operational systems.',
    },
    {
      icon: DangerCircle,
      title: 'Decision Delays',
      description:
        'Critical decisions postponed because getting the right information takes too long.',
    },
    {
      icon: Clock,
      title: 'Time Wasted',
      description:
        'Hours spent navigating complex systems just to answer basic questions about inventory or orders.',
    },
  ];

  useEffect(() => {
    const allCards = document.querySelectorAll<HTMLElement>('.sales-card');

    const onMove = (ev: MouseEvent) => {
      allCards.forEach((card) => {
        const blob = card.querySelector<HTMLElement>('.blob');
        const fblob = card.querySelector<HTMLElement>('.fakeblob');
        if (!blob || !fblob) return;

        const rec = fblob.getBoundingClientRect();
        const x = ev.clientX - rec.left - rec.width / 2;
        const y = ev.clientY - rec.top - rec.height / 2;

        try {
          blob.animate([{ transform: `translate(${x}px, ${y}px)` }], {
            duration: 300,
            fill: 'forwards',
          });
        } catch {
          blob.style.transform = `translate(${x}px, ${y}px)`;
        }
      });
    };

    globalThis.addEventListener('mousemove', onMove);

    return () => {
      globalThis.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <SectionWrapper
      size="medium"
      className="snap-center min-h-screen flex flex-col justify-center pt-24 md:pt-32"
    >
      <div className="flex flex-col justify-center items-center lg:flex-row lg:justify-around gap-12 lg:gap-20">
        {/* text part - first column */}
        <div className="flex-1 max-w-xl">
          <h1 className="font-brand text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60 text-center mx-auto xl:mx-0 xl:text-start leading-tight mb-8">
            You've Got Data. <br />
            But Getting Answers <br />
            <span className="text-primary-500">Is Still a Pain.</span>
          </h1>

          <p className="mt-6 text-xl text-content1-foreground/80 leading-relaxed text-center mx-auto xl:text-start xl:mx-0">
            If finding out what’s happening in your supply chain means logging into multiple
            systems, calling IT, or hunting through spreadsheets, then you’re already losing
            valuable time.
          </p>
        </div>

        {/* card part - second column */}
        <div className="flex flex-col gap-8 mb-16 flex-1 w-full max-w-xl">
          {challenges.map((challenge, idx) => (
            <div
              key={challenge.title}
              className={`relative w-full flex ${idx % 2 === 0 ? 'justify-start' : 'justify-end'}`}
            >
              <div className="max-w-md w-full relative p-[1px] rounded-2xl bg-gradient-to-br from-white/10 to-transparent">
                <div className="sales-card group relative flex flex-col items-center xl:items-start justify-start p-8 gap-5 overflow-hidden rounded-2xl bg-background/40 backdrop-blur-xl border border-white/5 shadow-xl transition-all duration-500 hover:shadow-primary/20 hover:-translate-y-1">
                  {/* glow blob + fake position anchor (hidden) */}
                  <div
                    className="relative blob pointer-events-none opacity-20 mix-blend-screen group-hover:opacity-60"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: 250,
                      height: 250,
                      borderRadius: '50%',
                      filter: 'blur(60px)',
                      zIndex: -1,
                      transform: 'translate(-100px, -100px)',
                      background:
                        'radial-gradient(circle at 50% 50%, rgba(232,74,46,0.40), rgba(70, 22, 14, 0.10))',
                      transition: 'background 200ms ease, opacity 200ms ease, transform 300ms ease',
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    className="fakeblob relative"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: 250,
                      height: 250,
                      borderRadius: '50%',
                      zIndex: -1,
                      pointerEvents: 'none',
                      opacity: 0,
                    }}
                  />

                  <div className="flex gap-4 items-center justify-start w-full">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                      <challenge.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold font-brand text-foreground">
                      {challenge.title}
                    </h3>
                  </div>

                  <p className="text-base text-content1-foreground/70 leading-relaxed text-center xl:text-start">
                    {challenge.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

export default Features;
