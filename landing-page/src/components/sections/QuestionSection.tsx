'use client';

import { Card, CardBody, Chip } from '@heroui/react';
import { ChevronRight, Clock, CopyCheckIcon } from 'lucide-react';
import { useState } from 'react';
import SectionWrapper from '../ui/SectionWrapper';

type TTabs = 'Inventory' | 'Suppliers' | 'Users' | 'Analytics' | 'Documents';

const QuestionSection = () => {
  const [activeTab, setActiveTab] = useState<TTabs>('Inventory');

  const tabs = [
    { id: 'Inventory', label: 'Inventory', active: true },
    { id: 'Suppliers', label: 'Suppliers', active: false },
    { id: 'Users', label: 'Users', active: false },
    { id: 'Analytics', label: 'Analytics', active: false },
    { id: 'Documents', label: 'Documents', active: false },
  ];

  const questionsByTab = {
    Inventory: [
      {
        question: "What's the current inventory level of Cement in Chittagong?",
        time: '< 1 second',
      },
      {
        question: 'Which items are below reorder point at Branch A?',
        time: '< 1 second',
      },
      {
        question: 'When will we run out of steel rods at our current usage rate?',
        time: '< 1 second',
      },
      {
        question: "What's our total inventory value by category?",
        time: '< 1 second',
      },
    ],
    Suppliers: [
      // Add supplier questions later
    ],
    Users: [
      // Add user questions later
    ],
    Analytics: [
      // Add analytics questions later
    ],
    Documents: [
      // Add document questions later
    ],
  };

  const currentQuestions = questionsByTab[activeTab] || [];

  return (
    <SectionWrapper size="large">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="max-w-2xl pt-12 font-display leading-snug text-xl md:text-2xl font-bold text-foreground text-center mx-auto mb-6">
          What You Can Ask
        </h1>
        <p className="text-content1-foreground text-lg">
          Examples of questions Supply Sense can answer for your team:
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Chip
              classNames={{
                base: 'border-none rounded-lg',
              }}
              key={tab.id}
              variant={activeTab === tab.id ? 'solid' : 'bordered'}
              color={activeTab === tab.id ? 'secondary' : 'default'}
              className={`cursor-pointer transition-all ${
                activeTab === tab.id ? 'bg-secondary-500 text-bigStone-400' : 'text-bigStone-300'
              }`}
              onClick={() => setActiveTab(tab.id as TTabs)}
            >
              {tab.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* content */}
      <div className="pt-8 mb-16">
        {/* content Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-secondary-50 opacity-70 p-3 rounded-xl">
            <CopyCheckIcon className="w-6 h-6 text-content1-foreground" />
          </div>
          <h2 className="text-xl font-bold text-content1-foreground">{activeTab} Questions</h2>
        </div>

        {/* Questions */}
        {currentQuestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentQuestions.map((item) => (
              <Card
                shadow="sm"
                key={item.question}
                className=" transition-colors cursor-pointer group bg-gradient-to-r from-secondary-400/0 to to-secondary-400/15"
              >
                <CardBody className="p-6">
                  <div className="">
                    <div className="flex items-start gap-2 mb-3">
                      <ChevronRight className="w-6 h-6 text-content1-foreground" />
                      <div className="">
                        <p className="text-content1-foreground font-medium font-data mb-3">
                          "{item.question}"
                        </p>
                        <p className="flex items-center gap-1 text-content1-foreground text-sm font-data">
                          <Clock className="w-4 h-4" />
                          <span>Answer in {item.time}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 mb-16">
            <p className="text-content1-foreground text-lg">
              Questions for {activeTab} will be added soon.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-content1-foreground text-lg">
          If your question relates to your internal operations, Supply Sense can answer it.
        </p>
      </div>
    </SectionWrapper>
  );
};

export default QuestionSection;
