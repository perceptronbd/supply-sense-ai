'use client';

import { Accordion, AccordionItem } from '@heroui/react';
import SectionWrapper from '../ui/SectionWrapper';

const QnASection = () => {
  const accordionData = [
    {
      key: '1',
      title: 'How do I connect my database?',
      description:
        'Detailed steps for database connection including configuration parameters, authentication methods, and connection tool usage guidelines.',
    },
    {
      key: '2',
      title: 'What details should be included in business description?',
      description:
        'Explanation of required information in business descriptions such as company name, business scope, data usage, and compliance requirements.',
    },
    {
      key: '3',
      title: 'Is my data secure?',
      description:
        'Comprehensive overview of our security measures including data encryption, access controls, backup strategies, and secure data transmission protocols.',
    },
    {
      key: '4',
      title: 'How can I optimize database performance?',
      description:
        'Best practices for database performance optimization including indexing strategies, query tuning, and resource allocation recommendations.',
    },
    {
      key: '5',
      title: 'Which database types are supported?',
      description:
        'Complete list of compatible database systems (MySQL, PostgreSQL, MongoDB, etc.) with version requirements and configuration details.',
    },
    {
      key: '6',
      title: 'How do I perform data migration?',
      description:
        'Step-by-step data migration process covering export/import methods, data validation procedures, and migration best practices.',
    },
    {
      key: '7',
      title: 'What is the Service Level Agreement (SLA)?',
      description:
        'Explanation of SLA terms including service availability guarantees, response time commitments, and incident resolution procedures.',
    },
    {
      key: '8',
      title: 'How do I monitor database status?',
      description:
        'Guide to using built-in monitoring tools, viewing key performance indicators (KPIs), and setting up alert notifications.',
    },
  ];
  return (
    <SectionWrapper id="qna" className="mx auto">
      <p className="text-content1-foreground text-xs text-center mb-2">
        Frequently asked questions
      </p>

      <h1 className="max-w-2xl font-brand leading-snug text-3xl md:text-4xl font-bold text-content1-foreground text-center mx-auto mb-8 md:mb-4">
        Everything you need to know
      </h1>

      <Accordion className="">
        {accordionData.map((accordion) => (
          <AccordionItem
            classNames={{
              title: 'font-bold text-lg font-inter text-content1-foreground',
              content: 'font-medium font-inter text-content1-foreground',
            }}
            key={accordion.key}
            title={accordion.title}
            aria-label={accordion.title}
          >
            {accordion.description}
          </AccordionItem>
        ))}
      </Accordion>
    </SectionWrapper>
  );
};

export default QnASection;
