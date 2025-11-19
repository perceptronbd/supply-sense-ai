'use client';

import useGradientIcons from 'landing-page/src/components/icons/useGradientIcons';
import { useEffect } from 'react';
import SectionWrapper from '../ui/SectionWrapper';

const SECTION_ID = 'features';

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
    <SectionWrapper id={SECTION_ID} size="large">
      <div className="flex flex-col justify-center items-center lg:flex-row lg:justify-around gap-5">
        {/* text part - first column */}
        <div className="flex-1">
          <h1 className="font-brand text-3xl lg:text-4xl font-medium lg:font-bold text-content1-foreground text-center mx-auto xl:mx-0 xl:text-start max-w-md">
            You've Got Data. But Getting Answers Is Still a Pain.
          </h1>

          <p className="mt-6 text-lg text-content1-foreground text-center mx-auto xl:text-start xl:mx-0 max-w-md">
            If finding out what’s happening in your supply chain means: Logging into multiple
            systems, Calling someone from IT, Hunting through spreadsheets, Then you’re already
            wasting time and missing context.
          </p>
        </div>

        {/* card part - second column */}
        <div className="flex flex-col gap-6 mb-16 flex-1">
          {challenges.map((challenge, idx) => (
            <div
              key={challenge.title}
              className={`relative w-full flex ${idx % 2 === 0 ? 'justify-start' : 'justify-end'}`}
            >
              <div className="max-w-md relative p-0.5 rounded-xl">
                <div className="sales-card group relative flex flex-col items-center xl:items-start justify-start p-6 gap-4 overflow-hidden rounded-xl border-2 border-primary-200 shadow-lg backdrop-blur-md transition-shadow hover:shadow-2xl">
                  {/* glow blob + fake position anchor (hidden) */}
                  <div
                    className="relative blob pointer-events-none opacity-20 mix-blend-screen group-hover:opacity-100"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: 220,
                      height: 220,
                      borderRadius: '50%',
                      filter: 'blur(48px)',
                      zIndex: -1,
                      transform: 'translate(-100px, -100px)',
                      background:
                        'radial-gradient(circle at 30% 30%, rgba(232,74,46,0.14), rgba(70, 22, 14, 0.30))',
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
                      width: 220,
                      height: 220,
                      borderRadius: '50%',
                      zIndex: -1,
                      pointerEvents: 'none',
                      opacity: 0,
                    }}
                  />

                  <div className="flex gap-3 items-center justify-start">
                    <challenge.icon className="w-7 h-7" />
                    <h3 className="text-xl font-medium leading-tight font-brand bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-800">
                      {challenge.title}
                    </h3>
                  </div>

                  <p className="text-sm text-content4-foreground leading-relaxed text-center xl:text-start">
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
