import { User } from 'lucide-react';
import Image from 'next/image';
import fullLogo from '../../../public/assets/full-logo.svg';
import logo from '../../../public/assets/logo.svg';
import SectionWrapper from '../ui/SectionWrapper';

const BuiltSection = () => {
  return (
    <SectionWrapper size="large">
      <div className="flex flex-col lg:flex-row items-center justify-center md:justify-between gap-6 lg:gap-16 bg-background">
        {/* first column */}
        <div className="max-w-lg">
          <h1 className="font-display leading-snug text-2xl md:text-4xl font-bold text-content1-foreground text-center mx-auto mb-6">
            Built for Clarity — Not Complexity
          </h1>

          <p className="text-content1-foreground">
            No dashboards to learn. No training required. Just ask questions in plain language and
            get clear, grounded answers from your system — whether it’s about stock, people,
            documents, or vendors.
          </p>
        </div>
        {/* second column */}
        <div>
          {/* chat box */}
          <div className="w-full max-w-3xl mx-auto">
            <div className="bg-gradient-to-r from-primary-50 to-secondary-200 p-0.5 rounded-2xl">
              <div className="bg-background rounded-2xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Image src={fullLogo} width={40} height={20} alt="fullLogo" className="w-36" />
                  <button type="button" className="px-4 py-2 rounded-lg text-secondary">
                    Clear Chat
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="space-y-4">
                  {/* User Message */}
                  <div className="flex justify-end items-start gap-3">
                    <div className="bg-secondary-50 max-w-lg rounded-xl p-4">
                      <p className="text-foreground text-sm">
                        "What items were requested in the last hour from Branch A?"
                      </p>
                    </div>
                    <div className="bg-secondary-100 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Bot Response */}
                  <div className="flex items-start gap-3">
                    <div className="bg-secondary-100 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Image src={logo} width={40} height={40} alt="Logo" className="w-6" />
                    </div>
                    <div className="bg-secondary-50 max-w-2xl rounded-xl p-4">
                      <p className="text-foreground text-sm">
                        » "Item #412 (steel rods) x 50, requested by Anwar Hossain at 2:43 PM."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default BuiltSection;
