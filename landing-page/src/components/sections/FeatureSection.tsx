'use client';

import { Card, CardBody } from '@heroui/react';
import useGradientIcons from 'landing-page/src/components/icons/useGradientIcons';
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
              className={`w-full flex ${idx % 2 === 0 ? 'justify-start' : 'justify-end'}`}
            >
              <div className="max-w-md p-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200 rounded-xl">
                <Card
                  classNames={{
                    base: 'rounded-xl',
                  }}
                >
                  <CardBody className="flex flex-col items-center xl:items-start justify-start p-6 gap-4 bg-default-50">
                    <div className="flex gap-3 items-center justify-start">
                      <challenge.icon className="w-7 h-7" />
                      <h3 className="text-xl font-medium leading-tight font-brand bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-800">
                        {challenge.title}
                      </h3>
                    </div>

                    <p className="text-sm text-content4-foreground leading-relaxed text-center xl:text-start">
                      {challenge.description}
                    </p>
                  </CardBody>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

export default Features;
